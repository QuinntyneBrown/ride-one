import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, NextRideCard } from '@telo/components';
import { provideMaps } from '../maps/provide-maps';
import { HomeStore } from './home-store';

/**
 * Home (`/`, L2-033): the greeting and the Next ride card. The catalogue client and Home's store are provided here, so
 * they load with the page and go when the rider leaves; a route of its own would add its loader to the initial bundle.
 */
@Component({
  selector: 'wz-home-page',
  imports: [RouterLink, Button, NextRideCard],
  providers: [provideMaps(), HomeStore],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  protected readonly home = inject(HomeStore);
}
