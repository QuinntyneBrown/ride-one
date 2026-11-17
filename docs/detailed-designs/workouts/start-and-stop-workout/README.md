# Start and stop a workout

## Overview

A workout is a finite plan that Wattzup runs once, from 0:00 to its total time, setting the bike's resistance for each segment. This feature is the control surface for that plan: the HTTP endpoints that accept a plan, start it, pause and resume it, hand control back to the plan after a manual override, stop it, and return the ride's power history. It also covers the dashboard's Pause and Resume button. The backend validates every plan before it accepts it, and reports each rejected field with the same message the setup screen shows.

**plan** — JSON object of kind `hiit` or `flat`, with snake_case fields (L2-010):

| Kind | Field | Allowed values |
|---|---|---|
| `hiit` | `rounds` | integer 1–30 |
| | `work_seconds`, `rest_seconds` | integer 5–3600 |
| | `work_level`, `rest_level` | integer 1–32 |
| | `warmup`, `cooldown` | boolean |
| `flat` | `level` | integer 1–32 |
| | `minutes` | integer 1–180 |
| | `cadence` | integer 40–150 |

**errors map** — JSON object from field name to an array of messages, carried by a rejection's ProblemDetails body

**active workout** — workout whose status is `waiting for bike`, `running`, `paused` or `paused: bike disconnected`

**paused by the rider** — status `paused`, set by `POST /api/workout/pause`; distinct from `paused: bike disconnected`, which the engine sets on its own

Execution belongs to `run-interval-workout`. The setup screen that builds the plan and its replace-ride dialog belong to `set-up-ride`. The End button and its confirmation dialog belong to the dashboard (L2-051); this feature supplies the stop endpoint they call.

## Description

Backend, `Wattzup.Api`:

- **`WorkoutEndpoints`** — maps the route group `/api/workout` (L2-017). Each endpoint validates its input, calls one Core service, and holds no rule.
  - `POST /api/workout` reads the body as a `JsonElement` and passes it to `WorkoutPlanValidator.Validate`. On failure it returns `400` through `Results.ValidationProblem(errors, extensions: { code = "invalid_workout" })`. On success it awaits `WorkoutEngine.StartAsync(plan)` and returns `200 {"started": <workout>}`, whether or not the bike is connected. The endpoint declares `Accepts<WorkoutPlan>`, so the OpenAPI document describes the plan as a `kind`-discriminated union.
  - `POST /api/workout/stop` awaits `WorkoutEngine.StopAsync()` and always returns `200 {"stopped":true}`. With no workout, `workout` stays `null`. A workout that has already ended keeps its status.
  - `POST /api/workout/pause`, `/resume` and `/back-to-plan` await the matching engine method. With no active workout they return `409` ProblemDetails with `code` = `no_active_workout`. Otherwise they return `200 {"workout": <workout>}`.
  - `GET /api/workout/trace` returns `200 {"samples":[[ride_seconds, power], ...]}` from the power trace history (L2-050). With no workout, `samples` is `[]`.
- **`WorkoutProblems`** — builds the two ProblemDetails bodies with a generic `title` and the `code` extension. Request detail goes only to the server log (L2-036).
- Malformed JSON and an oversized body are rejected before validation. Their answer is also `400` with `code` = `invalid_workout`; the errors map is `{"body":["The request body is not valid JSON."]}` (L2-010).

Backend, `Wattzup.Core`:

- **`WorkoutPlanValidator.Validate(JsonElement)`** — pure static function returning `PlanValidationResult { WorkoutPlan? Plan; IReadOnlyDictionary<string, string[]> Errors }`. It is the only creator of `WorkoutPlan` (L2-010). It checks the fields in this order:
  1. `kind` is `hiit` or `flat`; otherwise `kind` is named and no further field is checked.
  2. Each field of that kind is present and of the right JSON type: an integer number (no fraction) or a boolean. A missing or mistyped field is named; its message is `Enter a whole number.` for a number, `Choose on or off.` for a switch, and `Choose HIIT or Flat.` for `kind` (L2-010).
  3. Each integer is in range, with the messages of L2-010 shown in the table below.

The validator reports every failing field, not only the first.

| Field | Rule | Message |
|---|---|---|
| `rounds` | 1–30 | `Enter 1 to 30 rounds.` |
| `work_seconds` | at least 5 | `Work must be at least 0:05.` |
| `rest_seconds` | at least 5 | `Recover must be at least 0:05.` |
| `work_seconds`, `rest_seconds` | at most 3600 | `Work must be at most 60:00.` / `Recover must be at most 60:00.` |
| `work_level`, `rest_level`, `level` | 1–32 | `Level must be 1 to 32.` |
| `minutes` | 1–180 | `Enter 1 to 180 minutes.` |
| `cadence` | 40–150 | `Cadence goal must be 40 to 150 rpm.` |

