import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 29.2, Say why the bike cannot be reached, in the running app: Connect Bike with
 * Bluetooth off at four widths, and Try again bringing the pair button back; a browser without Web Bluetooth; a page
 * on plain http; a chooser a policy blocks and one that fails for another reason; and each alert close up.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/29-2-say-why-the-bike-cannot-be-reached`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Bluetooth off, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.adapterOff();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerTitle).toHaveText("Bluetooth is off");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `off-${size.toLowerCase()}`);

    if (size === "XL") {
      await bluetooth.adapterOn();
      await connect.blockerAction.click();
      await expect(connect.pairButton).toHaveText("Pair Echelon EX-5s");
      await page.mouse.move(0, 0);
      await shot(page, "back-xl");
    }
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`A browser without Web Bluetooth, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remove();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `unsupported-${size.toLowerCase()}`);
  });

  test(`Plain http, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.servePlainHttp();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerAction).toHaveText("Open over HTTPS");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `https-${size.toLowerCase()}`);
  });

  test(`A chooser a policy blocks, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.blockChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await connect.pair();
    await expect(connect.blockerTitle).toHaveText("Bluetooth is blocked for this page");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `blocked-${size.toLowerCase()}`);
  });

  test(`A chooser that fails for another reason, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.failChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await connect.pair();
    await expect(connect.blockerTitle).toHaveText("The bike list didn’t open");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `failed-${size.toLowerCase()}`);
  });
}

test("Each alert, close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const connect = new ConnectBikePage(page);
  // No zoom: at 1440 px the alert is 456 px wide and the shot is taken at two device pixels a CSS pixel, which is
  // the film's size, and its lines break as they do in the app.
  const closeUp = async (name: string) => {
    await expect(connect.blocker).toBeVisible();
    await page.mouse.move(0, 0);
    await detail(connect.blocker, name, 12);
  };

  await bluetooth.adapterOff();
  await connect.open();
  await closeUp("alert-off");

  await bluetooth.adapterOn();
  await connect.blockerAction.click();
  await bluetooth.blockChooser();
  await connect.pair();
  await expect(connect.blockerTitle).toHaveText("Bluetooth is blocked for this page");
  await closeUp("alert-blocked");

  await bluetooth.failChooser();
  await connect.blockerAction.click();
  await expect(connect.blockerTitle).toHaveText("The bike list didn’t open");
  await closeUp("alert-failed");
});

test("The unsupported-browser alert, close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remove();
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
  await page.mouse.move(0, 0);
  await detail(connect.blocker, "alert-unsupported", 12);
});

test("The HTTPS alert, close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.servePlainHttp();
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.blockerAction).toHaveText("Open over HTTPS");
  await page.mouse.move(0, 0);
  await detail(connect.blocker, "alert-https", 12);
});
