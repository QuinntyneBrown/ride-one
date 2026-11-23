import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.1, Decide the backend: the app as it runs today, Home at 390, 768, 1024 and
 * 1440 px, with every API request answered by the shared fixture, as it is in every spec. The slice changes no screen.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/28-1-decide-the-backend`.
 */
for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    api.answer("GET", "/api/riders/me", { id: "c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b", displayName: "Sam" });
    api.answer("GET", "/api/progress", midRiderProgress);
    api.answer("GET", "/api/classes", library);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect(home.classDoor).toBeVisible();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}
