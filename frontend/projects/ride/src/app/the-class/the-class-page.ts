import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { StartAction } from '@telo/api';
import { Button, InlineMessage, ScreenHeader, TheClass, TheClassBike } from '@telo/components';
import { THE_CLASS_ID } from '../classes/the-class';
import { FullscreenButton } from '../fullscreen/fullscreen-button';
import { TheClassStore } from './the-class-store';

/**
 * The Class at `/` (docs/mocks/pages/the-class/; L2-084, L2-019, L2-173): the home screen and the one class. Its
 * header has the wordmark, the bike's status as a link to Connect Bike, and Full screen, and no navigation. What the
 * bike will do is part of the view (L2-084 AC2). The start
 * button opens the ride with a connected bike and Connect Bike without one. A class that breaks a rule is not
 * offered: the page says it can't be loaded, with Reload (L2-080 AC3).
 */
@Component({
  selector: 'wz-the-class-page',
  imports: [
    Button,
    FullscreenButton,
    InlineMessage,
    RouterLink,
    ScreenHeader,
    TheClass,
    TheClassBike,
  ],
  templateUrl: './the-class-page.html',
  styleUrl: './the-class-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TheClassStore],
})
export default class TheClassPage {
  protected readonly store = inject(TheClassStore);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;

  /**
   * The start button (L2-084 AC6, AC7): the class ride, which starts at 0:00 at once and is ridden as the rider chose
   * (L2-173 AC5), or Connect Bike when no bike is connected.
   */
  protected start(opens: StartAction['opens']): void {
    void this.router.navigate(opens === 'ride' ? ['/classes', THE_CLASS_ID, 'ride'] : ['/connect']);
  }

  /** Reload: the app is read again, from the device or the network, and the class with it (L2-080 AC3). */
  protected reload(): void {
    this.window?.location.reload();
  }
}
