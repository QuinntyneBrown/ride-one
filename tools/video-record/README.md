# video-record

> **Out of date.** The films' `shots.ts` scripts were written against the old `/api` stub
> fixtures (`wz-test.ts` with `api` and `events`, `fixtures/states.ts`), which went with the
> backend. They must be ported to the fake `navigator.bluetooth` fixture before a film can be
> re-shot; the published films are unchanged.

Saves a video's screenshots: runs the folder's `shots.ts` in Chromium against the running app and
writes PNGs at double density into the folder's `shots/`. Standard: `docs/videos/README.md`,
"Screenshots".

```
node tools/video-record/record.mjs docs/videos/NN-journey-JJ-topic
```

It is not a test and not a sweep. It has its own Playwright config (`playwright.config.ts` here,
matching only `shots.ts` in the given folder), compares nothing, and is not run by `npm run e2e` or
CI. The app on `:4310` is reused when it is running and started with `ng serve` otherwise. Every
`/api/**` request and the event stream are answered by the fixtures of
`frontend/e2e/fixtures/wz-test.ts`, as in every spec; no backend and no bike are involved.

## Writing `shots.ts`

```ts
import { expect, test } from '../../../frontend/e2e/fixtures/wz-test';
import { freeRide } from '../../../frontend/e2e/fixtures/states';
import { SetupPage } from '../../../frontend/e2e/pages/setup.page';
import { detail, frame, shot } from '../../../tools/video-record/shots';

test('setup', async ({ page, api, events }) => {
  await frame(page, 'XL'); // 1440×900, dark
  const setup = new SetupPage(page, api, events);
  await setup.open(freeRide());
  await expect(setup.heading).toHaveText('Set up your ride');
  await shot(page, 'setup-xl'); // shots/setup-xl.png
  await detail(setup.presets, 'presets', 20); // a close-up
});
```

| Helper | What it does |
|--------|--------------|
| `frame(page, size, theme = 'dark')` | Sets the window (`'XS'` 390×780, `'M'` 768×1024, `'L'` 1024×768, `'XL'` 1440×900) and the theme (stored as `wattzup.theme` before the app loads), with reduced motion. Call it before opening a screen. |
| `shot(page, name)` | Saves the window as `shots/<name>.png`, once the fonts have settled, with animations disabled and the caret hidden. |
| `detail(locator, name, pad = 16)` | Saves one region with `pad` CSS pixels of air around it: the close-up of a scene. |
| `detailAll(locators, name, pad = 16)` | The same for the smallest region holding several. |
| `bringToTop(locator, offset = 96)` | Scrolls a region to the top of the window before a shot. |
| `traceSamples(segments, upTo)` | A seeded power history that follows a plan, for `GET /api/workout/trace`. |
| `pictures(page)` | Waits until every picture on the page has arrived. |
| `SIZES`, `shotsDir` | The four windows, and where the pictures go. |

Selectors stay in the page objects of `frontend/e2e/pages/`; `shots.ts` names regions, as a spec
does.
