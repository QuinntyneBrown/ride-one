import type { Locator, Page } from '@playwright/test';
import { ClassHeader } from './class-header';

/**
 * The Class at `/` (docs/mocks/pages/the-class/): the header with the bike status, the video's box, the class's
 * words and length, "Ride with", what the bike will do and the one start button.
 */
export class TheClassPage {
  readonly header: ClassHeader;
  readonly skipLink: Locator;
  readonly main: Locator;
  /** The header's bike status, a link to Connect Bike (L2-019). */
  readonly bike: Locator;
  readonly bikeIcon: Locator;
  readonly bikeAction: Locator;
  /** What shows in the class's place when the class breaks a rule (the-class/cannot-load), with Reload. */
  readonly unavailable: Locator;
  readonly reload: Locator;
  readonly title: Locator;
  readonly meta: Locator;
  readonly summary: Locator;
  readonly duration: Locator;
  readonly durationLabel: Locator;
  /** The video's box: the class cover, the element the player embeds in, and the course's still. */
  readonly video: Locator;
  readonly cover: Locator;
  readonly player: Locator;
  readonly still: Locator;
  /** "What the bike will do" (L2-084 AC2): the card, its heading, the average, the resistance profile and the line. */
  readonly plan: Locator;
  readonly planTitle: Locator;
  readonly planWatts: Locator;
  readonly profile: Locator;
  readonly profileBars: Locator;
  readonly effortBars: Locator;
  readonly planNote: Locator;
  /** The plan chart carried over from Telo Ride, with the length and the structure line; The Class no longer has it. */
  readonly carriedOverPlan: Locator;
  /** "Ride with" (L2-173): the radio group and its two options. */
  readonly rideWith: Locator;
  readonly options: Locator;
  readonly classVideo: Locator;
  readonly ibiza: Locator;
  readonly ibizaDetail: Locator;
  /** The start button the layout shows: in the details column from lg, pinned to the bottom below it. */
  readonly start: Locator;
  readonly startHint: Locator;
  /** The choice between riding alone and with a group that Telo Ride had; Telo Ride 1 has none (ADR 0038). */
  readonly choice: Locator;
  /** Join, which Telo Ride offered for a group session; Telo Ride 1 has none. */
  readonly join: Locator;

  constructor(private readonly page: Page) {
    this.header = new ClassHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
    this.bike = page.locator('.the-class__bike');
    this.bikeIcon = this.bike.locator('.the-class__bike-icon');
    this.bikeAction = this.bike.locator('.the-class__bike-action');
    this.unavailable = page.locator('.the-class__unavailable').getByRole('alert');
    this.reload = page.getByRole('button', { name: 'Reload' });
    this.title = page.getByRole('heading', { level: 1 });
    this.meta = page.locator('.the-class__meta');
    this.summary = page.locator('.the-class__summary');
    this.duration = page.locator('.the-class__duration');
    this.durationLabel = page.locator('.the-class__duration-label');
    this.video = page.locator('.the-class__video');
    this.cover = this.video.locator('.photo--yt');
    this.player = this.video.locator('.the-class__player');
    this.still = this.video.getByRole('img', {
      name: 'Ibiza Sunset Strip: a seafront road at sunset',
    });
    this.plan = page.getByRole('region', { name: 'What the bike will do' });
    this.planTitle = this.plan.getByRole('heading', { level: 2, name: 'What the bike will do' });
    this.planWatts = this.plan.locator('.the-class__plan-watts');
    this.profile = this.plan
      .locator('.the-class__profile')
      .getByRole('img', { name: 'Resistance profile' });
    this.profileBars = this.profile.locator('rect');
    this.effortBars = this.profile.locator('rect.class-profile__work');
    this.planNote = this.plan.locator('.the-class__plan-note');
    this.carriedOverPlan = page.locator('.class-plan');
    this.rideWith = page.getByRole('radiogroup', { name: 'Ride with' });
    this.options = this.rideWith.getByRole('radio');
    this.classVideo = this.rideWith.getByRole('radio', { name: 'Class video' });
    this.ibiza = this.rideWith.getByRole('radio', { name: /^Ibiza Sunset Strip/ });
    this.ibizaDetail = this.ibiza.locator('.ride-with__detail');
    this.start = page.locator('.the-class__start:visible');
    this.startHint = page.locator('.the-class__start-hint:visible');
    this.choice = page.getByRole('radiogroup', { name: 'Ride alone or with a group' });
    this.join = page.getByRole('button', { name: /^Join/ });
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  /** The colour behind the page. */
  background(): Promise<string> {
    return this.page
      .locator('.the-class-page')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  }

  /** How tall an element is drawn, in CSS pixels. */
  async height(element: Locator): Promise<number> {
    return (await element.boundingBox())?.height ?? 0;
  }

  /** How wide an element is drawn, in CSS pixels: 1 for text hidden from sight but still read. */
  async width(element: Locator): Promise<number> {
    return (await element.boundingBox())?.width ?? 0;
  }

  /** The resistance profile's box (`viewBox`) and its bars as they are drawn in it, in the plan's order. */
  async drawnProfile(): Promise<{
    box: string | null;
    bars: { element: string; x: number; width: number; height: number }[];
  }> {
    return {
      box: await this.profile.getAttribute('viewBox'),
      bars: await this.profileBars.evaluateAll((rects) =>
        rects.map((rect) => ({
          element: rect.getAttribute('class') ?? '',
          x: Number(rect.getAttribute('x')),
          width: Number(rect.getAttribute('width')),
          height: Number(rect.getAttribute('height')),
        })),
      ),
    };
  }

  /** Whether an element is drawn wholly inside the window's width, once it has been brought into view. */
  async fitsTheWidth(element: Locator): Promise<boolean> {
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    const width = this.page.viewportSize()?.width ?? 0;
    return box !== null && box.x >= 0 && box.x + box.width <= width;
  }

  /** Whether an option of "Ride with" shows its mark, the dot in its ring, so the choice is not told by colour alone. */
  marked(option: Locator): Promise<boolean> {
    return option
      .locator('.ride-with__mark')
      .evaluate((mark) => getComputedStyle(mark, '::before').scale === '1');
  }

  /**
   * Resolves once the video's box has settled: the player has put its frame in the box, or the video cannot load and
   * the box holds the cover alone (L2-084 AC9).
   */
  async videoSettled(): Promise<void> {
    await this.player
      .locator('*')
      .first()
      .or(this.video.locator(':scope:not(:has(.the-class__player))'))
      .waitFor({ state: 'attached' });
  }
}
