// The browser edition's live state (L2-093): the BikeStateStore as this page sees it. There is no
// stream to lose, so the connection is always open.
import { computed, inject, Injectable, signal } from '@angular/core';
import type { LiveStateSource, StreamConnection } from '@wattzup/api';
import { BikeStateStore } from '../engine/bike-state-store';

@Injectable()
export class BrowserStateSource implements LiveStateSource {
  private readonly store = inject(BikeStateStore);
  private readonly started = signal(false);

  readonly state = computed(() => (this.started() ? this.store.state() : null));
  readonly connection = signal<StreamConnection>('open').asReadonly();
  readonly lastStateAt = computed(() => (this.started() ? new Date() : null));
  readonly loadFailed = signal(false).asReadonly();
  readonly loadStatus = signal<number | null>(null).asReadonly();
  readonly streamEpoch = signal(1).asReadonly();

  ensureStarted(): void {
    this.started.set(true);
  }

  reload(): void {
    this.ensureStarted();
  }

  restart(): void {
    this.ensureStarted();
  }

  retryNow(): void {
    this.ensureStarted();
  }
}
