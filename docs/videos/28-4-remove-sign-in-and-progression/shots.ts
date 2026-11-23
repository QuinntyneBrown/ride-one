import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.4, Remove sign-in and progression, in the running app: a new browser on
 * Connect Bike with no sign-in; Home, whose header has no streak, level or XP, at 390, 768, 1024 and 1440 px; Profile
 * with its two rows; the Class Library with every class open; and Results after a class ridden to its end, with no XP.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/28-4-remove-sign-in-and-progression`.
 */

test("A new browser opens on Connect Bike, with no sign-in, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  await new HomePage(page).open();
  await expect(page).toHaveURL("/connect");
  await expect(new ConnectBikePage(page).pairButton).toBeVisible();
  expect(api.requests()).toEqual([]);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "connect-xl");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home's header has no streak, level or XP, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect(home.teaserTitle).toBeVisible();
    await expect(home.header.level).toHaveCount(0);
    await expect(home.header.streak).toHaveCount(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("Profile has the bike and Ride settings, at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.rowTitles).toHaveText(["Echelon EX-5s", "Ride settings"]);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "profile-xl");
});

test("Every class is open, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/classes", library);
  await bluetooth.remember(echelonBike);
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.cards).toHaveCount(library.classes.length);
  await expect(classes.locks).toHaveCount(0);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "library-xl");
});

test("Results after a class ridden to its end shows no XP, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await startClassRide(page, bluetooth, api);
  await page.clock.fastForward("29:58");
  await page.clock.runFor(2000);
  const results = new ResultsPage(page);
  await results.shown();
  await expect(results.big).toHaveText("30:00");
  await expect(results.earned).toHaveCount(0);
  expect([...new Set(api.requests())]).toEqual(["GET /api/classes"]);
  await page.evaluate(() => document.fonts.ready);
  let done = false;
  const taken = shot(page, "results-xl").finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
});
