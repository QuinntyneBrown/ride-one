import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RideOverlayText } from '../../core/ride-overlay-text';
import { Icon } from '@wattzup/components';

/** The veil over the dashboard when the bike can't be used (L2-058). */
@Component({
  selector: 'wz-ride-overlay',
  imports: [Icon, RouterLink],
  templateUrl: './ride-overlay.html',
  styleUrl: './ride-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideOverlay {
  readonly overlay = input.required<RideOverlayText>();
  readonly reconnecting = input(false);
  readonly reconnect = output();
  /** Connect bike: the parent opens the device chooser in this click (L2-090). */
  readonly connect = output();
  readonly diagnostics = output();
  /** Check again: ask the browser once more whether Bluetooth is on (L2-089 AC2). */
  readonly checkAgain = output();

  /** Copy link reads Link copied for 1.6 s (browser-unsupported mock). */
  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  protected async copy(link: string | null): Promise<void> {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      return; // No clipboard here: the address stays on screen to copy by hand.
    }
    this.copied.set(true);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), 1600);
  }

  /** The summary opens as just finished: `Done` and `Ride saved` (L2-085 AC2). */
  protected readonly justFinished = { justFinished: true };
  private readonly seeYourRide = viewChild<ElementRef<HTMLAnchorElement>>('seeYourRide');

  constructor() {
    // Ride complete takes focus to See your ride (L2-084 AC3).
    effect(() => this.seeYourRide()?.nativeElement.focus());
  }
}
