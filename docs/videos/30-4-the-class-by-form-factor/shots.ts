import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.4, The Class by form factor, in the running app: The Class at `/` with the
 * bike connected at the four widths of every film; on an 11" tablet in landscape (1194 × 834) and in portrait
 * (834 × 1194); with no bike at 1024 × 768, where the column is drawn tighter; in a window 1440 × 660, where the
 * video gives up height; on a phone at the end of its scroll; and close up, the details column, the pinned bar and
 * the one start button with the keyboard's focus in each layout. Recorded against the production build
 * (`E2E_PORT=4377`).
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-4-the-class-by-form-factor`.
 */

type Shown = Parameters<typeof frame>[0];
type Bike = Parameters<typeof connectBike>[0];

/** Opens The Class with the remembered bike connected, at rest. */
async function connected(page: Shown, bluetooth: Bike): Promise<TheClassPage> {
  await bluetooth.remember(echelonBike);
  const theClass = new TheClassPage(page);
  await theClass.open();
  await connectBike(bluetooth);
  await expect(theClass.start).toHaveText("Start class");
  await theClass.videoSettled();
  await pictures(page);
  await page.mouse.move(0, 0);
  return theClass;
}

/** A window that is not one of the four every film shows, in the dark theme with reduced motion. */
async function sized(page: Shown, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The Class at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const theClass = await connected(page, bluetooth);
    await shot(page, `class-${size.toLowerCase()}`);

    if (size === "XL") {
      expect(await theClass.scrollsDownBy()).toBe(0);
      await detail(theClass.info, "aside", 16);
      await detail(theClass.video, "video", 12);
      await theClass.tabTo(theClass.start);
      await detail(theClass.start, "start-focus", 14);
    }
    if (size === "XS") {
      await detail(theClass.footer, "footer", 0);
      await theClass.scrollToTheEnd();
      await shot(page, "class-xs-end");
      await theClass.tabTo(theClass.start);
      await detail(theClass.footer, "footer-focus", 0);
    }
  });
}

test("The Class on an 11 inch tablet, in landscape and in portrait", async ({ page, bluetooth }) => {
  await sized(page, 1194, 834);
  const theClass = await connected(page, bluetooth);
  expect(await theClass.scrollsDownBy()).toBe(0);
  await shot(page, "tablet-landscape");

  await sized(page, 834, 1194);
  await expect(theClass.footer).toBeVisible();
  await shot(page, "tablet-portrait");
});

test("The Class with no bike at 1024 × 768, the column drawn tighter", async ({ page, bluetooth }) => {
  await frame(page, "L");
  await bluetooth.remember(echelonBike);
  const theClass = new TheClassPage(page);
  await theClass.open();
  await expect(theClass.start).toHaveText("Connect your bike");
  await expect(theClass.startHint).toBeVisible();
  await theClass.videoSettled();
  await pictures(page);
  expect(await theClass.scrollsDownBy()).toBe(0);
  await shot(page, "no-bike-l");
});

test("The Class in a window 1440 × 660, the video in the height left", async ({ page, bluetooth }) => {
  await sized(page, 1440, 660);
  const theClass = await connected(page, bluetooth);
  expect(await theClass.scrollsDownBy()).toBe(0);
  await shot(page, "short");
});
