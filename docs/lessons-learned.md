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
| L1 | Work the slice in its own worktree, cut from `origin/telo-ride`, with `frontend/node_modules` and `.cache` symlinked before anything writes there; stage named paths only; in zsh, write paths out rather than in one `$VAR`. | 1.1 | 1.2, 1.3 | Saved time |
| L2 | Run specs and verify with `E2E_PORT=4310` (or another free port); never kill whatever holds 4300. | 1.1 | 1.2, 1.3 | Saved time |
| L3 | Run `npm run format` and `npx eslint --fix` (frontend) or `dotnet format` (backend) before the first verify after any CLI or config edit. | 1.1 | 1.2, 1.3 | Little effect |
| L4 | A link or button in `components` is an attribute component (`a[wz-…]`, `button[wz-…]`); the app adds `routerLink` and `routerLinkActive` (ADR 0024). | 1.1 | 1.2, 1.3 | Did not apply |
| L5 | Read the initial chunk in the build output after every route or import change; the baseline is 257 kB raw against a 264 kB warning. | 1.1 | 1.2, 1.3 | Did not apply |
| L6 | Reuse the measured boom bap track in `docs/videos/assets/music/`; if a new one is needed, download it through headed Chromium. | 1.1 | 1.2, 1.3 | Saved time |
| L7 | Review every scene with `--frame` on one contact sheet before the full encode; encode in the background with `--crf 23` for films over 2 minutes. | 1.1 | 1.2, 1.3 | Saved time |
| L8 | Backend packages: EF Core on 10.0.x (11 needs .NET 11), MediatR 12.5 (last Apache 2.0), xUnit v3 on Microsoft Testing Platform (`backend/global.json`); probe a new package in a scratch project before an ADR names it; pin a vulnerable transitive package in `Directory.Packages.props`. | 1.2 | 1.3 | Saved time |
| L9 | A backend acceptance test is a fixture subclassing `TeloRideApiFactory` (`ConfigureServices` injects the fault); `ProbeController` and `SignedInProbeApi` stand in for endpoints and sign-in until features add theirs; await with `EventProbe<T>` (spans and hub events), never sleep; a hub test connects `HubConnectionBuilder` through `Server.CreateHandler()`; prove a guard by removing it once. | 1.2 | 1.3 | Saved time |
| L10 | A film scene's id is its element's DOM id: never name a scene `errors`, `captions`, `play`, `frame` or `stage`, which `film.css` and the runtime already use. | 1.2 | 1.3 | Saved time |
| L11 | Prove a test double from the outside: a spec drives the browser API through a helper (`AppCalls`) until the app's own client exists; prove its guard with `test.fail()`, and run once without it to read the failure's reason. | 1.3 | | |
| L12 | In zsh and BSD tools: quote globs in arguments (`--include='*.cs'`), and replace whole words with `perl -pi -e 's/\bOld\b/New/g'`; BSD `sed` has no `\b`. | 1.3 | | |
| L13 | When the lockfile changes, verify's `npm ci` replaces the worktree's `node_modules` link with its own fresh install (about 4 s; the main checkout's copy is untouched): delete it with `rm -rf` before `git worktree remove`, and copy any added package into the main checkout's `node_modules` so the next worktree's link has it. | 1.3 | | |

## Log

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
  (First written as the reverse; corrected in 1.4 when `git worktree remove` met a real folder.)

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
