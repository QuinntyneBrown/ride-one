import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, PROGRESS_STORE, REMEMBERED_BIKE } from '@telo/api';
import {
  AppHeader,
  AppHeaderBike,
  AppHeaderBrand,
  AppHeaderLevel,
  AppHeaderLink,
} from '@telo/components';
import { bikeStatus } from '@telo/domain';
import { toLevelView } from '../progress/level-view';

/**
 * The layout route of the four home screens and Page not found: the app header over the scrolling page. The router
 * marks the current item (`ariaCurrentWhenActive`), so an address that matches no screen marks none. Entering it reads
 * the rider's progress again, so the level link shows what the last ride earned (L2-032 AC2).
 */
@Component({
  selector: 'wz-main-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AppHeader,
    AppHeaderBike,
    AppHeaderBrand,
    AppHeaderLevel,
    AppHeaderLink,
  ],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainShell {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  /** The bike this browser remembers names the status before the connection has one (L2-015). */
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly progress = inject(PROGRESS_STORE);

  constructor() {
    this.progress.refresh();
  }

  /** The level link, absent until the progress arrives or while it cannot be read. */
  protected readonly level = computed(() => {
    const progress = this.progress.progress();
    return progress === null ? null : toLevelView(progress);
  });

  /** The header's bike status (L2-019 AC1, AC2). */
  protected readonly bike = computed(() =>
    bikeStatus(
      this.connection.ble(),
      this.support.state(),
      (this.connection.bike() ?? this.remembered)?.name ?? null,
    ),
  );

  protected readonly items = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Race', path: '/race', exact: false },
    { label: 'Classes', path: '/classes', exact: false },
    { label: 'Profile', path: '/profile', exact: false },
  ] as const;
}
