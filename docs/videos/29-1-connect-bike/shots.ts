import { ECHELON_INITIALISED, ECHELON_NOTIFY, echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import type { Page } from "@playwright/test";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 29.1, Connect Bike, in the running app: the screen at rest at four widths; the
 * card searching while the browser's list of bikes is open; the bike picked, pairing; the bike paired; The Class after
 * it, with the bike connected; and the device card with its button close up in each state, with the works-with list.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/29-1-connect-bike`.
 */

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];

/** Takes a picture under a paused clock: the clock is stepped while it is taken, so the page can render. */
async function onPausedClock(page: Page, take: () => Promise<void>): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(4);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Connect Bike at rest, at ${size}`, async ({ page }) => {
    await frame(page, size);
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.pairButton).toHaveText("Pair Echelon EX-5s");
    await expect(connect.deviceIdentifier).toHaveCount(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `rest-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`Searching, pairing and paired, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.offer(echelonBike);
    await bluetooth.holdChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await pictures(page);
    await connect.pair();
    await expect(connect.searching).toHaveText("Looking for bikes nearby…");
    await expect(connect.pairButton).toHaveText("Searching…");
    await page.mouse.move(0, 0);
    await shot(page, `searching-${size.toLowerCase()}`);

    await bluetooth.pickFromChooser();
    await expect(connect.pairButton).toHaveText("Pairing…");
    await expect(connect.deviceIdentifier).toHaveText("EX5S-141844");
    await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
    await shot(page, `pairing-${size.toLowerCase()}`);

    // The clock stops before the bike answers, so the half second before The Class does not run out under the shot.
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 60_000);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
    await expect
      .poll(async () => {
        await page.clock.runFor(20);
        return connect.pairedCheck.count();
      })
      .toBe(1);
    await expect(connect.pairButton).toHaveText("Paired");
    await onPausedClock(page, () => shot(page, `paired-${size.toLowerCase()}`));

    if (size === "XL") {
      const start = new ClassStartPage(page);
      await expect
        .poll(async () => {
          await page.clock.runFor(100);
          return start.url();
        })
        .toBe("/");
      await expect
        .poll(async () => {
          await page.clock.runFor(100);
          return (await start.header.bike.textContent())?.trim();
        })
        .toBe("Echelon EX-5s connected");
      await page.clock.resume();
      await expect(start.title).toBeVisible();
      await pictures(page);
      await page.mouse.move(0, 0);
      await shot(page, "class-xl");
    }
  });
}

test("The device card and its button in each state, close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.offer(echelonBike);
  await bluetooth.holdChooser();
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.pairButton).toHaveText("Pair Echelon EX-5s");
  // The browser's zoom, so the close-ups are drawn at the film's size and not enlarged from a small picture.
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  await page.mouse.move(0, 0);
  await detail(connect.pairArea, "card-rest", 12);

  await connect.pair();
  await expect(connect.pairButton).toHaveText("Searching…");
  await page.mouse.move(0, 0);
  await detail(connect.pairArea, "card-searching", 12);

  await bluetooth.pickFromChooser();
  await expect(connect.pairButton).toHaveText("Pairing…");
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await detail(connect.pairArea, "card-pairing", 12);

  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 60_000);
  await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
  await expect
    .poll(async () => {
      await page.clock.runFor(20);
      return connect.pairedCheck.count();
    })
    .toBe(1);
  await onPausedClock(page, () => detail(connect.pairArea, "card-paired", 12));
});

test("The works-with list, close up", async ({ page }) => {
  await frame(page, "XS");
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.worksWithBikes).toHaveCount(5);
  await page.mouse.move(0, 0);
  await detail(connect.worksWith, "works-with", 12);
});
