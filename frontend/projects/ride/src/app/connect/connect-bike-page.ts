import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BLUETOOTH_SUPPORT } from '@telo/api';
import { Button, ConnectDevice, type ConnectDeviceState, ConnectWorks } from '@telo/components';
import { SUPPORTED_BIKES } from '@telo/domain';
import { ConnectBikeStore } from './connect-bike-store';

/** The bike the card offers before the search: the model Telo Ride fully controls. */
const OFFERED = 'Echelon EX-5s';

/** Connect Bike at `/connect` (docs/mocks/pages/connect-bike/): pick the bike and pair it, with no app navigation. */
@Component({
  selector: 'wz-connect-bike-page',
  imports: [Button, ConnectDevice, ConnectWorks],
  templateUrl: './connect-bike-page.html',
  styleUrl: './connect-bike-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConnectBikeStore],
})
export default class ConnectBikePage {
  protected readonly store = inject(ConnectBikeStore);
  protected readonly support = inject(BLUETOOTH_SUPPORT);
  protected readonly bikes = SUPPORTED_BIKES;

  protected readonly device = computed(() => {
    const view = this.store.view();
    const bike = 'bike' in view ? view.bike : null;
    const state: ConnectDeviceState =
      view.kind === 'searching' ? 'searching' : view.kind === 'paired' ? 'paired' : 'idle';
    return { name: bike?.name ?? OFFERED, identifier: bike?.id ?? null, state };
  });

  protected readonly action = computed(() => {
    switch (this.store.view().kind) {
      case 'default':
        return { label: `Pair ${OFFERED}`, busy: false, disabled: false };
      case 'searching':
        return { label: 'Searching…', busy: true, disabled: true };
      case 'pairing':
        return { label: 'Pairing…', busy: true, disabled: true };
      case 'paired':
        return { label: 'Paired', busy: false, disabled: true };
    }
  });
}
