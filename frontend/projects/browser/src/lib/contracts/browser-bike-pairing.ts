// BIKE_PAIRING in the browser edition (L2-090): Connect bike opens the browser's device chooser.
import { inject, Injectable } from '@angular/core';
import type { BikePairing } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';

@Injectable()
export class BrowserBikePairing implements BikePairing {
  private readonly link = inject(BikeLink);

  readonly required = this.link.pairingRequired;

  pair(): Promise<void> {
    return this.link.pair();
  }
}
