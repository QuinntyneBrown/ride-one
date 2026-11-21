import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackLink, SetupHeader, SetupMap } from '@telo/components';
import { RaceSetupStore } from './race-setup-store';

/**
 * Race Setup at `/race/:mapId` (L2-047): the map between Map Select and the race, with "← Maps" back to Map Select.
 */
@Component({
  selector: 'wz-race-setup-page',
  imports: [RouterLink, BackLink, SetupHeader, SetupMap],
  templateUrl: './race-setup-page.html',
  styleUrl: './race-setup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RaceSetupStore],
})
export default class RaceSetupPage {
  protected readonly store = inject(RaceSetupStore);
}
