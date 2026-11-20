// The live state (L2-093): the BikeStateStore as this page sees it.
import { computed, inject, Injectable, signal } from '@angular/core';
import type { LiveStateSource } from '@wattzup/api';
import { BikeStateStore } from '../engine/bike-state-store';

@Injectable()
export class BrowserStateSource implements LiveStateSource {
  private readonly store = inject(BikeStateStore);
  private readonly started = signal(false);

  readonly state = computed(() => (this.started() ? this.store.state() : null));
  readonly lastStateAt = computed(() => (this.started() ? new Date() : null));

  ensureStarted(): void {
    this.started.set(true);
  }
}
