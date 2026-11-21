import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppHeader, AppHeaderBrand, AppHeaderLink } from '@telo/components';

/**
 * The layout route of the four home screens and Page not found: the app header over the scrolling page. The router
 * marks the current item (`ariaCurrentWhenActive`), so an address that matches no screen marks none.
 */
@Component({
  selector: 'wz-main-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppHeader, AppHeaderBrand, AppHeaderLink],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainShell {
  protected readonly items = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Race', path: '/race', exact: false },
    { label: 'Classes', path: '/classes', exact: false },
    { label: 'Profile', path: '/profile', exact: false },
  ] as const;
}
