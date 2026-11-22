import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Door, MapTile, MoreLink, NextRideCard } from '@telo/components';
import { provideMaps } from '../maps/provide-maps';
import { HomeStore } from './home-store';

/**
 * Home (`/`, L2-033, L2-034): the greeting, the Next ride card and the Race door. The catalogue client and Home's store are provided here, so
 * they load with the page and go when the rider leaves; a route of its own would add its loader to the initial bundle.
 */
@Component({
  selector: 'wz-home-page',
  imports: [RouterLink, Button, Door, MapTile, MoreLink, NextRideCard],
  providers: [provideMaps(), HomeStore],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  protected readonly home = inject(HomeStore);
}