- **`WorkoutEngine`** — `StartAsync`, `StopAsync`, `PauseAsync`, `ResumeAsync` and `BackToPlanAsync` post a command to the engine loop and await its reply (see `run-interval-workout`). The commands behave as follows:
  - **Start** replaces any active workout and begins the new one at segment 0, `elapsed_seconds` 0, with fresh ride totals (L2-013).
  - **Stop** sets `status` to `stopped`, stops ticking, leaves the bike at its current level, and broadcasts (L2-013).
  - **Pause** sets the rider-pause flag. With the bike connected, `status` becomes `paused` at once, the ride clock stops, and nothing is sent (L2-046). Pausing an already paused workout changes nothing and answers `200`.
  - **Resume** clears the flag and the segment's sent marker, so the plan level is sent again. The status becomes `running` if the bike is connected, otherwise `waiting for bike` (ride not started) or `paused: bike disconnected` (L2-046).
  - **Back-to-plan** sets `mode` to `plan` and sends `plan_level` at once (L2-047).
  - `CommandResult` tells the endpoint whether an active workout existed.
- While a workout is `paused` and the bike stays connected, the engine keeps `DisconnectedSince` empty, so the 90-second shut-off clock does not run (L2-046).

Treadmill (ADR 0009):

- `POST /api/workout` passes the chosen machine: `WorkoutPlanValidator.Validate(body, machine)` with `store.Current.Machine`. On the treadmill the speed and incline fields of L2-067 are validated and the bike's level and cadence fields are ignored; on the bike L2-010 applies unchanged (`treadmill/run-treadmill-workout`).
- On a treadmill run, start and resume run the 3-second belt countdown (status `starting belt`) before the ride clock moves. Pause, stop and replace write the stop-belt command once, with response, if the treadmill is connected (L2-066, `treadmill/control-the-belt`).
- `starting belt` and `paused: belt stopped` are active statuses, so pause, resume and back-to-plan accept them and stop ends them.

Frontend, `frontend`:

- **`WorkoutApi`** (`src/app/core/workout-api.ts`) — contract with `start(plan)`, `stop()`, `pause()`, `resume()`, `backToPlan()` and `trace()`. Request and response types (`WorkoutPlan`, `Workout`, `TraceResponse`, `ProblemDetails`) come from the generated client in `src/app/api/`. The injection token `WORKOUT_API` is bound to `HttpWorkoutApi` in `app.config.ts`, and components inject the token.
- **`RideControls`** (`src/app/dashboard/ride-controls/`, selector `wz-ride-controls`, block `ride-controls`) — the app bar's Pause or Resume button. It keeps the mock's `btn` and `btn__label` classes and follows the ride page's `default`, `paused` and `ended` mocks (`docs/mocks/pages/ride/`). It reads `LiveStateService.state()` and shows the states in the table below (L2-046). Pressing the button calls `WORKOUT_API.pause()` or `resume()`. The button does not change its own label: the label follows the next streamed state. While the event stream is down, the button is disabled (L2-054). A failed request shows a danger toast (L2-053): `Couldn't pause the ride` or `Couldn't resume the ride` / `The Wattzup server didn't answer. Try again.` (L2-046).

| Workout | Button | Enabled |
|---|---|---|
| `running`, `waiting for bike`, `paused: bike disconnected` | Pause | yes |
| `paused` | Resume, beside the `Paused` badge (`show-workout-countdown`) | yes |
| `ended`, `ended: bike shut off`, `stopped`, none, or no state yet | Pause | no |

### Ride-along video in the plan

Every plan kind accepts an optional `video` `{url, start_seconds}` on either machine (L2-010 criteria 14 to 17, ADR 0012). `WorkoutPlanValidator` reads the link through `YouTubeLink.TryParseId`, keeps only the 11-character id and the start point rounded to 0.1, and drops the link. The validated plan carries `RideVideo(VideoId, StartSeconds)`, reported as `plan.video` `{video_id, start_seconds}`, or `null` without a video. A rejected link is named `video.url` with `That doesn't look like a YouTube link.`; a start point outside 0 to 43200 is named `video.start_seconds` with `Start point must be 0:00 to 12:00:00.` A video changes neither the segments nor the summary nor the ride. The backend never fetches the link. The parser, its table tests and `RideVideoTests` are described in `workouts/ride-along-video`.

### Acceptance tests

Backend, `Wattzup.Api.AcceptanceTests` (`WebApplicationFactory`, `SimulatedBikeTransport`, `FakeTimeProvider`, state read from the in-memory SSE response):

