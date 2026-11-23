# Detailed journeys

This document is rewritten for Telo Ride 1 and drops what Telo Ride 1 leaves out (see
[`journeys.md`](journeys.md)). Each journey there is split into vertical slices of 4 days or
fewer, in the same order. Estimates are working days for one intermediate developer, made from
[`specs/L2.md`](specs/L2.md), the mocks and the code carried over; the detailed designs are
rewritten for Telo Ride 1 but predate Intervals to the Beat and riding in Ibiza. **% complete** is 100% once a slice is merged into `main`; each slice sets its
own row, and the totals, when it finishes (see [`lessons-learned.md`](lessons-learned.md)).

**Requirements** names the L2s a slice proves. Before a slice is built, its detailed design is
brought in line with Telo Ride 1, and so is its mock where L2 lists a mock gap (`AGENTS.md`).

## Carried over from Telo Ride

Slices merged in Telo Ride whose requirement Telo Ride 1 keeps. They keep their numbers.

| # | Slice | Description | Days | Journey | Requirements | % complete |
|---|-------|-------------|------|---------|--------------|-----------|
| 1.1 | Frontend workspace | Angular libraries, ride app, lint, boundaries, budgets, tokens and fonts. | 3 | 1. Scaffold the product | L2-146 | 100% |
| 1.3 | Test harness | Fake Bluetooth and request fixtures for Playwright. | 2 | 1. Scaffold the product | L2-148 | 100% |
| 1.4 | CI | GitHub Actions: lint, build and one acceptance path per feature, in under 5 minutes. | 2 | 1. Scaffold the product | L2-149 AC2 | 100% |
| 2.1 | Ride a simulated bike | `?simulate` connects a simulated bike end to end. | 2 | 2. Connect a bike | L2-024 | 100% |
| 2.4 | Keep the bike connected | Keepalive and automatic reconnect every 3 seconds. | 3 | 2. Connect a bike | L2-016, L2-017 | 100% |
| 3.1 | Decode bike notifications | Parse Echelon and FTMS frames into power, cadence and resistance. | 2 | 3. Read live telemetry | L2-020, L2-021 | 100% |
| 3.2 | Show live metrics | Power, cadence and resistance update on every notification; estimated power adds to output. | 2 | 3. Read live telemetry | L2-023, L2-134 AC1 | 100% |
| 4.1 | Send target resistance | Frame commands; the bike follows the target and reports resistance back. | 3 | 4. Control resistance | L2-025, L2-026 | 100% |
| 4.2 | Take over resistance | Stepper raises or lowers resistance; the plan's level returns. | 2 | 4. Control resistance | L2-028 | 100% |
| 5.1 | Workout engine and ride clock | Plan steps through segments on a true clock and sends each target. | 3 | 5. Ride a solo class | L2-027 | 100% |
| 5.3 | Sync the class video | YouTube player follows the ride clock and seeks back when it drifts. | 3 | 5. Ride a solo class | L2-088 AC1–3, AC5–6 | 100% |

Not counted, though their code stays until a slice below replaces or removes it:

- **Redrawn by Telo Ride 1:** 2.2 Check browser support, 2.3 Pair a bike, 5.2 Class ride screen,
  5.4 Pause, leave or finish a class, 6.1 Class catalogue API and 6.3 Class start. Slices 29.1 to
  32.2 start from their code.
- **Left out by Telo Ride 1:** 1.2 Backend skeleton, 3.3 Show heart rate, 6.2 Class library and
  every slice of journeys 7 to 14. Journey 28 removes them.
- **Half of 1.4:** the API serving the app (ADR 0026) was replaced by slice 28.8 (ADR 0043).

## To build

