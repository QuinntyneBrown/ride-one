import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import { freeRide } from "../../../frontend/e2e/fixtures/states";
import { EditPlanPartDialog } from "../../../frontend/e2e/pages/edit-plan-part.dialog";
import { SetupPage } from "../../../frontend/e2e/pages/setup.page";
import {
  detail,
  detailAll,
  frame,
  shot,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 05: journey 5, Build an intervals plan, in the running app. The setup
 * screen at /setup with Intervals chosen: the Descending recoveries plan of first use, its set
 * list and preview, Edit set 2 in its dialog, the warm-up's dialog, Add set, and Even sets. Every
 * /api request and the event stream are answered in memory by the stubs of frontend/e2e; no
 * backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/05-journey-05-build-an-intervals-plan` runs it.
 */

const lower = (size: Size) => size.toLowerCase();

async function intervals(setup: SetupPage): Promise<void> {
  await setup.open(freeRide());
  await setup.intervalsCard.check();
  await expect(setup.preset("Descending recoveries")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

test("the plan and its dialogs at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const setup = new SetupPage(page, api, events);
  await intervals(setup);
  await shot(page, "intervals-xl");
  await detail(setup.intervalsModeCard, "mode-card", 16);
  await detail(setup.setList, "set-list", 16);
  await detailAll([setup.total, setup.profile], "preview", 6);

  await setup.rowAction("Edit set 2").click();
  const set2 = new EditPlanPartDialog(page, "Edit set 2");
  await expect(set2.field("Rounds")).toHaveValue("2");
  await set2.more("rounds").click();
  await expect(set2.field("Rounds")).toHaveValue("3");
  await shot(page, "edit-set-xl");
  await detail(set2.dialog, "edit-set", 0);
  await set2.saveButton.click();
  await expect(set2.dialog).toBeHidden();
  await expect(setup.total).toHaveText("33:00");
  await detail(setup.setRow(2), "set-2-saved", 12);
  await detailAll([setup.total, setup.profile], "preview-33", 6);

  await setup.rowAction("Edit warm-up").click();
  const warmup = new EditPlanPartDialog(page, "Warm-up");
  await expect(warmup.field("Duration")).toHaveValue("5:00");
  await detail(warmup.dialog, "warm-up", 0);
  await warmup.cancelButton.click();

  await setup.addSetButton.click();
  const add = new EditPlanPartDialog(page, "Add set");
  await expect(add.field("Rounds")).toHaveValue("1");
  await add.saveButton.click();
  await expect(setup.setRows).toHaveCount(6);
  await detail(setup.setList, "set-list-6", 16);

  await setup.preset("Even sets").click();
  await expect(setup.preset("Even sets")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await detail(setup.presets, "presets", 16);
  await detailAll([setup.total, setup.profile], "preview-even", 6);
});

test("the plan on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const setup = new SetupPage(page, api, events);
  await intervals(setup);
  await setup.setList.scrollIntoViewIfNeeded();
  await shot(page, `intervals-${lower("XS")}`);
});
