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
| L1 | Work the slice in its own worktree, cut from `origin/telo-ride`, with `frontend/node_modules` symlinked; stage named paths only. | 1.1 | | |
| L2 | Run specs and verify with `E2E_PORT=4310` (or another free port); never kill whatever holds 4300. | 1.1 | | |
| L3 | Run `npm run format` and `npx eslint --fix` before the first verify after any CLI or config edit. | 1.1 | | |
| L4 | A link or button in `components` is an attribute component (`a[wz-…]`, `button[wz-…]`); the app adds `routerLink` and `routerLinkActive` (ADR 0024). | 1.1 | | |
| L5 | Read the initial chunk in the build output after every route or import change; the baseline is 257 kB raw against a 264 kB warning. | 1.1 | | |
| L6 | Reuse the measured boom bap track in `docs/videos/assets/music/`; if a new one is needed, download it through headed Chromium. | 1.1 | | |
| L7 | Review every scene with `--frame` on one contact sheet before the full encode; encode in the background with `--crf 23` for films over 2 minutes. | 1.1 | | |

## Log

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
