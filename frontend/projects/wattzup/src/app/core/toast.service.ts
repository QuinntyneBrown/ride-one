// Holds the toasts the root ToastRegion renders; the rules live in toast-queue.ts (L2-053).
import { Injectable, computed, signal } from '@angular/core';
import {
  type ToastMessage,
  type ToastInput,
  emptyQueue,
  expire,
  nextExpiry,
  pause,
  push,
  remove,
  resume,
} from '@wattzup/components';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly queue = signal(emptyQueue());
  readonly visible = computed<readonly ToastMessage[]>(() => this.queue().visible);
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Shows a toast and returns its id; a queued toast gets its id when it shows. */
  show(toast: ToastInput): number {
    const id = this.queue().nextId;
    this.apply((q, now) => push(q, toast, now));
    return id;
  }

  dismiss(id: number): void {
    this.apply((q, now) => remove(q, id, now));
  }

  pause(id: number): void {
    this.apply((q, now) => pause(q, id, now));
  }

  resume(id: number): void {
    this.apply((q, now) => resume(q, id, now));
  }

  private apply(
    change: (q: ReturnType<typeof emptyQueue>, now: number) => ReturnType<typeof emptyQueue>,
  ): void {
    const now = Date.now();
    this.queue.update((q) => expire(change(q, now), now));
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const at = nextExpiry(this.queue());
    if (at === null) return;
    this.timer = setTimeout(() => this.apply((q) => q), Math.max(0, at - Date.now()));
  }
}
