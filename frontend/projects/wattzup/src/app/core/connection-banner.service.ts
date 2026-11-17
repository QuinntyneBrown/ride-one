// Holds banner history and dismissals; the rules live in connection-banners.ts (L2-054).
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { BikeState } from '@wattzup/api';
import { type BannerId, banners, isReconnect } from './connection-banners';
import { LiveStateService } from './live-state.service';
import { clockTime } from './local-time';
import { SafeStorage } from '@wattzup/api';

const DISMISSED_KEY = 'wattzup.banners.dismissed';
export const RECONNECTED_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ConnectionBannerService {
  private readonly live = inject(LiveStateService);
  private readonly storage = new SafeStorage(() => sessionStorage);
  private readonly dismissed = signal<ReadonlySet<BannerId>>(this.loadDismissed());
  private readonly reconnected = signal<{
    label: string;
    elapsed: number;
    level: number | null;
  } | null>(null);
  private previous: BikeState | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly banners = computed(() => {
    const at = this.live.lastStateAt();
    return banners({
      state: this.live.state(),
      connection: this.live.connection(),
      lastStateTime: at ? clockTime(at) : null,
      reconnected: this.reconnected(),
      dismissed: this.dismissed(),
    });
  });

  constructor() {
    effect(() => {
      const next = this.live.state();
      if (!next) return;
      untracked(() => this.observe(next));
    });
  }

  dismiss(id: BannerId): void {
    if (id === 'reconnected') {
      this.reconnected.set(null);
      return;
    }
    const next = new Set(this.dismissed());
    next.add(id);
    this.dismissed.set(next);
    this.storage.set(DISMISSED_KEY, JSON.stringify([...next]));
  }

  private observe(next: BikeState): void {
    if (isReconnect(this.previous, next) && next.workout) {
      this.reconnected.set({
        label: next.device_label ?? 'Your bike',
        elapsed: next.workout.elapsed_seconds,
        level: next.resistance ?? next.target_resistance,
      });
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.reconnected.set(null), RECONNECTED_MS);
    }
    this.previous = next;
  }

  private loadDismissed(): ReadonlySet<BannerId> {
    try {
      const raw = JSON.parse(this.storage.get(DISMISSED_KEY) ?? '[]') as unknown;
      return new Set(Array.isArray(raw) ? (raw as BannerId[]) : []);
    } catch {
      return new Set();
    }
  }
}
