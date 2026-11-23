import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { COURSE_GRAPHICS, HOW_TO_RIDE, WORLD_DOWNLOADER } from '@telo/api';
import {
  BackLink,
  Banner,
  Button,
  ClassPlan,
  ScreenHeader,
  LoadCard,
  Pill,
} from '@telo/components';
import { FetchWorldDownloader, rideWith } from '@telo/domain';
import { ClassRideSession } from './class-ride-session';
import { WorldLoadStore } from './world-load-store';

/**
 * `/classes/:id/ride`, ridden as the rider chose on The Class (L2-173 AC5). With "Class video" the class ride starts at
 * once with the video alone. With "Ibiza Sunset Strip" it is the carried-over ride in the course, until riding in
 * Ibiza is built as L2-174 to L2-177 specify: World loading (docs/mocks/pages/world-loading/) until the class's world
 * is ready and the rider presses Start riding, then the class ride at the same address (L2-151). World loading is the class over its world's
 * panorama and the load card; the ride's own providers come with `ClassRideSession`, so its clock and its first
 * command wait for Start riding. Leaving releases what the load acquired (AC5).
 */
@Component({
  selector: 'wz-class-ride-page',
  imports: [
    BackLink,
    Banner,
    Button,
    ClassPlan,
    ClassRideSession,
    ScreenHeader,
    LoadCard,
    Pill,
    RouterLink,
  ],
  templateUrl: './class-ride-page.html',
  styleUrl: './class-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorldLoadStore, { provide: WORLD_DOWNLOADER, useClass: FetchWorldDownloader }],
})
export default class ClassRidePage {
  /**
   * World loading's state when the rider chose Ibiza Sunset Strip; `null` with the class video, which rides at once
   * with the video alone and loads nothing of the course (L2-173 AC5).
   */
  protected readonly loading =
    rideWith(inject(HOW_TO_RIDE).kept(), inject(COURSE_GRAPHICS).available()) === 'ibiza'
      ? inject(WorldLoadStore)
      : null;
  private readonly start = viewChild('start', { read: ElementRef<HTMLButtonElement> });

  constructor() {
    // Start riding takes focus when the world is ready (L2-153 AC2).
    effect(() => this.start()?.nativeElement.focus());
  }

  /** Start riding, or Ride with the panorama. */
  protected ride(): void {
    this.loading?.ride();
  }
}