| # | Slice | Description | Days | Journey | Requirements | % complete |
|---|-------|-------------|------|---------|--------------|-----------|
| 28.1 | Decide the backend | ADR 0037: Telo Ride 1 has no backend; the one class ships with the app and the rider's record stays on the device. | 1 | 28. Make it Telo Ride 1 | L2 open question 1 | 100% |
| 28.2 | Remove races | The race, the lobby, Race Setup, Map Select, ghost and bots, with their tests (ADR 0036). The `world` library and the Blender courses stay for riding in Ibiza; the other seven courses go in 30.1, the backend's race code after 28.1. | 3 | 28. Make it Telo Ride 1 | L1 (left out) | 100% |
| 28.3 | Remove group classes and live races | The ride hub client and everything that used it: the group chip, the choice on Class Start, the group's countdown and board, and in `backend/` the hub, live, group and race sessions, bots and race results (ADR 0038). An address with `?session=` rides solo. The map catalogue's file goes with progression in 28.4. | 1 | 28. Make it Telo Ride 1 | L1 (left out) | 100% |
| 28.4 | Remove sign-in and progression | Sign-in, display name and accounts; XP, rider levels, streaks, stars, unlocks and class tiers; the ride outbox and recorded rides; feedback and the custom workout; and in `backend/` accounts, authentication, progress, rides, workouts, feedback and the map catalogue, with a migration that drops their tables (ADR 0039). The app's only request is for the class catalogue. | 3 | 28. Make it Telo Ride 1 | L2-132 AC1, AC3 | 100% |
| 28.5 | Remove Home, Profile, the class library and heart rate | Home, Profile, Settings, Diagnostics with the packet log, the class library, the header's navigation and heart rate (ADR 0040). No menu or navigation is left; `/` shows Class Start for the one class, with no redirect, until slice 30.2 draws The Class, and the old addresses are page not found, with "Back to the class". What Settings set is fixed at its default, and the theme follows the device. | 2 | 28. Make it Telo Ride 1 | L2-080 AC4, L2-167 AC4 | 100% |
| 28.6 | Remove the marketing application | The `marketing` application, its build, scripts, verify and CI steps, its ESLint boundary and the seven components only it used (ADR 0041, superseding ADR 0027). The workspace is `ride` on `api`, `domain`, `components`, `video` and `world`. | 1 | 28. Make it Telo Ride 1 | L2-146 AC1–2 | 100% |
| 28.7 | Wordmark | TELO RIDE 1 on every header, and "Telo Ride 1" in every title and message. | 1 | 28. Make it Telo Ride 1 | L2-172 | 100% |
| 28.8 | Host as static files | Static files on Azure Static Web Apps: the build carries the host's configuration, with the fallback to the app, the L2-131 headers, a year of HSTS and the cache rules; the host redirects http. `backend/`, its tests, verify's and CI's .NET steps and `@angular/cdk` go, and `AGENTS.md` is brought in line (ADR 0043, carrying out ADR 0037). | 3 | 28. Make it Telo Ride 1 | L2-149 AC1, L2-009 AC2 | 100% |
| 29.1 | Connect Bike | The screen as designed: the offered bike and the works-with list at rest, searching while the browser's list of bikes is open, the bike picked there pairing, paired, then The Class. | 3 | 29. Pair the bike | L2-007, L2-011, L2-012 AC1–3, L2-013, L2-014 AC1–2, AC4 | 100% |
| 29.2 | Say why the bike cannot be reached | Alerts for Bluetooth off, an unsupported browser, plain http and a chooser that will not open. | 2 | 29. Pair the bike | L2-008 AC1, L2-009 AC4, L2-012 AC4, L2-018 | 100% |
| 30.1 | The one class | `intervals-to-the-beat` with its 33-segment plan, the course's, shipped with the app and validated; no other class and no other course (ADR 0042); a class that cannot be loaded says so. | 2 | 30. Open on The Class | L2-080 AC1–5 | 100% |
| 30.2 | The Class | The screen in the place of Class Start (ADR 0044): the header's bike status as a link to Connect Bike, the parked video and its cover when it cannot load, title, summary, length, "Start class" or "Connect your bike"; and "Ride with": "Class video" or "Ibiza Sunset Strip", kept on the device, with the course's still, disabled where the course cannot be drawn. The ride follows the choice: the video alone, or the carried-over ride in the course until journey 37. | 3 | 30. Open on The Class | L2-019, L2-084 AC1, AC4, AC6–7, AC9, L2-173 AC1–7 | 100% |
| 30.3 | What the bike will do | "~254 W average", the plan's time-weighted target power; the resistance profile, a bar a segment; and "17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal.", read from the plan. The plan chart carried over from Telo Ride leaves The Class. | 1 | 30. Open on The Class | L2-084 AC2–3 | 100% |
| 30.4 | The Class by form factor | One screen with no scrolling in landscape from 1024 px; one column with the start button pinned below. | 2 | 30. Open on The Class | L2-171 AC1–3, AC5 | 100% |
| 30.5 | Open where the rider belongs | A new rider opens on Connect Bike, in a blocked browser too, and a rider with a remembered bike on The Class (a finished ride counts from slice 32.1); the remembered bike reconnects without the chooser as soon as it advertises, and only its name and identifier are kept. | 2 | 30. Open on The Class | L2-015, L2-167 AC1–3 | 100% |
| 30.6 | The Class in a blocked browser | Chrome-or-Edge and HTTPS alerts under the header, Copy link with its copied state, a disabled start button; the ride's address (`/ride` from 31.1) opens The Class and nothing is asked of Bluetooth. | 2 | 30. Open on The Class | L2-008 AC2–4, L2-009 AC1, AC3, L2-010 | 100% |
| 31.1 | Class Ride | The screen as designed at `/ride`, which only a connected bike opens: header, clock, segment card, power against target, cadence aim and stepper; no scrolling in landscape from 768 px, with the class video or the course in the box. | 3 | 31. Take the class | L2-087, L2-089 | 100% |
| 31.2 | Pause, lose the bike, leave or finish | Pause and resume, each announced once; a lost bike holds the ride until it is back, when the segment's level is sent again; Leave returns to The Class with no confirmation; 20:00 finishes the ride (it opens the carried-over result until Class Done is built, 32.2); no resistance command follows a ride. | 3 | 31. Take the class | L2-091, L2-092, L2-093 | 100% |
| 31.3 | When the video or the bike falls short | The video that cannot play, a video stalled for 10 s of the ride included, and the FTMS bike that refuses control, does not answer or has no control point, each with its notice; no resistance command to such a bike, after a reconnect included; neither notice scrolls Class Ride in landscape. | 2 | 31. Take the class | L2-014 AC3, L2-088 AC4, L2-135 AC1 | 100% |
| 37.1 | The course in the video's box | A ride in Ibiza opens Class Ride at once, with no loading screen and no video player: the clock starts, the box reads "Loading Ibiza Sunset Strip" over the still, then the course is drawn there with the rider alone on the road. World loading, the inset video, Telo Ride's worlds and their music go (ADR 0047); the still becomes one of the solo ride. | 4 | 37. Ride in Ibiza | L2-089 AC6, L2-173 AC9, L2-174 AC1, AC6, L2-175 AC1, AC3 | 100% |
| 37.2 | Placed by the clock | The rider is on the stretch of the plan's segment at each second, held while paused or while the bike is lost, not drawn in a hidden tab, with the camera closing in at the grid and the finish; everything else on the screen as with the class video. | 3 | 37. Ride in Ibiza | L2-174 AC2, AC4–5, AC9–10 | 100% |
| 37.3 | The course as built | Each stretch's length and gradient from the plan, the painted grid and the finish arch at the last metre; a bad value in the course's files makes it malformed. | 2 | 37. Ride in Ibiza | L2-174 AC3, AC7, L2-175 AC6, L2 open question 18 | 100% |
| 37.4 | When Ibiza cannot be drawn | Files that cannot be loaded or a lost graphics context leave the still and "Ibiza can’t be drawn. The bike will still follow the class."; the course is kept after its first load and drawn without a network. | 2 | 37. Ride in Ibiza | L2-175 AC2, AC4–5 | 100% |
| 37.5 | Music | *Beautiful Boom Bap*, self-hosted, looping through a ride in Ibiza only: fetched when that ride starts, paused with the ride, playing on in a hidden tab, released on leaving. (The course's deep house track went with slice 37.1; until this slice a ride in Ibiza is silent.) | 3 | 37. Ride in Ibiza | L2-176 AC1–4, AC6, AC8–9 | 100% |
| 37.6 | The Music button | A "Music" toggle on Class Ride in Ibiza, kept on the device; disabled, with no alert, when the music cannot be loaded or played. | 1 | 37. Ride in Ibiza | L2-176 AC5, AC7 | 100% |
| 37.7 | The course's budgets | At most 120,000 triangles and 140 draw calls a frame, no shadow map or texture; the model and the music within their sizes; resolution and bloom stepped by measured frames. | 2 | 37. Ride in Ibiza | L2-177 AC1–3 | 100% |
| 37.8 | Leave Ibiza clean | Leaving or finishing stops the frame loop and disposes the course, the rider and the renderer; the interface's frames and the heap over a full ride hold on the reference tablet. | 2 | 37. Ride in Ibiza | L2-174 AC8, L2-177 AC4–5 | 100% |
| 37.9 | One record whichever way | A ride in Ibiza counts toward the one record, with no count or best of its own. | 1 | 37. Ride in Ibiza | L2-173 AC8 | 100% |
| 32.1 | Keep the record | Ride count, best output and last output kept on the device, fixed in size; a ride left early changes nothing. | 2 | 32. See your number | L2-132 AC2–4, L2-168 AC1–3, AC5 | 100% |
| 32.2 | Class Done | Output in kJ, time and average watts; Done returns to The Class; `/done` with no ride opens The Class. | 3 | 32. See your number | L2-078, L2-079 AC1 | 100% |
| 32.3 | Best output | "New best output" in gold with the previous best, "Your best is still", or the first ride's number to beat. | 1 | 32. See your number | L2-077 | 100% |
| 32.4 | The eight efforts | Each effort's average watts as a bar, the strongest set apart, rising in turn. | 2 | 32. See your number | L2-142 AC2, L2-169 | 100% |
| 32.5 | On target | The share of the ride within 10% of target power. | 1 | 32. See your number | L2-170 | 100% |
| 32.6 | Come back to beat it | The Class shows rides, best output and last time, and its button reads "Ride it again". | 1 | 32. See your number | L2-079 AC2, L2-084 AC5, AC8, L2-171 AC4 | 100% |
| 32.7 | A ride that could not be saved | Class Done still shows the result and says the ride was not saved on this device. | 1 | 32. See your number | L2-168 AC4 | 100% |
| 33.1 | Keep the ride clock true | Clock, plan and output stay right in a hidden tab; the screen stays awake; closing the tab asks first. | 2 | 33. Ride through a hidden tab or lost network | L2-016 AC2, L2-133 | 100% |
| 33.2 | Ride without a network | A ride carries on and finishes offline; the class still shows after a first visit. | 2 | 33. Ride through a hidden tab or lost network | L2-080 AC5, L2-135 | 100% |
| 34.1 | Bundle budgets | Initial bundle at most 300 KB gzipped, lazy routes, the video player only where a video shows. | 1 | 34. Stay smooth on long rides | L2-136 AC1 | 100% |
| 34.2 | Running totals only | A ride holds its totals and no trace that grows with its length. | 1 | 34. Stay smooth on long rides | L2-138 AC2 | 100% |
| 34.3 | Heap checks | Heap stays stable over 3 hours and across ten rounds of The Class and Class Ride. | 2 | 34. Stay smooth on long rides | L2-138 AC1, AC3 | 100% |
| 34.4 | Web vitals and readouts | LCP, INP and frame times on the reference tablet; readouts update once a second. | 2 | 34. Stay smooth on long rides | L2-134 AC2, L2-136 AC2–3 | 100% |
| 35.1 | Restrict third parties | A Content Security Policy and headers that allow only the app and the YouTube player. | 2 | 35. Keep it private | L2-131 | 100% |
| 35.2 | Treat bike and stored data as untrusted | Device names as text, cut to 64 characters; a malformed record means a new rider; console logs only. | 1 | 35. Keep it private | L2-115, L2-129 | 100% |
| 36.1 | Fit every width | 320 to 2560 px with no sideways scroll, on all four screens. | 2 | 36. Use by touch, keyboard and screen reader | L2-139 | 100% |
| 36.2 | Touch and keyboard | 44 px targets, 48 px resistance buttons, visible focus and "Skip to content". | 2 | 36. Use by touch, keyboard and screen reader | L2-140 | 100% |
| 36.3 | Screen readers, contrast and motion | One `h1` a screen, state changes announced once, contrast in both themes, reduced motion. | 2 | 36. Use by touch, keyboard and screen reader | L2-141, L2-142 AC1, AC3 | 100% |
| 36.4 | Theme and full screen | Dark by default, light when the device asks; Full screen on every header. | 1 | 36. Use by touch, keyboard and screen reader | L2-143, L2-144 | 0% |
| 36.5 | Page not found | "This page doesn’t exist." with "Back to the class". | 1 | 36. Use by touch, keyboard and screen reader | L2-145 | 0% |

**Total:** 59 slices, 119 days. **Complete:** 57 slices, 117 days (98%), 11 of them carried over.
**To build:** 2 slices, 2 days. Slice 30.2 added journey 37, nine slices and 20 days: no slice of
the plan built riding in Ibiza (L2-174 to L2-177).

## What a slice waits for

- **28.1** decided where the class comes from (ADR 0037: with the app, no backend), so 30.1, 28.8 and 35.1 follow it.
- **30.1** is built: the app calls no API (ADR 0042). **28.8** is built after it: the backend is gone and the host is
  Azure Static Web Apps (ADR 0043), so 35.1 narrows the policy in `staticwebapp.config.json`.
- **L2's open questions:** 30.1 closed the class's words and its warm-up and cool-down cadence
  aims (11); 30.2 built "Ride with" in L2-173's words; 30.3 built the line under the plan in L2-084's; the words of
  37.6 built L2-176's (its button has no words but "Music"), 37.4 built the notice in L2-175's, and 37.1 built "Loading Ibiza Sunset Strip" in L2-175's; 37.1 closed how the two ways are ridden (20), the still (21) and the pale shape (26); 37.2 closed where the camera sits and what "at that second" means (30); 37.3 closed how steep a level is (18); 32.5
  builds a rule that is still a proposal (2), which 31.1 built for the line under Power; 32.2 shows a Time that is
  always 20:00 (3); 31.1 closed the header buttons' size (10) and built `/ride` (7); 31.2 closed
  the words a screen reader hears on Pause and Resume and left open whether Leave ends a lost
  bike's retries (28); 31.3 settled the second notice's words, the 10 seconds of a stalled video and what
  refusing control is, and left open the two notices together (29).
- **L2's mock gaps**, each drawn before its slice is built (29.2 drew the HTTPS and chooser alerts,
  30.1 the class that cannot be loaded):
  30.2 drew the video that cannot load and "Ride with";
  31.1 drew power off target;
  31.2 drew paused and the lost bike's copy in Ibiza; 31.3 drew both notices and the two together; 32.4
  (every effort at 0 W), and 32.7 are to draw; 37.6 drew the Music button; 37.4 drew the notice; 37.1 drew the
  course in the box and its loading.
- **Journey 37** follows journey 31: 37.1 builds on Class Ride as designed (31.1) and on the
  choice 30.2 built; 37.2 to 37.8 follow 37.1; 37.9 waits for the record (32.1).
