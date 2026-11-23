import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, ClassTeaser, Door, MoreLink } from '@telo/components';
import { provideClasses } from '../classes/provide-classes';
import { HomeStore } from './home-store';

/**
 * Home (`/`, L2-033 to L2-036): the greeting and the Classes door (Telo Ride 1 has no races). The catalogue client and Home's store are provided here, so
 * they load with the page and go when the rider leaves; a route of its own would add its loader to the initial bundle.
 */
@Component({
  selector: 'wz-home-page',
  imports: [RouterLink, Button, ClassTeaser, Door, MoreLink],
  providers: [provideClasses(), HomeStore],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  protected readonly home = inject(HomeStore);
}
