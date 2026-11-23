import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { FirstScreen } from "../../../frontend/e2e/pages/first-screen";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.5, Open where the rider belongs, in the running app. Every one opens the
 * app at `/`: a new rider lands on Connect Bike at the four widths of every film; in a browser without Web Bluetooth
 * and on plain http, on Connect Bike with its alert; a rider with a remembered bike on The Class, first with the bike
 * switched off ("No bike", "Connect your bike") and then, once the bike is switched on and advertises, connected
 * without the chooser, with the bike status and the start button close up each time. Recorded against the production
 * build (`E2E_PORT=4377`).
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-5-open-where-the-rider-belongs`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a new rider opens on Connect Bike at ${size}`, async ({ page }) => {
    await frame(page, size);
    const screens = await FirstScreen.watch(page);
    const theClass = new TheClassPage(page);
    await theClass.open();

    const connect = new ConnectBikePage(page);
    await expect(connect.pairButton).toHaveText("Pair Echelon EX-5s");
    expect(theClass.url()).toBe("/connect");
    expect(await screens.drawn()).toEqual(["Connect Bike"]);
    await pictures(page);
    await shot(page, `connect-${size.toLowerCase()}`);
    if (size === "XL") await detail(connect.pairArea, "pair", 16);
  });
}

test("a new rider in a browser without Web Bluetooth opens on Connect Bike with its alert", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remove();
  const theClass = new TheClassPage(page);
  await theClass.open();

  const connect = new ConnectBikePage(page);
  await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
  expect(theClass.url()).toBe("/connect");
  await pictures(page);
  await shot(page, "blocked-xl");
  await detail(connect.blocker, "alert-browser", 16);
});

test("a new rider on plain http opens on Connect Bike with its alert", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.servePlainHttp();
  const theClass = new TheClassPage(page);
  await theClass.open();

  const connect = new ConnectBikePage(page);
  await expect(connect.blockerTitle).toHaveText("Open the secure version of this page");
  expect(theClass.url()).toBe("/connect");
  await pictures(page);
  await shot(page, "http-xs");
  await detail(connect.blocker, "alert-http", 16);
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`a rider with a remembered bike opens on The Class at ${size}, and the bike reconnects when it advertises`, async ({
    page,
    bluetooth,
  }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    await bluetooth.switchOff();
    const screens = await FirstScreen.watch(page);
    const theClass = new TheClassPage(page);
    await theClass.open();

    await expect(theClass.bike).toHaveAccessibleName("No bike · Connect");
    await expect(theClass.start).toHaveText("Connect your bike");
    expect(theClass.url()).toBe("/");
    expect(await screens.drawn()).toEqual(["The Class"]);
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    const s = size.toLowerCase();
    await shot(page, `class-off-${s}`);
    if (size === "XL") {
      await detail(theClass.bike, "status-off", 14);
      await detail(theClass.start, "start-off", 14);
    }

    await bluetooth.switchOn();
    await connectBike(bluetooth);
    await expect(theClass.bike).toHaveAccessibleName("Echelon EX-5s connected · Change");
    await expect(theClass.start).toHaveText("Start class");
    expect(bluetooth.requests()).toEqual([]);
    await shot(page, `class-on-${s}`);
    if (size === "XL") {
      await detail(theClass.bike, "status-on", 14);
      await detail(theClass.start, "start-on", 14);
    }
  });
}
