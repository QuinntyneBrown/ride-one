import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, REMEMBERED_BIKE } from '@telo/api';
import { AppHeader, AppHeaderBike, AppHeaderBrand, AppHeaderLink } from '@telo/components';
import { bikeStatus } from '@telo/domain';

/**
 * The layout route of the four home screens and Page not found: the app header over the scrolling page. The router
 * marks the current item (`ariaCurrentWhenActive`), so an address that matches no screen marks none.
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
