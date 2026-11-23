import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The course in the video's box, in a ride in Ibiza (design-system block class-course; docs/mocks/pages/class-ride/
 * ibiza, ibiza-loading and paused-ibiza): the course's still under "Loading Ibiza Sunset Strip" until the course is
 * drawn (L2-175 AC1), then the course alone, drawn in the `scene` slot, and the class video's "Paused" over it
 * (L2-091 AC1). When the course cannot be drawn the still stays and a notice stands under the box (L2-175 AC2, docs/
 * mocks/pages/class-ride/ibiza-unavailable). There is no video in it (L2-174 AC1). This component only lays them out.
 */
@Component({
  selector: 'wz-class-course',
  imports: [Button, InlineMessage],
  templateUrl: './class-course.html',
  styleUrl: './class-course.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassCourse {
  /** The course's name: "Ibiza Sunset Strip". */
  readonly name = input.required<string>();
  /** The course's still and what it shows, which stands in the box until the course is drawn. */
  readonly still = input.required<{ readonly url: string; readonly alt: string }>();
  /** Whether the course's first frame is still to be drawn: the still and "Loading …" show. */
  readonly loading = input(true);
  /** Draws "Paused" over the course, as the class video does (L2-091 AC1); the page announces the pause itself. */
  readonly paused = input(false);
  /** Whether the course cannot be drawn: the still stays, "Loading …" goes and a notice stands under the box. */
  readonly unavailable = input(false);
  /** Whether the music is on: the "Music" toggle in the corner is pressed (L2-176 AC5). */
  readonly musicOn = input(true);
  /** Whether the music can play: a toggle for music that cannot is disabled, with no alert (L2-176 AC7). */
  readonly musicAvailable = input(true);
  /** The rider pressed the "Music" toggle. */
  readonly musicToggle = output<void>();
}
