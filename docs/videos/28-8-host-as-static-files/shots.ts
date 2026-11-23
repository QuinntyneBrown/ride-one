import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import { StaticHost } from "../../../frontend/e2e/pages/static-host";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, detailAll, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.8, Host as static files, in the running app. The slice changes no screen,
 * and the film shows the screens as the static host's configuration serves them: the class at `/` at four widths; the
 * class ride opened by its address, which matches no file; and an unknown address, which reaches Page not found.
 * Recorded against the production build served by `frontend/scripts/serve-dist.mjs` on 4310, which follows the
 * `staticwebapp.config.json` in the build, so each answer is checked for the headers the film names.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/28-8-host-as-static-files`.
 */

const YEAR = "max-age=31536000";

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The class at /, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();
    await expect(start.title).toHaveText("Intervals to the Beat");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);
  });
}

test("The class ride opened by its address, at XL", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  await webgl.disable();
  const answer = await new StaticHost(page).open("/classes/intervals-to-the-beat/ride");
  expect(answer.status).toBe(200);
  expect(answer.headers["strict-transport-security"]).toBe(YEAR);
  const loading = new WorldLoadingPage(page);
  await expect(loading.title).toHaveText("Intervals to the Beat");
  await expect(loading.cardTitle).toHaveText("Ibiza Sunset Strip is ready as a panorama");
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "deep-xl");
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`An unknown address reaches Page not found, at ${size}`, async ({ page }) => {
    await frame(page, size);
    const answer = await new StaticHost(page).open("/no-such-screen");
    expect(answer.status).toBe(200);
    expect(answer.headers["cache-control"]).toBe("no-cache");
    const notFound = new NotFoundPage(page);
    await expect(notFound.heading).toHaveText("This page doesn’t exist.");
    await page.mouse.move(0, 0);
    await shot(page, `unknown-${size.toLowerCase()}`);
    if (size === "XL") await detailAll([notFound.heading, notFound.lead, notFound.backToClass], "not-found", 24);
  });
}
