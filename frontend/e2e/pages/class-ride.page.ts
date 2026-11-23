import type { Locator, Page } from '@playwright/test';

/** Class Ride at `/classes/:id/ride` (docs/mocks/pages/class-ride/): the header, the video and the bike panel. */
export class ClassRidePage {
  readonly name: Locator;
  readonly clock: Locator;
  readonly finish: Locator;
  readonly segmentKind: Locator;
  readonly segmentLeft: Locator;
  readonly segmentFill: Locator;
  readonly profile: Locator;
  readonly cover: Locator;
  readonly pause: Locator;
  readonly resume: Locator;
  readonly leave: Locator;
  readonly paused: Locator;
  readonly lost: Locator;
  readonly reconnect: Locator;
  readonly videoNotice: Locator;
  readonly power: Locator;
  readonly powerHint: Locator;
  readonly cadence: Locator;
  readonly cadenceHint: Locator;
  readonly resistance: Locator;
  readonly level: Locator;
  readonly raise: Locator;
  /** The group board Telo Ride had; Telo Ride 1 has none (ADR 0038). */
  readonly board: Locator;
  readonly lower: Locator;
  /** The class's world on the stage (class-ride/world): its panorama, the world drawn over it, and the video in the corner. */
  readonly world: Locator;
  readonly worldPanorama: Locator;
  readonly worldScene: Locator;
  readonly worldVideo: Locator;

  constructor(private readonly page: Page) {
    this.name = page.locator('.class-ride__name');
    this.clock = page.locator('.class-ride__clock');
    this.finish = page
      .getByRole('link', { name: 'Finish' })
      .or(page.getByRole('button', { name: 'Finish' }));
    this.segmentKind = page.locator('.class-segment__kind');
    this.segmentLeft = page.locator('.class-segment__left');
    this.segmentFill = page.locator('.class-segment__fill');
    this.profile = page.getByRole('img', { name: 'Resistance profile' });
    this.cover = page.locator('.class-video .photo');
    this.pause = page.getByRole('button', { name: 'Pause', exact: true });
    this.resume = page.getByRole('button', { name: 'Resume', exact: true });
    this.leave = page.getByRole('link', { name: 'Leave class' });
    this.paused = page.locator('.class-video__paused');
    this.lost = page.getByRole('alert').filter({ hasText: 'Lost the bike' });
    this.reconnect = page.getByRole('button', { name: 'Reconnect' });
    this.videoNotice = page.locator('.class-video__notice');
    const stat = (label: string) =>
      page.locator('.class-stat').filter({ has: page.getByText(label, { exact: true }) });
    this.power = stat('Power').locator('.class-stat__number');
    this.powerHint = stat('Power').locator('.class-stat__hint');
    this.cadence = stat('Cadence').locator('.class-stat__number');
    this.cadenceHint = stat('Cadence').locator('.class-stat__hint');
    this.resistance = page.locator('.class-resist__value');
    this.level = page.locator('.class-resist__level');
    this.raise = page.getByRole('button', { name: 'Raise resistance' });
    this.board = page.getByRole('complementary', { name: 'Group board' });
    this.lower = page.getByRole('button', { name: 'Lower resistance' });
    this.world = page.locator('.class-world');
    this.worldPanorama = this.world.locator('.class-world__panorama');
    this.worldScene = this.world.locator('canvas.world-scene');
    this.worldVideo = this.world.locator('.class-world__video .class-video');
  }

  /** Opens the ride at an address that names a group session, as a bookmark from Telo Ride would (ADR 0038). */
  async openWithSession(classId: string, sessionId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}/ride?session=${sessionId}`);
  }

  async open(classId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}/ride?mode=solo`);
  }

  /** The width the segment's progress bar is filled to, as a share of the bar (0 to 1). */
  segmentProgress(): Promise<number> {
    return this.segmentFill.evaluate(
      (fill) =>
        fill.getBoundingClientRect().width / fill.parentElement!.getBoundingClientRect().width,
    );
  }
}
