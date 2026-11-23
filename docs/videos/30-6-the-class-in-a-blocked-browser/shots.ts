import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import { type Size, detail, detailAll, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.6, The Class in a blocked browser, in the running app. Every one is of a
 * rider who paired a bike before, on The Class: in a browser without Web Bluetooth at the four widths of every film,
 * with the alert close up before and after Copy link is pressed, and the header's bike status and the disabled start
 * button close up; on plain http at 390 and 1440 px, with its alert close up; and the ride's address, which opens The
 * Class. Recorded against the production build (`E2E_PORT=4377`).
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-6-the-class-in-a-blocked-browser`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The Class in a browser without Web Bluetooth at ${size}`, async ({ page, bluetooth, clipboard }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    await bluetooth.remove();
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.noticeTitle).toHaveText("Open Telo Ride 1 in Chrome or Edge.");
    await expect(theClass.noticeAction).toHaveText("Copy link");
    await expect(theClass.bike).toHaveAccessibleName("No bike · Connect");
    await expect(theClass.start).toBeDisabled();
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    const s = size.toLowerCase();
    await shot(page, `chromium-${s}`);
    if (size === "XL") {
      await detail(theClass.bike, "status-off", 14);
      await detailAll([theClass.start, theClass.startHint], "start-off", 14);
    }
    if (size === "XS") {
      await detail(theClass.notice, "notice-browser", 0);
      await theClass.noticeAction.click();
      await expect(theClass.noticeAction).toHaveText("Copied");
      expect(await clipboard.copied()).toEqual([theClass.address()]);
      await page.mouse.move(0, 0);
      await detail(theClass.notice, "notice-copied", 0);
    }
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`The Class on plain http at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    await bluetooth.servePlainHttp();
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.noticeTitle).toHaveText("Open the secure version of this page.");
    await expect(theClass.noticeAction).toHaveText("Open over HTTPS");
    await expect(theClass.start).toBeDisabled();
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `https-${size.toLowerCase()}`);
    if (size === "XS") await detail(theClass.notice, "notice-http", 0);
  });
}

test("the ride's address opens The Class in a blocked browser", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  await bluetooth.remove();
  const theClass = new TheClassPage(page);
  await theClass.openRide();

  await expect(theClass.title).toHaveText("Intervals to the Beat");
  await expect(theClass.start).toBeDisabled();
  expect(theClass.url()).toBe("/");
  expect(bluetooth.requests()).toEqual([]);
});