- `A_valid_hiit_plan_starts_a_workout` and `A_valid_flat_plan_starts_a_workout` (L2-010 AC1, AC2; L2-017 AC1)
- `A_plan_starts_while_the_bike_is_not_connected` (L2-017 AC1)
- `An_out_of_range_field_is_rejected_with_invalid_workout_and_its_message` — one representative path, `rounds` 31 (L2-010 AC3, AC8; L2-017 AC2)
- `An_unknown_kind_is_rejected_and_no_workout_starts` (L2-010 AC7)
- `Stop_answers_stopped_true_and_marks_the_workout_stopped` (L2-017 AC3; L2-013 AC6)
- `Stop_with_no_workout_answers_200_and_workout_stays_null` (L2-017 AC4)
- `Pause_resume_and_back_to_plan_without_a_workout_answer_409_no_active_workout` (L2-017 AC5)
- `Pause_freezes_the_ride_clock_and_resume_continues_from_the_same_point` (L2-046 AC1, AC2)
- `Resume_while_disconnected_returns_paused_bike_disconnected` (L2-046 AC2)
- `A_paused_ride_with_the_bike_connected_is_not_shut_off_after_90_seconds` (L2-046 AC3)
- `Trace_with_no_workout_returns_empty_samples` (L2-017, L2-050 AC2)

`Wattzup.Core.Tests`: `WorkoutPlanValidatorTests` holds one case per row of the validation table, plus each L2-010 AC7 case (unknown kind, missing field, fractional number, non-boolean switch) and a body with several failing fields.

Frontend, Playwright (`frontend/e2e/`), with every `/api/**` request answered by the shared fixture and `/api/events` served by the SSE fixture:

- `e2e/pages/ride.page.ts` — the ride page object, which owns the Pause, Resume and End locators.
- `e2e/ride-controls.spec.ts`:
  - `shows Pause while running and Resume with the Paused badge when paused` (L2-046 AC4)
  - `pressing Pause posts /api/workout/pause` (L2-046 AC1)
  - `disables Pause and Resume once the ride has ended or stopped` (L2-046 AC5)
- Recorded responses for `POST /api/workout/pause` and `/resume` are captured against the backend running with `--simulate`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-010` | `L1-004` | Workout plan definition and validation. A workout is defined by a plan of one of two kinds, `hiit` or `flat`, submitted as JSON with snake_case fields; any rejection is a ProblemDetails with `code` = `invalid_workout` and an `errors` map from field name to messages. |
| `L2-017` | `L1-005` | Workout endpoints. `POST /api/workout` with a plan body (L2-010), `POST /api/workout/stop`, `POST /api/workout/pause`, `POST /api/workout/resume`, `POST /api/workout/back-to-plan`, and `GET /api/workout/trace`. |
| `L2-046` | `L1-004` | Pause and resume. A `running` workout pauses on `POST /api/workout/pause` and continues from the same point on `POST /api/workout/resume`; the dashboard shows Pause or Resume accordingly. |

## Diagrams

### System context

The rider starts, pauses, resumes and stops workouts through Wattzup, which drives the bike.

![C4 system context for starting and stopping a workout](diagrams/c4-context.png)

### Containers

Wattzup Web calls the workout endpoints on the Wattzup API, which validates plans and controls the engine.

![C4 container view for starting and stopping a workout](diagrams/c4-container.png)

### Components

`RideControls` and the setup screen call `WorkoutApi` through its token. `WorkoutEndpoints` validates through `WorkoutPlanValidator` and controls `WorkoutEngine`.

![C4 component view for starting and stopping a workout](diagrams/c4-component.png)

### Class structure

Only `WorkoutPlanValidator` creates a `WorkoutPlan`, so the engine never sees an invalid plan. The frontend depends on the `WorkoutApi` contract, not on its HTTP implementation.

![Class diagram for starting and stopping a workout](diagrams/class-structure.png)

### Behaviour — start a workout

The endpoint validates the plan (L2-010). A rejection names every failing field with `code` = `invalid_workout`. An accepted plan replaces any active workout and answers with the new workout (L2-017).

![Sequence diagram for starting a workout](diagrams/sequence-start-workout.png)

### Behaviour — pause and resume

Pause and resume answer 409 with no active workout. Otherwise the engine freezes or continues the ride clock, and the button's label follows the streamed status (L2-046).

![Sequence diagram for pausing and resuming a workout](diagrams/sequence-pause-resume.png)

### Behaviour — stop a workout

Stop always succeeds. It ends ticking, marks an active workout `stopped`, and leaves the bike at its current level (L2-013, L2-017).

![Sequence diagram for stopping a workout](diagrams/sequence-stop-workout.png)
