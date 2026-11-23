import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.2, Remove races, in the running app: `/race`, which is no screen any more, at
 * 390, 768, 1024 and 1440 px; Home with its greeting and its Classes door alone; and the header's navigation without
 * Race. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/28-2-remove-races`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`/race is no screen, at ${size}`, async ({ page }) => {
    await frame(page, size);
    const notFound = new NotFoundPage(page);
    await notFound.open("/race");
    await expect(notFound.heading).toHaveText("This page doesn’t exist.");
    await page.mouse.move(0, 0);
    await shot(page, `race-${size.toLowerCase()}`);
  });
}

test("Home without the Race door, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/riders/me", { id: "c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b", displayName: "Sam" });
  api.answer("GET", "/api/progress", midRiderProgress);
  api.answer("GET", "/api/classes", library);
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await expect(home.classDoor).toBeVisible();
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "home-xl");
  await detail(home.header.nav, "nav-xl", 16);
});
