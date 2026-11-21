# Lessons learned

What each slice of [`detailed-journeys.md`](detailed-journeys.md) taught about building Telo Ride
faster, so the next slice starts where the last one finished. It is a working tool, not a diary: a
lesson earns its place only if it saves time or prevents a mistake in a later slice.

## How to use it

1. **Before a slice:** read the standing lessons and the latest log entry. Put the lessons that fit
   the slice in its todo list, and apply them as you go.
2. **After a slice, before it merges:** add its entry at the top of the log, in the shape below.
   - *Applied from earlier:* each earlier lesson you applied and its result: **saved time**, **no
     effect**, **did not apply**, or **made it worse**, with a sentence on why.
   - *What slowed it down:* the few things that cost the most time, plainly.
   - *New lessons:* each one as what happened, then what to do next time, concrete enough to follow
     (a command, a file, a value).
3. **Keep the standing lessons current:** add each new lesson to the table, fill in *Applied in*
   and *Result* for the ones you used, and remove a lesson that twice had no effect or that the
   code, a tool or `AGENTS.md` now makes automatic.

The same step updates **% complete** in [`detailed-journeys.md`](detailed-journeys.md) and
[`journeys.md`](journeys.md).

## Standing lessons

| # | Lesson | From | Applied in | Result |
|---|--------|------|------------|--------|
| L1 | Work the slice in its own worktree, cut from `origin/telo-ride`, with its own `npm ci` in `frontend/` (never a `node_modules` symlink) and `.cache` symlinked before anything writes there; stage named paths only; in zsh, write paths out rather than in one `$VAR`. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L2 | Run specs and verify with `E2E_PORT=4310` (or another free port); never kill whatever holds 4300. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L3 | Run `npm run format` and `npx eslint --fix` (frontend) or `dotnet format` (backend) before the first verify after any CLI or config edit. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L4 | A link or button in `components` is an attribute component (`a[wz-…]`, `button[wz-…]`); the app adds `routerLink` and `routerLinkActive` (ADR 0024). | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2 | Saved time: `raised` joined `wz-button` |
| L5 | Read the initial chunk in the build output after every route or import change; the baseline is 260.26 kB raw against a 264 kB warning. To see what grew it, `npx ng build ride --stats-json` and read `outputs[main-*.js].inputs` in `dist/ride/browser-stats.json` (delete it after). | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time: it caught 10 kB in the initial chunk that verify let through (L54) |
| L6 | Reuse the measured boom bap track in `docs/videos/assets/music/`; if a new one is needed, download it through headed Chromium. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L7 | Review every scene with `--frame` on one contact sheet before the full encode, and open any headline or terminal edge at full size; encode in the background with `--crf 23` for films over 2 minutes. Use `headline--md` for scene titles: `--lg` clips italic overhang. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time: the full-size frames found two terminals that rendered their tags as HTML (L56) |
| L8 | Backend packages: EF Core on 10.0.x (11 needs .NET 11), MediatR 12.5 (last Apache 2.0), xUnit v3 on Microsoft Testing Platform (`backend/global.json`); probe a new package in a scratch project before an ADR names it; pin a vulnerable transitive package in `Directory.Packages.props`. | 1.2 | 1.3, 1.4, 6.1 | Saved time: `Microsoft.Extensions.Logging.Abstractions` joined at 10.0.13 beside EF Core |
| L9 | A backend acceptance test is a fixture subclassing `TeloRideApiFactory` (`ConfigureServices` injects the fault); `ProbeController` and `SignedInProbeApi` stand in for endpoints and sign-in until features add theirs; await with `EventProbe<T>` (spans and hub events), never sleep; a hub test connects `HubConnectionBuilder` through `Server.CreateHandler()`; prove a guard by removing it once. | 1.2 | 1.3, 1.4, 2.2, 6.1 | Saved time: `StubCatalogueApi` replaces the catalogue port as `UnreachableDatabaseApi` replaces the database |
| L10 | A film scene's id is its element's DOM id: never name a scene `errors`, `captions`, `play`, `frame` or `stage`, which `film.css` and the runtime already use. | 1.2 | 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L11 | Prove a test double from the outside: a spec drives the browser API through a helper (`AppCalls`) until the app's own client exists; prove its guard with `test.fail()`, and run once without it to read the failure's reason. | 1.3 | 1.4 | Saved time |
| L12 | In zsh and BSD tools: quote globs in arguments (`--include='*.cs'`), and replace whole words with `perl -pi -e 's/\bOld\b/New/g'`; BSD `sed` has no `\b`. | 1.3 | 1.4, 2.1, 2.2, 2.3 | Skipped once: an unquoted glob cost a command |
| L13 | Never symlink `node_modules` into a worktree: when verify's stamp (`node_modules/.verify-lock-hash`) does not match, its `npm ci` empties the linked main checkout's `node_modules` and installs into the worktree. After `npm ci` in a checkout by hand, write the stamp so verify skips the reinstall. | 1.3 | 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L14 | For a production-like local run, `dotnet run --no-launch-profile` (`launchSettings.json` otherwise overrides `ASPNETCORE_URLS` and the environment), and `-- --webroot ../frontend/dist/ride/browser` to serve a build without copying it. | 1.4 | 2.2 | Saved time |
| L15 | Prove a workflow change on GitHub before merging: push the slice's branch (CI runs on every push), `gh run watch <id> --exit-status`, read the job times, then delete the remote branch after the merge. | 1.4 | | |
| L16 | A hosting test's web root is an in-memory `IFileProvider` set with `PostConfigure<StaticFileOptions>` (`HostedAppApi`), so it reads no file. | 1.4 | | |
| L17 | Judge verify by its exit status: `if E2E_PORT=4310 node tools/verify/verify.mjs > log 2>&1; then git commit …; fi`. Piping it to `grep` succeeds whatever verify did, and once committed a failing build. | 2.1 | 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L18 | Bind an app-wide service the first screen needs (the bike connection, the ticker) in the providers of the lazy parent route in `ride.routes.ts`, not in `app.config.ts`: one instance serves every screen and its code leaves the initial chunk. | 2.1 | 2.2, 2.3, 2.4 | Saved time: the header reads the route-bound connection |
| L19 | What only a development build does gets a `*.development.spec.ts`, run by Playwright's `development` project against the development build on the next port; the `chromium` project proves the production build does not. | 2.1 | | |
| L20 | Web Bluetooth in `domain`: start the file with `/// <reference types="web-bluetooth" />` (the app's tsconfig loads no ambient types), and type byte encoders `Uint8Array<ArrayBuffer>` so they pass as a `BufferSource`. | 2.1 | 2.3, 2.4 | Saved time |
| L21 | `WebApplicationFactory.CreateClient(new() { … })` takes its base address from that options object (`http://localhost`), not from `ClientOptions`: set `BaseAddress` in it. `UseHsts` leaves `localhost` out, so an HSTS test runs at another host in the Production environment (`ProductionApi`). | 2.2 | | |
| L22 | A scripted multi-file edit stops the step on its first miss: end the heredoc with `&&` before the next command (or `set -e`). A failed `assert` in `python3 - <<'EOF'` does not stop the lines after it, and a commit went out without its template change. | 2.2 | 2.3, 5.4 | Made it worse once: a heredoc's failed assert, then a newline, and the commit and push still ran (L49) |
| L23 | The browser's own states come from the fake Bluetooth: `bluetooth.remove()` (Safari, Firefox), `servePlainHttp()` (no secure context, no Bluetooth) and `restore()` on the current page; no other browser and no http host. | 2.2 | 2.3, 2.4 | Saved time: adapter, drop and power joined it |
| L24 | A film diagram's `.node` name is set in capitals: put code identifiers (`isSecureContext`) in its small note, and plain words in its name. | 2.2 | 2.3, 2.4 | Saved time |
| L25 | Make a scripted multi-file edit all or nothing: collect `(path, old, new)`, assert each `old` occurs once in its file's text, and write the files only after every assert passed. An assert that fails midway leaves the earlier files edited. | 2.3 | 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Made it worse once: a script that wrote each edit as it went stopped half way; the next one collected the edits and wrote them at the end |
| L26 | A guard on a screen changes every spec that opens it: give those specs their premise through the fixture (`bluetooth.remember()`), and run the whole Playwright suite after adding a guard or a redirect. | 2.3 | 2.4, 5.4, 6.1, 6.2 | Saved time: the full suite ran before the film |
| L27 | Push a fake bike's notification only after the writes the app makes before it listens (`expect.poll(() => bluetooth.writes().length)`): a frame sent before initialisation finishes is not the first one after it, as a real bike streams only after its start command. | 2.3 | 2.4 | Saved time |
| L28 | Keep a heredoc that writes files in a command of its own: a command blocked or failing earlier in the same `&&` chain drops it silently (a blocked `rm $VAR/*.png` cost `film.js`). Write frames to a new folder instead of clearing one. | 2.3 | 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L29 | A periodic write (a keepalive) joins every write log a spec compares: start it at the moment its requirement names (connected, after pairing), and filter it out or count from a known point in specs that compare exact logs. | 2.4 | | |
| L30 | Time-driven behaviour in a spec (keepalives, retries): `page.clock.install()` before the page loads, then `page.clock.runFor(ms)`; time still flows between, so binding round trips and short gaps go on as usual. Nothing sleeps. | 2.4 | 5.4 | Saved time |
| L31 | A slice whose behaviour no screen shows yet (decoders before their readouts) is proved by the requirement's tables at the domain boundary, fed the bytes a bike sends, plus one run on the simulated bike; write a stub first so each table fails on its assertions, and say in the design which later slice brings the Playwright proof. | 3.1 | 3.2, 3.3, 4.1, 4.2, 5.1, 6.1 | Saved time: a stub `ClassPlanRules` made the table fail on its assertions, not the build |
| L32 | A film's `arrow()` lines are light: put a diagram of `node()`s and arrows on a dark field (`field--ink`, `field--panel`), never on `field--bone`. | 3.1 | 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L33 | Before a slice builds UI, find the screen that hosts it in `docs/detailed-journeys.md`: when that screen's slice comes later, build only what every host shares (state, models, formatting) and move the markup to the hosting slices in the design, rather than build a screen early. | 3.2 | 3.3, 4.1, 4.2, 5.1 | Saved time |
| L34 | Render every diagram a slice touches (`plantuml -tpng` on each `.puml`) and read its exit status: an escaped quote (`\"—\"`) inside a C4 macro's label breaks it, and a committed PNG can be older than its source. Write "a dash" instead. | 3.3 | 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time |
| L35 | Before writing a slice's code, check what earlier slices already built for its requirements (`git log --oneline --grep L2-0NN`, the specs' traces): record a behaviour that already holds with one test that names its criterion, and keep the slice to what is left. | 4.1 | 4.2, 5.1, 5.2, 5.4, 6.1, 6.2 | Saved time: no progress contract existed, so the slice added the smallest one |
| L36 | While a film encodes, draft the next slice's stubs and acceptance tables in the scratchpad; copy them into the new worktree once the merge lands, then run them to see them fail. | 5.1 | 5.2, 5.3, 5.4, 6.1, 6.2 | Saved time: 6.1's prompt, requirement and ADR were read during the 5.4 encode |
| L37 | To test time across a hidden tab, bind `MONOTONIC_TIME` to `Date.now()` under `vi.useFakeTimers()`: `vi.setSystemTime` moves the clock without firing timers, as a throttled tab does, and a `visibilitychange` with a stubbed `visibilityState` shows it again. | 5.1 | 5.2 | Saved time: the same idea, with Playwright's clock |
| L38 | To drive a ride screen in Playwright, `page.clock.install()`, hold the API answer that starts the ride, `pauseAt` a known time, release it, wait for the ride's first command, then `runFor` a few ms to render; `fastForward` moves it like a hidden tab. Screenshots on a paused clock need its frames stepped with real-time pacing. | 5.2 | 5.3, 5.4 | Saved time: the shared startClassRide helper now holds it |
| L39 | macOS has no `timeout`; never wrap a command in it. Piped through `grep`, the "command not found" vanished and looked like a hang. | 5.2 | | |
| L40 | The first use of an Angular entry point (`@angular/common/http`) can land in `main` wherever it is provided, because the framework's own packages import it. Build and read the initial total right after adding one. | 5.2 | 5.3 | Saved time: the same check caught L42 |
| L41 | Write each step's spec and see it fail before writing that step's code, even when the components seem obvious; a spec written after the code cannot show it failed for the right reason. | 5.2 | 5.3, 5.4, 6.1, 6.2 | Saved time: all four steps failed first for the expected reason |
| L42 | The first use of a core API (`effect`, `viewChild`) puts its runtime in `main`, since `@angular/core` is in the initial chunk: `effect` cost 2 kB raw and `viewChild` 1 kB. Read the initial total after each new framework API, and prefer an output, a lifecycle hook or the host element the app already pays for. | 5.3 | 5.4 | Saved time: no new core API; the initial total rose 0.06 kB |
| L43 | On Playwright's paused clock, everything on a timer waits, including a fake's ready callback and zoneless change detection. Step it a frame at a time until the locator shows: `expect(async () => { await page.clock.runFor(16); await expect(l).toBeVisible({ timeout: 50 }); }).toPass()`. | 5.3 | 5.4 | Saved time: the lazy Page not found and the reconnect on the paused clock |
| L44 | Fake a third-party script at its URL in the shared fixture (a route, and the guard's catch-all calling `route.fallback()` for it), not by rebinding a token, which a browser test cannot do: the real adapter runs, and blocking the route tests the failure. | 5.3 | 5.4 | Saved time: the Screen Wake Lock API is faked the same way |
| L45 | When the main checkout holds another session's uncommitted change to a file the slice also changes, merge in the slice's worktree on a detached `origin/telo-ride` and push `HEAD:telo-ride`; never stash or overwrite their change. | 5.3 | 5.4 | Saved time: AGENTS.md is still uncommitted in the main checkout |
| L46 | A held ride stops `RideTicker`'s ticks, which publish only a new whole second of the ride clock: whatever must notice the hold ending (a lost bike back) watches the app's `TICKER`, which beats every second regardless. | 5.4 | | |
| L47 | e2e and its fixtures never read a file outside `frontend/`: CI's sparse checkout has only `frontend` and `backend`, and a fixture reading `docs/mocks` passed locally and failed every class spec in CI. Copy the file beside the fixture. | 5.4 | 6.1, 6.2 | Saved time: the covers were copied beside the fixture, not read from docs/ |
| L48 | Prove a `beforeunload` prompt in Playwright: click something on the page first (Chromium asks only after a user activation), start `page.waitForEvent('dialog')`, `page.close({ runBeforeUnload: true })`, then check `dialog.type()` is `beforeunload` and accept it. | 5.4 | | |
| L49 | Never put a commit or a push in the same command as an edit script: after `python3 - <<'EOF' … EOF && echo ok`, a newline runs the next line whatever the assert did, and the fix pushed only a picture while the fixture still read the old path. Edit, check the file, then commit in a new command. | 5.4 | 6.1, 6.2 | Saved time: no commit shared a command with an edit script |
| L50 | With two applications in the workspace (`ride`, `marketing`), every `ng serve` and `ng build` names its project: a bare one fails "Cannot determine project for command". | 6.1 | 6.2 | Saved time: every build named `ride` |
| L51 | Make test data meant to break a rule break it by construction: `not-a-video` is 11 allowed characters, a well-formed YouTube id. Use a character the rule forbids (a space), and read the failing row before trusting the rule. | 6.1 | | |
| L52 | When a slice needs data the specs name but nobody supplied (six classes' videos), seed honest stand-ins, record them in an ADR and the design's open questions, and say so in the summary, rather than stop or invent. | 6.1 | 6.2 | Saved time: `NewRiderProgress` stands in for the level, recorded in the design |
| L53 | When another session's push breaks CI on `telo-ride`, check `git log origin/telo-ride` for a fix in flight, then make the smallest fix in that code's own style, prove it with the folder gone as CI has it, and push it before the slice merges. | 6.1 | | |
| L54 | The bundle budget is a warning, so verify passes over it: read "Initial total" after any step that adds a route or a new Angular API. Angular's core is bundled into the main chunk, so a core API used only in a lazy screen (`rxResource`, `resource`, `viewChildren`) still grows the initial bundle; prefer signals fed by a subscription there. | 6.2 | | |
| L55 | Playwright's `click()` waits for an `aria-disabled` element to be enabled and times out with no step named. Test a focusable disabled control as its users reach it: `focus()`, `toBeFocused()`, then a key. | 6.2 | | |
| L56 | In a film terminal, write a tag as `&lt;a …&gt;`: raw, it renders as HTML, the row goes blank and the rows after it become links. Look at each terminal's frame at full size. | 6.2 | | |
| L57 | Route `providers` live as long as the route's injector, past the visit. A screen's store goes in its page component's `providers`, so its state and requests go when the rider leaves; the route binds only stateless clients. | 6.2 | | |

## Log

### 6.2 Class library (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script — saved
  time.**
- **L25 all-or-nothing edits — made it worse once:** one script wrote each file as it went and stopped at the
  page template, leaving half a step on disk; the next script collected its edits and wrote them at the end.
- **L35 check what was built — saved time:** no progress contract or rider level existed, so the slice added
  `PROGRESS_API` with `NewRiderProgress` (L52), and left the Class Start guard to 6.3, which builds its route.
- **L36 draft during the encode — saved time:** 6.2's prompt, requirements and mocks were read while 6.1's
  CI ran.
- **L41 spec each step first — saved time:** the shelves, the tabs, the locks and the unavailable state each
  failed first for the expected reason.
- **L5 bundle — saved time:** it caught 10 kB in the initial chunk that verify passed (L54).
- **L47 nothing outside `frontend/` in e2e — saved time:** the covers were copied beside the fixture.
- **L26 the whole suite; L6, L7, L10, L32, L34 film — saved time:** the full-size frames found two terminals
  whose tags rendered as HTML (L56).
- **Every other lesson — did not apply.**

**What slowed it down**

- The prompt asks for locks that the design left to journey 12, with no rider level anywhere yet; a new-rider
  `PROGRESS_API` made them buildable now without inventing progress.
- `rxResource` and `viewChildren` put 10 kB of Angular core into the initial chunk; finding which inputs grew
  it took a stats build and a script over `browser-stats.json` (L54).
- The locked-card spec timed out with no step named, because `click()` waits for `aria-disabled` to clear (L55).

**New lessons**

- **L54 Read the initial total yourself; core APIs land in main.**
- **L55 Reach a focusable disabled control by keyboard in a spec.**
- **L56 Escape tags in film terminals.**
- **L57 Provide a screen's store on its page, not its route.**

### 6.1 Class catalogue API (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone; L49 never commit
  with an edit script — saved time.** One verify failed on a type-only import that `eslint --fix` mended.
- **L8 central packages; L9 a fixture per fault — saved time:** `StubCatalogueApi` replaces `IClassCatalogue`
  as `UnreachableDatabaseApi` replaces the database, so no test reads the catalogue file.
- **L31 stub first — saved time:** the rule table failed on its twelve assertions before the rules existed.
- **L35 check what was built — saved time:** the backend had no class code, and the class ride already read
  `CLASSES_API`, so binding it to `CachedClassesApi` was the whole frontend change.
- **L36 draft during the encode — saved time:** 6.1's prompt, requirement and ADR 0014 were read while 5.4 encoded.
- **L41 spec each step first — saved time:** steps 1, 3, 4 and 5 failed for the expected reason first; step 2
  recorded what step 1's data already served, and was proved by blanking the summary and the world.
- **L47 nothing outside `frontend/` in CI — saved time:** it named the marketing build's failure at once (L53).
- **L5 bundle — saved time:** 284.08 kB, 0.06 kB up. **L26 the whole suite; L6, L7, L10, L32, L34 film and
  diagrams — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- The catalogue's home: the design left file or database open; ADR 0028 settled on an embedded file behind a
  port, with no table, seed or watch.
- Six of the seven classes have no published video and the mocks give their plans only as profiles; the
  plans were read from the mocks and the videos are stand-ins (L52).
- Another session's marketing site broke CI on `telo-ride` before this slice began (L53), and its second
  application broke the film recorder's `ng serve` (L50).

**New lessons**

- **L50 Name the project in every `ng` command.**
- **L51 Invalid test data is invalid by construction.**
- **L52 Seed honest stand-ins for data nobody supplied.**
- **L53 Fix another session's red CI in its own style.**

### 5.4 Pause, leave or finish a class (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
  Three edit scripts missed lines Prettier had wrapped, or table rows with empty cells, and wrote nothing.
- **L22 stop on a miss — made it worse once:** the CI fix for 5.3 ran its verify, commit and push after a
  failed assert, so the push carried only the copied picture; a second commit fixed the path (L49).
- **L5 bundle; L42 core APIs — saved time:** no new core API, and the initial total rose 0.06 kB.
- **L6, L10, L32, L34 film and diagrams — saved time.** **L7 contact sheet — saved time:** the header
  close-up was a thin strip again and was replaced by the paused video frame.
- **L26 run the whole suite — saved time:** run before the film, it gave the count the film shows.
- **L30, L38, L43 the paused clock — saved time:** initialising after Reconnect and the lazy Page not
  found each needed the clock stepped until they showed.
- **L35 check what was built — saved time:** `reconnectNow()` and the 3 s retry were there from 2.4.
- **L41 spec each step first — saved time:** all six steps failed for the expected reason before their code.
- **L44 fake at the browser API — saved time:** the Screen Wake Lock API is faked the same way.
- **L45 merge around another session's change — saved time:** AGENTS.md is still uncommitted in main.
- **L36 draft during the encode — no effect:** there was no earlier encode to draft during.
- **Every other lesson — did not apply.**

**What slowed it down**

- 5.3's merge failed CI: a fixture read the class cover from `docs/mocks`, which CI's checkout leaves
  out (L47), and the first fix pushed without its path change (L49).
- The lost-bike resume never came: the store watched the bike on the ride clock's ticks, which stop
  while the ride is held (L46).
- The prompt's "leave with confirmation" conflicts with L2-093 AC1 and the design; the spec won and the
  design notes it.

**New lessons**

- **L46 Watch for the end of a hold on the app's beat.**
- **L47 e2e reads nothing outside `frontend/`.**
- **L48 Prove a `beforeunload` prompt.**
- **L49 Never commit in the same command as an edit script.**

### 5.3 Sync the class video (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
  One edit script stopped on a comment that wrapped differently from what it assumed, and wrote nothing.
- **L5 bundle and L40 entry points — saved time:** the build showed `main` 3 kB up with the video library
  already lazy; the cause was the app's first `effect` and `viewChild` (L42).
- **L6, L10, L32, L34 film and diagrams — saved time.** **L7 contact sheet — saved time:** the hook's accent
  ran under the browser window and the notice close-up was a thin strip.
- **L36 draft during the encode — saved time:** 5.3's requirement, ADR and design were read while 5.2 encoded.
- **L38 drive a ride on Playwright's clock — saved time:** it moved into a shared `startClassRide` helper.
- **L41 spec each step first — mostly:** steps 1 and 2 failed for the expected reasons before their code;
  step 3's behaviour (the notice) was written with step 1, so its specs were proved by switching it off.
- **Every other lesson — did not apply.**

**What slowed it down**

- The paused clock holding back the fake player's ready and the zoneless render (L43).
- Finding why `main` grew with the video library already lazy (L42).
- The design said tests bind a fake player to the token, which a browser test cannot do (L44).
- AGENTS.md gained a section on World rendering, uncommitted in the main checkout, while this slice
  also edits AGENTS.md (L45).

**New lessons**

- **L42 A first core API lands in `main`.**
- **L43 Step the paused clock until it renders.**
- **L44 Fake a third-party script at its URL.**
- **L45 Merge around another session's uncommitted change.**

### 5.2 Class ride screen (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules` — saved time.**
- **L2 port 4310 — saved time:** another checkout held 4300 again.
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — made it worse once, then caught:** the build failed its budget at +23.5 kB raw; the cause was
  `HttpClient` (L40), and the budget rose to 288/300 kB with the reason in the budgets design.
- **L6 track, L10 scene ids, L32 diagrams on a dark field, L34 render every diagram — saved time.**
- **L7 contact sheet — saved time:** it showed the header close-up as a thin strip, split into name and clock.
- **L35 check what earlier slices built — saved time:** the reconnect (2.4), the nudge (4.2) and the engine
  (5.1) were there; the screen only wires them.
- **L36 draft during the encode — saved time:** the mock's styles and the catalogue design were read while
  5.1 encoded.
- **L37 fake a hidden tab — saved time:** the same idea with Playwright's clock (L38).
- **Every other lesson — did not apply.**

**What slowed it down**

- Paused fake time: the ride needs a known start, but rendering and screenshots need frames (L38).
- The budget failure and finding why `HttpClient` lands in `main` (L40).
- A pre-existing flaky spec: the skip link could be pressed before Home's chunk rendered; it now waits.
- Steps 2 to 4 were specified after the components were written, so only step 1 was seen failing first
  (L41).

**New lessons**

- **L38 Drive a ride screen on Playwright's clock.**
- **L39 No `timeout` on macOS.**
- **L40 A new Angular entry point can land in `main`.**
- **L41 Spec each step before its code.**

### 5.1 Workout engine and ride clock (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; nothing in the app imports the engine yet.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** it showed the opening kicker running under the browser window.
- **L31 screenless slice, L33 hosting screen — saved time:** the wake lock, the leave guard and the
  `MONOTONIC_TIME` binding went to 5.2 with the route that needs them.
- **L34 render every diagram — saved time:** seven diagrams in three designs, all rendered.
- **L35 check what earlier slices built — saved time:** `RideTotals` (3.2) already counts distance per
  running second, so `DistanceIntegrator` was not built.
- **Every other lesson — did not apply.**

**What slowed it down**

- Two designs described the engine differently (`stateAt` against `follow(plan, clock)`); they now share
  `planStateAt` and `WorkoutEngine.follow`, and three designs' diagrams still named `sendTarget`.
- Committing the clock and the engine as separate steps needed the public API files split by hand.

**New lessons**

- **L36 Draft the next slice during the encode.**
- **L37 Fake a hidden tab with `setSystemTime`.**

### 4.2 Take over resistance (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB.
- **L6 track, L7 contact sheet, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L31 screenless slice, L33 hosting screen — saved time.**
- **L35 check what earlier slices built — saved time:** 4.1's controller already clamped and sent, so
  the slice was two methods and their table.
- **Every other lesson — did not apply.**

**What slowed it down**

- "Return to plan" in the slice's description has no control in any mock: L2-028 AC3 makes the next
  segment's plan level apply again, so that is the return.
- A nudge before any target had no rule; it starts from the bike's reported resistance, and the design
  says so.

**New lessons**

- None.

### 4.1 Send target resistance (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits — saved time.**
- **L5 bundle — checked:** +0 kB.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** the sheet passed, and recomputing the frames' checksums caught a
  wrong `D2` byte before the encode.
- **L28 heredocs alone — skipped once:** a design edit went out with an empty heredoc and changed
  nothing; the render after it showed the diagrams unchanged.
- **L31 screenless slice, L33 hosting screen, L34 render every diagram — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Most of L2-025 was built in slice 2.3 (the frame, the clamp, the FTMS mapping, the acknowledgement time)
  and L2-027 AC4 in 2.4 (the connection resends its last target). The design's `resend()` would have
  duplicated it; the slice was left with the controller's plan path (L35).
- `SentToBikeLog` rows carry the ride time, which needs slice 5.1's clock, and only Custom ride shows the
  log, so it moved to 21.3.

**New lessons**

- **L35 Check what earlier slices built** for the requirements before writing code.

### 3.3 Show heart rate (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; no screen imports the strap yet.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** it caught two wrapped kickers and a `quiet` timeline whose times
  did not add up, fixed before the encode.
- **L31 screenless slice at the domain boundary — saved time:** a fake strap behind `navigator.bluetooth`
  proved the chooser's filter, the subscription, the reconnect and the retries.
- **L33 find the hosting screen — saved time:** connecting a strap needs Settings (20.1), so the action,
  its mock and the Playwright proof go there.
- **Every other lesson — did not apply.**

**What slowed it down**

- The heart-rate component diagram had not rendered since it was written: an escaped quote in a C4 label
  broke the macro (L34). The 3.2 design change met the same error.
- The design kept the strap in IndexedDB; the remembered bike already uses one localStorage record read
  at start-up, so the strap does the same and the design says so.

**New lessons**

- **L34 Render every diagram you touch**, and keep escaped quotes out of C4 labels.

### 3.2 Show live metrics (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; nothing a screen imports changed.
- **L6 track, L7 contact sheet, L10 scene ids, L32 diagrams on a dark field — saved time.** The sheet
  needed no fix.
- **L31 prove a screenless slice at the domain boundary — saved time:** stubs first, one case per row,
  and one run on the simulated bike.
- **Every other lesson — did not apply.**

**What slowed it down**

- The slice names readouts, but the three screens that host them (5.2, 7.3, 21.3) and the ride clock that
  ticks the totals (5.1) come later, and each family of readout carries its plan's target. Reading the
  design system's `ride-readout` page settled it: 3.2 builds what they share, and the design moves the
  markup to the screens (L33).
- Two designs disagreed on distance (per running second here, over notification timestamps in the ride
  clock's `DistanceIntegrator`); the requirement's per-second rule stands, and the design names the
  refinement.

**New lessons**

- **L33 Find the hosting screen before building UI**, and build only what every host shares when it
  comes later.

### 3.1 Decode bike notifications (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — saved time:** Prettier ran before every verify, and none failed on format.
- **L5 bundle — checked:** 260.46 kB (+0 kB); the decoders and `BikeTelemetry` are not imported by any
  screen yet.
- **L6 track, L7 contact sheet — saved time.** The sheet showed a diagram's arrows invisible on a light
  field (L32), fixed before the one encode.
- **L10 scene ids; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L4, L8, L9, L11, L12, L14 to L16, L18 to L24, L26, L27, L29, L30 — did not apply.** Time-driven
  rules ran on Vitest's fake clock in unit tests, not Playwright's.

**What slowed it down**

- No screen shows telemetry before 3.2, so the slice had no Playwright path: its acceptance tests are the
  requirement tables at the domain boundary (L31), and the design now says 3.2 brings the end-to-end proof.
- A relative `cd ../../..` from a deep folder landed one level short, and Prettier found no files; `cd`
  by absolute path.

**New lessons**

- **L31 Prove a screenless slice at the domain boundary**, stub first, and name the slice that brings
  the Playwright proof.
- **L32 Diagrams on a dark field.**

### 2.4 Keep the bike connected (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — saved time:** Prettier ran before every verify, and none failed on format.
- **L5 bundle — checked:** 260.46 kB (+0 kB); the status, the reconnector and the keepalive ride in
  the lazy route's chunks.
- **L6 track, L7 contact sheet — saved time.** The sheet showed one scene blank (L10), fixed before the
  one encode.
- **L10 scene ids — skipped once:** a scene named `errors` rendered nothing; renamed `retry`.
- **L17 verify by exit status; L18 bind on the lazy route; L20 Web Bluetooth types; L24 diagram names
  — saved time.**
- **L23 fake the browser — saved time.** The fake gained `getAvailability()`, `adapterOff()`,
  `drop()` and `switchOff()`/`switchOn()`.
- **L25 all-or-nothing edits — saved time.** Two scripts missed an anchor and wrote nothing.
- **L26 run the suite after a guard — saved time.** It caught the keepalive in the remembered bike's
  exact write log (L29).
- **L27 notify after the writes; L28 heredocs alone — saved time.**
- **L4, L8, L9, L11, L12, L14 to L16, L19, L21, L22 — did not apply.**

**What slowed it down**

- The design leaned on pieces later slices own: the worker ticker (18.2), the resistance controller
  (journey 4), the logger (25.2), the ride screens' banners and Custom ride's panel (5.x, 7.x, 21.3).
  The connection now keeps the last target itself and logs to the console, and the design says what
  arrives where.
- The keepalive first started at the end of initialisation, before pairing finished, which raced the
  specs that count exactly three init writes; it now starts once the bike is connected.

**New lessons**

- **L29 A periodic write joins every write log:** start it when its requirement says; filter it out.
- **L30 Move time with Playwright's clock** for keepalives and retries.

### 2.3 Pair a bike (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — skipped once:** a verify failed on format after a card edit; one rerun.
- **L5 bundle — checked:** 260.46 kB (+0.2 kB); the guard and the remembered bike ride in the lazy
  route's chunk.
- **L6 track, L7 contact sheet — saved time.** Mid-scene frames hid late cards, so a second sheet of
  late frames was checked before the one encode.
- **L10 scene ids, L24 diagram names — saved time.** The identity diagram names its boxes in words and
  puts `ECH-EX5S-141844` in the notes.
- **L12 zsh — skipped once:** an unquoted `--include=*.md` matched nothing and cost a command.
- **L17 verify by exit status — saved time.** It caught verify run from `frontend/`, where the script
  does not exist, before a commit.
- **L18 bind on the lazy route — saved time.** `REMEMBERED_BIKE` is bound beside the bike connection.
- **L20 Web Bluetooth types — saved time** for the two links and the write queue.
- **L22 stop on the first miss — partly.** Twice a Python edit script stopped on a missed anchor
  after writing the files before it; tests caught both before a commit (L25).
- **L23 fake the browser — saved time.** The fake gained chooser modes, `readValue`,
  `getPrimaryServices` and an ordered log of subscriptions, reads and writes.
- **L4, L9, L11, L14 to L16, L19, L21 — did not apply.**

**What slowed it down**

- The design paired in two presses (search, then pair), but the browser opens its chooser only for a
  user gesture and connects to what the rider picks, so the found step went and pairing is one press.
- The identifier rule was `<TO SUPPLY>` and the mocks showed a signal line no browser gives without a
  flag; the rule was settled from Echelon's advertised names and the mocks now show the identifier.
- The docs did not fix Set Target Resistance Level's byte layout; it follows the range's encoding
  (sint16 in 0.1) and the design records it.
- Home's new guard sent the app-shell and Back-to-Home specs to Connect Bike (L26).

**New lessons**

- **L25 All-or-nothing edit scripts:** assert every anchor, then write.
- **L26 A guard changes every spec that opens its screen:** give them their premise; run the suite.
- **L27 Notify after the app's writes,** not before initialisation has finished.
- **L28 Heredocs that write files go in a command of their own.**

### 2.2 Check browser support (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — little effect.**
- **L4 attribute components — saved time.** Connect Bike's Try again needed the design system's
  `btn--raised`, added as a `raised` variant of `wz-button`.
- **L5 bundle — checked:** 260.26 kB (+0.24 kB); the support check rides in the lazy route's chunk.
- **L6 track, L7 contact sheet — saved time.** The sheet caught capitalised code names in a diagram
  (L24), and the audio log a hook line read at 1.25×; both were fixed before the one encode.
- **L9 backend fixtures; L14 production-like runs — saved time.** `ProductionApi` is one
  `ConfigureWebHost` override; `dotnet run --no-launch-profile` in Production gave the film's curl.
- **L10 scene ids, L12 zsh — saved time.**
- **L17 verify by exit status — saved time,** but a Python edit that missed in the same command let a
  commit go without its template change (L22); it was amended.
- **L18 bind on the lazy route — saved time.** `BLUETOOTH_SUPPORT` sits beside the bike connection.
- **L11, L15, L16, L19, L20 — did not apply.**

**What slowed it down**

- Class Start, Custom workout and Custom ride, which L2-008 to L2-010 name, do not exist yet; their
  notices were left to the slices that build those pages, and the design says so.
- Chromium hides `navigator.bluetooth` on plain http, so the design's two checks had to be ordered
  (secure context first) and Connect Bike needed a `needs-https` state, its requirement and its mock.
- The HSTS test failed twice for reasons in the test: the client options reset the address to
  `localhost`, which HSTS leaves out (L21).

**New lessons**

- **L21 Test clients and HSTS:** set `BaseAddress` in the options passed to `CreateClient`; test HSTS
  at another host in Production.
- **L22 Stop a scripted edit on its first miss** before anything commits.
- **L23 Fake the browser's states** with `remove()`, `servePlainHttp()` and `restore()`.
- **L24 Code names go in a diagram node's note,** not its capitalised name.

### 2.1 Ride a simulated bike (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.** The worktree's own `npm ci` took
  seconds, and the main checkout was left alone.
- **L3 format first — little effect.** Prettier rewrote new files; nothing failed on it.
- **L4 attribute components — saved time.** The pair button is `button[wz-button]` with a new
  `size="xl"` and `block`, not a new component.
- **L5 bundle — saved time.** The first build read 263.05 kB against a 257.46 kB baseline; the
  stats file showed the bike connection and its ticker in the main chunk, and binding them on a lazy
  parent route (L18) brought it to 260.02 kB.
- **L6 track, L7 contact sheet, L10 scene ids, L12 zsh — saved time.** One encode; the sheet caught a
  near-empty phone picture before it.
- **L11 prove a double from the outside — did not apply.** The fake Bluetooth was already proven; the
  production spec used it as it is.
- **L13 never link `node_modules` — saved time.** No reinstall touched the main checkout.
- **L14 to L16 — did not apply.** No backend change.

**What slowed it down**

- Verify's output was piped to `grep`, so a failing production build (library specs compiled into
  the app) still reached a commit; it was amended after the fix.
- The app's `tsconfig.app.json` excluded `**/*.spec.ts` relative to `projects/ride`, which never
  reached the libraries' specs; the first library unit test broke the build until the exclude named
  `../*/src/**/*.spec.ts`.
- Web Bluetooth types needed a reference in the one file that uses them, and the newer
  `Uint8Array<ArrayBufferLike>` would not pass as a `BufferSource`.
- `AGENTS.md` says the composition root binds every token, and lazy loading outranks that: the
  bike connection moved to the lazy parent route, and the design records why.

**New lessons**

- **L17 Judge verify by its exit status,** never by a `grep` of its output.
- **L18 App-wide services the first screen needs bind on the lazy parent route** in `ride.routes.ts`.
- **L19 Development-only behaviour gets a `*.development.spec.ts`** on Playwright's `development` project.
- **L20 Web Bluetooth types in `domain`:** a triple-slash reference, and `Uint8Array<ArrayBuffer>` encoders.

### 1.4 CI and hosting (2026-11-21)

**Applied from earlier**

- **L1 own worktree, links first; L2 port 4310 — saved time.** No nested link, no stale server.
- **L3 format first — little effect.** Prettier and `dotnet format` never failed.
- **L4 attribute components — did not apply.** **L5 bundle — checked: unchanged** at 257.46 kB, read
  from the CI log as well as locally.
- **L6 reuse the track — saved time. L7 contact sheet — partly.** The sheet's small tiles hid a
  clipped headline that a full-size frame of the encode showed, so the film was encoded twice.
- **L8 backend packages — saved time.** No package was needed: static files, fallbacks and headers are
  all in ASP.NET Core.
- **L9 backend fixtures — saved time.** `HostedAppApi` is one `ConfigureServices` override.
- **L10 scene ids, L12 zsh — saved time.** No blank scene and no shell trap.
- **L11 prove a double from the outside — saved time.** The in-memory web root was proven through the
  API, failing first with 401 for the right reason.
- **L13 lockfile — did not apply.** No package changed; the lesson itself was corrected at the start
  of this slice.

**What slowed it down**

- The host was open: Static Web Apps' linked backends route only `/api` and carry no WebSockets, which
  had to be confirmed before ADR 0026 could choose the API as the host.
- `dotnet run` took the launch profile's port and Development environment until
  `--no-launch-profile`.
- The tests' "no file" rule needed an in-memory `IFileProvider` for the web root.
- The pipeline could be proven only on GitHub: the branch was pushed to run it before the merge.
- A `headline--lg` title clipped its last letter's italic overhang inside the word reveal's mask;
  `headline--md`, as every other scene uses, does not.

**New lessons**

- **L14 Production-like local runs.** `dotnet run --no-launch-profile … -- --webroot <build>`.
- **L15 Prove a workflow on GitHub before merging.** Push the slice's branch, `gh run watch`, then
  delete the remote branch after the merge.
- **L16 In-memory web root.** `PostConfigure<StaticFileOptions>` with `InMemoryWebRoot`.

### 1.3 Test harness (2026-11-21)

**Applied from earlier**

- **L1 own worktree, links first — saved time.** Both links were made before anything ran, so nothing
  nested; the other session's checkout stayed untouched. Its one surprise is now L13.
- **L2 port 4310 — saved time.** No stale server.
- **L3 format first — little effect.** `prettier --write e2e` ran before every verify and the format
  check never failed; the one lint failure was missing types, which formatting cannot catch.
- **L4 attribute components, L5 bundle — did not apply.** No component and no app code changed.
- **L6 reuse the track, L7 contact sheet — saved time.** The sheet showed a clipped terminal line
  before the one encode.
- **L8 backend packages — saved time.** SignalR.Client 10.0.13 and TimeProvider.Testing 10.0.0 were
  chosen on the 10.x line and restored first time.
- **L9 backend fixtures — saved time.** The hub tests reused `SignedInProbeApi`; the span recorder
  became `EventProbe<T>` in one move, with every test green.
- **L10 scene ids — saved time.** Scenes were named for what they show (`strict`, `api`); none
  rendered blank.

**What slowed it down**

- zsh again: an unquoted `--include=*.cs` was globbed, and BSD `sed` ignored `\b`, so a rename did
  nothing until it was redone with perl.
- The e2e type check had no Web Bluetooth types; `@types/web-bluetooth` was added, and the lockfile
  change made verify install `node_modules` afresh in the worktree, in place of the link.
- With no app code calling Bluetooth, HTTP or the hub yet, each double needed an in-page driver
  (`AppCalls`) before its spec could fail for the right reason, and each guard needed `test.fail()`
  plus one run without it.

**New lessons**

- **L11 Prove a double from the outside.** Drive the browser API from the page through a helper until
  the app's client exists, prove each guard with `test.fail()`, and read the reason once without it.
- **L12 zsh and BSD tools.** Quote globs in arguments, and use `perl -pi -e` with `\b` for whole-word
  renames.
- **L13 A lockfile change gives the worktree its own install.** Verify's `npm ci` replaced the
  `node_modules` link with a fresh install in the worktree; the main checkout's copy was untouched.
  (First written as the reverse; corrected in 1.4 when `git worktree remove` met a real folder.
  Corrected again after 1.4: there, `npm ci` emptied the main checkout's `node_modules` through the
  link. Worktrees now get their own install; see L1 and L13.)

### 1.2 Backend skeleton (2026-11-21)

**Applied from earlier**

- **L1 own worktree — saved time.** The slice ran in
  `../wattzup-01-2-backend-skeleton` while another session kept editing the main checkout; nothing of
  theirs was staged, and verify ran there with `frontend/node_modules` symlinked. It cost two
  failed commands (zsh keeps `$VAR` as one word) and one nested link (the recorder had made `.cache/`
  before it was linked), so the lesson now says both.
- **L2 port 4310 — saved time.** No spec run met a stale server.
- **L3 format first — no effect.** `dotnet format` passed every time and the frontend did not change;
  kept for slices that edit configs.
- **L4 attribute components, L5 bundle — did not apply.** No component and no frontend import; the
  initial chunk stayed at 257.46 kB.
- **L6 reuse the track — saved time.** No search and no download.
- **L7 contact sheet, one encode — saved time.** The sheet showed a blank scene before any full
  encode, so the film was encoded once, at CRF 23.

**What slowed it down**

- .NET 10 tooling: EF Core 11 refuses .NET 10, xUnit v3 needs the Microsoft Testing Platform opt-in,
  `dotnet new` has no `-q`, and SqlClient's vulnerable `System.Security.Cryptography.Pkcs` failed
  the warnings-as-errors build.
- With no production endpoint behind authentication yet, the acceptance tests needed a test-only
  controller, a signed-in scheme and in-memory telemetry exporters before they could fail for the
  right reason.
- A scene named `errors` rendered blank: it collided with `#errors` in `film.css`.

**New lessons**

- **L8 Backend packages.** Pin EF Core to 10.0.x (`dotnet-ef` is 10.0.13), keep MediatR on 12.5.0,
  run tests with `dotnet test --solution Telo.Ride.slnx` (xUnit v3 needs the `test.runner` of
  `backend/global.json`), and add `System.Security.Cryptography.Pkcs`-style pins to
  `Directory.Packages.props` (transitive pinning is on). Try a package in a scratch class library
  before an ADR names it. Mark generated code (`Migrations/`) as `generated_code` in
  `backend/.editorconfig`.
- **L9 Backend acceptance tests.** One fixture per fault: subclass `TeloRideApi` and override
  `ConfigureServices` (for example `UnreachableDatabaseApi` replaces `IAppDbContext`). Until a
  feature brings its own endpoints and sign-in, `ProbeController` and `SignedInProbeApi` stand in.
  Await telemetry with `SpanRecorder.Await`, and check a guard is real by removing it once (without
  the `url.query` enrich the span held `?text=Redacted`). Capture a real response body for a film
  with a throwaway test, then delete it.
- **L10 Scene ids.** A scene's id becomes its DOM id, and `film.css` styles `#errors`, `#captions`,
  `#play`, `#frame` and `#stage`; name scenes for what they show (`refusals`, not `errors`).

### 1.1 Frontend workspace (2026-11-21)

**Applied from earlier:** none; this was the first slice.

**What slowed it down**

- Another session shared the checkout: it held port 4300, and its unstaged changes made
  `git rebase` refuse, so the rebase had to be redone in a separate worktree after the merge.
- The film took longer than the slice's code: finding and downloading a track behind Pixabay's
  bot check, two full encodes (the first, at CRF 21, came out at 16.6 MB, over the limit), and a
  round of frame fixes found only after rendering.
- Small check failures, each a separate verify run: Prettier on `angular.json`, `tsconfig.json` and
  `serve-dist.mjs`, `consistent-type-imports`, the component-selector rule, and the unit-test
  builder's "No tests found".

**New lessons**

- **L1 Shared checkout.** Other sessions edit the same working tree, push to the same branches and
  serve on the same ports. Next time, start in a worktree of your own:
  `git worktree add ../wattzup-<slice> -b journey/<slice> origin/telo-ride`, then
  `ln -s <repo>/frontend/node_modules ../wattzup-<slice>/frontend/node_modules`. Verify passes there
  as it does in the main checkout. Stage named paths (`git add <paths>`), never `git add -A`, and if
  the rebase meets someone else's changes, use a clean worktree rather than stashing their work.
- **L2 Ports.** `serve-dist` from another session often holds 4300, and Playwright reuses whatever
  answers there. Set `E2E_PORT=4310` for every spec and verify run from the start.
- **L3 Format first.** Angular CLI edits and hand edits to JSON configs fail Prettier, and new
  imports of types fail `consistent-type-imports`. Run `npm run format` and `npx eslint --fix` from
  `frontend/` before the first verify; each saves a whole verify cycle.
- **L4 Routing in presentation components.** `components` never imports the router, so the header's
  brand, its nav links and the button are attribute components: the host keeps the mock's BEM class
  (`app-header__nav-link`, `btn`), and the app adds `routerLink`, `routerLinkActive` and
  `ariaCurrentWhenActive="page"`. The ESLint selector rule accepts kebab-case `wz-` attributes. Reuse
  this for every link-like component instead of designing a new pattern. A 44 px hit area is a
  `::after` with `inset-block: min(0px, calc((100% - var(--target-comfortable)) / 2))`.
- **L5 Bundle.** Zoneless Angular with the router and the shell is already 257 kB raw (about 68 kB
  transferred) of a 264 kB warning and a 280 kB error. Anything a later slice adds goes in a lazy
  chunk; check `Initial total` in `npm run build` before committing a new import.
- **L6 Music.** Pixabay answers scripted downloads with 403. A headed Chromium opened through
  Playwright passes the check, and the file comes from `cdn.pixabay.com`. *Beautiful Boom Bap* by
  Music_Unlimited is already in `docs/videos/assets/music/` and credited, measured at 92.99 BPM (a
  bar is 2.581 s, offset 0.009 s); reusing it saves the search.
- **L7 Film review.** One `--frame` render takes seconds and a full encode takes several minutes.
  Render one frame per scene and per act transition first, tile them into one sheet
  (`ffmpeg -i a.png -i b.png … -filter_complex hstack` or `tile`), fix, then encode once in the
  background with `--crf 23` while writing `README.md` and `script.md`. Known traps: on signal and
  bone fields `film.css` recolours the lockup, so do not put a lockup inside an ink card there; give
  `opening()` a `width` so the headline clears the device; the voice reads the purpose's
  parentheses as pauses while the picture and captions quote it exactly (`closing()` already does
  this).
