import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, FULLSCREEN, REMEMBERED_BIKE } from '@telo/api';
import {
  AppHeader,
  AppHeaderBike,
  AppHeaderBrand,
  AppHeaderLink,
  FullscreenToggle,
} from '@telo/components';
import { bikeStatus } from '@telo/domain';

/**
 * The layout route of the four home screens, Settings and Page not found: the app header over the scrolling page. The
 * item the address falls under is current, and Profile is current on Settings too (L2-158 AC1); an address that
 * matches no item marks none. It shows the bike's status and full screen; Telo Ride 1 has no streak, level or XP
 * (ADR 0039).
 */
@Component({
  selector: 'wz-main-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    AppHeader,
    AppHeaderBike,
    AppHeaderBrand,
    AppHeaderLink,
    FullscreenToggle,
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
  /** Full screen, offered only where the browser can show it (L2-144). */
  protected readonly fullscreen = inject(FULLSCREEN);

  /** Enters full screen, or leaves it while in it (L2-144 AC1). */
  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }

  /** The header's bike status (L2-019 AC1, AC2). */
  protected readonly bike = computed(() =>
    bikeStatus(
      this.connection.ble(),
      this.support.state(),
      (this.connection.bike() ?? this.remembered)?.name ?? null,
    ),
  );

  protected readonly items = [
    { label: 'Home', path: '/', also: [] },
    { label: 'Classes', path: '/classes', also: [] },
    { label: 'Profile', path: '/profile', also: ['/settings'] },
  ] as const;

  private readonly router = inject(Router);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => pathOf(this.router.url)),
    ),
    { initialValue: pathOf(this.router.url) },
  );

  /** The item the address falls under: Home on `/` only, any other on its path and below. */
  protected readonly current = computed(() => {
    const path = this.path();
    return (
      this.items.find((item) =>
        item.path === '/'
          ? path === '/'
          : [item.path, ...item.also].some((p) => path === p || path.startsWith(`${p}/`)),
      )?.path ?? null
    );
  });
}

/** The address without its query or fragment. */
function pathOf(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}
