import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.3, What the bike will do, in the running app: The Class at `/` with the
 * bike connected at four widths; the card "What the bike will do" close up at 1440 and 390 px, with its average, its
 * resistance profile and its line each on their own. Recorded against the
 * production build on 4310.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-3-what-the-bike-will-do`.
 */

/** Opens The Class with the remembered bike connected. */
async function connected(page: Parameters<typeof frame>[0], bluetooth: Parameters<typeof connectBike>[0]): Promise<TheClassPage> {
  await bluetooth.remember(echelonBike);
  const theClass = new TheClassPage(page);
  await theClass.open();
  await connectBike(bluetooth);
  await expect(theClass.start).toHaveText("Start class");
  return theClass;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The Class with what the bike will do, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const theClass = await connected(page, bluetooth);
    await expect(theClass.planWatts).toHaveText("~254 W average");
    await expect(theClass.profileBars).toHaveCount(33);
    await expect(theClass.effortBars).toHaveCount(17);
    await expect(theClass.planNote).toHaveText("17 efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal.");
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);

    if (size === "XL") {
      await detail(theClass.plan, "plan", 16);
      await detail(theClass.planWatts, "watts", 14);
      await detail(theClass.profile, "profile", 10);
      await detail(theClass.planNote, "note", 6);
    }
    if (size === "XS") {
      await theClass.planNote.scrollIntoViewIfNeeded();
      await detail(theClass.plan, "plan-xs", 12);
    }
  });
}
