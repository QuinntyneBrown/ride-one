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
- **Half of 1.4:** the API serving the app (ADR 0026) is replaced by slice 28.8.

## To build

| # | Slice | Description | Days | Journey | Requirements | % complete |
|---|-------|-------------|------|---------|--------------|-----------|
| 28.1 | Decide the backend | ADR 0037: Telo Ride 1 has no backend; the one class ships with the app and the rider's record stays on the device. | 1 | 28. Make it Telo Ride 1 | L2 open question 1 | 100% |
| 28.2 | Remove races | The race, the lobby, Race Setup, Map Select, ghost and bots, with their tests (ADR 0036). The `world` library and the Blender courses stay for riding in Ibiza; the other seven courses go in 30.1, the backend's race code after 28.1. | 3 | 28. Make it Telo Ride 1 | L1 (left out) | 100% |
| 28.3 | Remove group classes and live races | The ride hub client and everything that used it: the group chip, the choice on Class Start, the group's countdown and board, and in `backend/` the hub, live, group and race sessions, bots and race results (ADR 0038). An address with `?session=` rides solo. The map catalogue's file goes with progression in 28.4. | 1 | 28. Make it Telo Ride 1 | L1 (left out) | 100% |
| 28.4 | Remove sign-in and progression | Sign-in, display name, accounts, XP, rider levels, streaks, stars, unlocks and recorded rides. | 3 | 28. Make it Telo Ride 1 | L2-132 AC1 | 0% |
| 28.5 | Remove Home, Profile, the class library and heart rate | No menu or navigation is left; `/` opens the one class until slice 30.2 draws The Class. | 2 | 28. Make it Telo Ride 1 | L2-080 AC4, L2-167 AC4 | 0% |
| 28.6 | Remove the marketing application | The workspace is `ride` on `api`, `domain`, `components` and `video`; an ADR supersedes ADR 0027. | 1 | 28. Make it Telo Ride 1 | L2-146 AC1–2 | 0% |
| 28.7 | Wordmark | TELO RIDE 1 on every header, and "Telo Ride 1" in every title and message. | 1 | 28. Make it Telo Ride 1 | L2-172 | 0% |
| 28.8 | Host as static files | Static files over HTTPS with an http redirect and HSTS; the backend's projects, tests and CI job go (ADR 0037). | 3 | 28. Make it Telo Ride 1 | L2-149 AC1, L2-009 AC2 | 0% |
| 29.1 | Connect Bike | The screen as designed: works-with list, searching, the bike to pair, pairing, paired, then The Class. | 3 | 29. Pair the bike | L2-007, L2-011, L2-012 AC1–3, L2-013, L2-014 AC1–2, AC4 | 0% |
| 29.2 | Say why the bike cannot be reached | Alerts for Bluetooth off, an unsupported browser, plain http and a chooser that will not open. | 2 | 29. Pair the bike | L2-008 AC1, L2-009 AC4, L2-012 AC4, L2-018 | 0% |
| 30.1 | The one class | `gcn-30-hiit` with its plan, validated; no other class; a class that cannot be loaded says so. | 2 | 30. Open on The Class | L2-080 AC1–4 | 0% |
| 30.2 | The Class | Header with bike status, parked video, title, summary, length and the start button's three states. | 3 | 30. Open on The Class | L2-019, L2-084 AC1, AC4, AC6–7, AC9 | 0% |
| 30.3 | What the bike will do | Average target power, the resistance profile and the efforts in words. | 1 | 30. Open on The Class | L2-084 AC2–3 | 0% |
| 30.4 | The Class by form factor | One screen with no scrolling in landscape from 1024 px; one column with the start button pinned below. | 2 | 30. Open on The Class | L2-171 AC1–3, AC5 | 0% |
| 30.5 | Open where the rider belongs | A new rider opens on Connect Bike, a returning one on The Class; the remembered bike reconnects without the chooser. | 2 | 30. Open on The Class | L2-015, L2-167 AC1–3 | 0% |
| 30.6 | The Class in a blocked browser | Chrome-or-Edge and HTTPS alerts, Copy link, a disabled start button; `/ride` opens The Class. | 2 | 30. Open on The Class | L2-008 AC2–4, L2-009 AC1, AC3, L2-010 | 0% |
| 31.1 | Class Ride | The screen as designed at `/ride`: header, clock, segment card, power against target, cadence aim and stepper. | 3 | 31. Take the class | L2-087, L2-089 | 0% |
| 31.2 | Pause, lose the bike, leave or finish | Pause and resume; a lost bike holds the ride until it is back; Leave returns to The Class; 30:00 opens Class Done. | 3 | 31. Take the class | L2-091, L2-092, L2-093 | 0% |
| 31.3 | When the video or the bike falls short | The video that cannot play and the FTMS bike that refuses control, each with its notice. | 2 | 31. Take the class | L2-014 AC3, L2-088 AC4 | 0% |
| 32.1 | Keep the record | Ride count, best output and last output kept on the device, fixed in size; a ride left early changes nothing. | 2 | 32. See your number | L2-132 AC2–4, L2-168 AC1–3, AC5 | 0% |
| 32.2 | Class Done | Output in kJ, time and average watts; Done returns to The Class; `/done` with no ride opens The Class. | 3 | 32. See your number | L2-078, L2-079 AC1 | 0% |
| 32.3 | Best output | "New best output" in gold with the previous best, "Your best is still", or the first ride's number to beat. | 1 | 32. See your number | L2-077 | 0% |
| 32.4 | The eight efforts | Each effort's average watts as a bar, the strongest set apart, rising in turn. | 2 | 32. See your number | L2-142 AC2, L2-169 | 0% |
| 32.5 | On target | The share of the ride within 10% of target power. | 1 | 32. See your number | L2-170 | 0% |
| 32.6 | Come back to beat it | The Class shows rides, best output and last time, and its button reads "Ride it again". | 1 | 32. See your number | L2-079 AC2, L2-084 AC5, AC8, L2-171 AC4 | 0% |
| 32.7 | A ride that could not be saved | Class Done still shows the result and says the ride was not saved on this device. | 1 | 32. See your number | L2-168 AC4 | 0% |
| 33.1 | Keep the ride clock true | Clock, plan and output stay right in a hidden tab; the screen stays awake; closing the tab asks first. | 2 | 33. Ride through a hidden tab or lost network | L2-016 AC2, L2-133 | 0% |
| 33.2 | Ride without a network | A ride carries on and finishes offline; the class still shows after a first visit. | 2 | 33. Ride through a hidden tab or lost network | L2-080 AC5, L2-135 | 0% |
| 34.1 | Bundle budgets | Initial bundle at most 300 KB gzipped, lazy routes, the video player only where a video shows. | 1 | 34. Stay smooth on long rides | L2-136 AC1 | 0% |
| 34.2 | Running totals only | A ride holds its totals and no trace that grows with its length. | 1 | 34. Stay smooth on long rides | L2-138 AC2 | 0% |
| 34.3 | Heap checks | Heap stays stable over 3 hours and across ten rounds of The Class and Class Ride. | 2 | 34. Stay smooth on long rides | L2-138 AC1, AC3 | 0% |
| 34.4 | Web vitals and readouts | LCP, INP and frame times on the reference tablet; readouts update once a second. | 2 | 34. Stay smooth on long rides | L2-134 AC2, L2-136 AC2–3 | 0% |
| 35.1 | Restrict third parties | A Content Security Policy and headers that allow only the app and the YouTube player. | 2 | 35. Keep it private | L2-131 | 0% |
| 35.2 | Treat bike and stored data as untrusted | Device names as text, cut to 64 characters; a malformed record means a new rider; console logs only. | 1 | 35. Keep it private | L2-115, L2-129 | 0% |
| 36.1 | Fit every width | 320 to 2560 px with no sideways scroll, on all four screens. | 2 | 36. Use by touch, keyboard and screen reader | L2-139 | 0% |
| 36.2 | Touch and keyboard | 44 px targets, 48 px resistance buttons, visible focus and "Skip to content". | 2 | 36. Use by touch, keyboard and screen reader | L2-140 | 0% |
| 36.3 | Screen readers, contrast and motion | One `h1` a screen, state changes announced once, contrast in both themes, reduced motion. | 2 | 36. Use by touch, keyboard and screen reader | L2-141, L2-142 AC1, AC3 | 0% |
| 36.4 | Theme and full screen | Dark by default, light when the device asks; Full screen on every header. | 1 | 36. Use by touch, keyboard and screen reader | L2-143, L2-144 | 0% |
| 36.5 | Page not found | "This page doesn’t exist." with "Back to the class". | 1 | 36. Use by touch, keyboard and screen reader | L2-145 | 0% |

**Total:** 50 slices, 99 days. **Complete:** 14 slices, 32 days (32%), 11 of them carried over.
**To build:** 36 slices, 67 days.

## What a slice waits for

- **28.1** decided where the class comes from (ADR 0037: with the app, no backend), so 30.1, 28.8 and 35.1 follow it.
- **L2's open questions:** 30.1 and 30.3 need the warm-up and cool-down cadence aims (11); 32.5
  builds a rule that is still a proposal (2); 32.2 shows a Time that is always 30:00 (3).
- **L2's mock gaps**, each drawn before its slice is built: 29.2 (the HTTPS and chooser alerts),
  30.1 (the class that cannot be loaded), 30.2 (the video that cannot load), 31.1 (power off target), 31.3 (both notices), 32.4
  (every effort at 0 W) and 32.7.
