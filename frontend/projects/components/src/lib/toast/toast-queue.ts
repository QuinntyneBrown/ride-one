// The toast rules as a pure reducer; time is an argument so tests need no timers (L2-053).
export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  tone: ToastTone;
  title: string;
  text: string;
  action?: { label: string; run: () => void };
}

export interface ToastMessage extends ToastInput {
  id: number;
  /** Absolute expiry time, or null when paused or never expiring. */
  expiresAt: number | null;
  /** Time left while paused. */
  remaining: number | null;
}

export interface ToastQueue {
  visible: ToastMessage[];
  waiting: ToastInput[];
  nextId: number;
}

export const TOAST_LIFETIME_MS = 5000;
const MAX_VISIBLE = 3;

export function emptyQueue(): ToastQueue {
  return { visible: [], waiting: [], nextId: 1 };
}

const expires = (tone: ToastTone): boolean => tone === 'info' || tone === 'success';

function show(q: ToastQueue, input: ToastInput, now: number): ToastQueue {
  const toast: ToastMessage = {
    ...input,
    id: q.nextId,
    expiresAt: expires(input.tone) ? now + TOAST_LIFETIME_MS : null,
    remaining: null,
  };
  return { ...q, visible: [...q.visible, toast], nextId: q.nextId + 1 };
}

export function push(q: ToastQueue, input: ToastInput, now: number): ToastQueue {
  if (q.visible.length < MAX_VISIBLE) return show(q, input, now);
  const victim =
    q.visible.find((t) => t.tone === 'info') ?? q.visible.find((t) => t.tone === 'success');
  if (!victim) return { ...q, waiting: [...q.waiting, input] };
  return show({ ...q, visible: q.visible.filter((t) => t !== victim) }, input, now);
}

function fill(q: ToastQueue, now: number): ToastQueue {
  let next = q;
  while (next.visible.length < MAX_VISIBLE && next.waiting.length > 0) {
    const [first, ...rest] = next.waiting;
    next = show({ ...next, waiting: rest }, first, now);
  }
  return next;
}

export function remove(q: ToastQueue, id: number, now: number): ToastQueue {
  return fill({ ...q, visible: q.visible.filter((t) => t.id !== id) }, now);
}

export function expire(q: ToastQueue, now: number): ToastQueue {
  const kept = q.visible.filter((t) => t.expiresAt === null || t.expiresAt > now);
  return kept.length === q.visible.length ? q : fill({ ...q, visible: kept }, now);
}

export function pause(q: ToastQueue, id: number, now: number): ToastQueue {
  return {
    ...q,
    visible: q.visible.map((t) =>
      t.id === id && t.expiresAt !== null
        ? { ...t, remaining: Math.max(0, t.expiresAt - now), expiresAt: null }
        : t,
    ),
  };
}

export function resume(q: ToastQueue, id: number, now: number): ToastQueue {
  return {
    ...q,
    visible: q.visible.map((t) =>
      t.id === id && t.remaining !== null
        ? { ...t, expiresAt: now + t.remaining, remaining: null }
        : t,
    ),
  };
}

/** The earliest pending expiry, for the service's single timer. */
export function nextExpiry(q: ToastQueue): number | null {
  const times = q.visible.map((t) => t.expiresAt).filter((t): t is number => t !== null);
  return times.length ? Math.min(...times) : null;
}
