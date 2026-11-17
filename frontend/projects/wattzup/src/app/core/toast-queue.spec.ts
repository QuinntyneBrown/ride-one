import { type ToastQueue, emptyQueue, expire, pause, push, remove, resume } from './toast-queue';

const t = (tone: 'info' | 'success' | 'warning' | 'danger', title: string) => ({
  tone,
  title,
  text: '',
});

describe('toastQueue (L2-053)', () => {
  it('expires info and success toasts 5 s after they show', () => {
    let q: ToastQueue = push(emptyQueue(), t('info', 'a'), 0);
    q = push(q, t('success', 'b'), 1000);
    expect(expire(q, 4999).visible.map((x) => x.title)).toEqual(['a', 'b']);
    expect(expire(q, 5000).visible.map((x) => x.title)).toEqual(['b']);
    expect(expire(q, 6000).visible).toEqual([]);
  });
  it('never expires warning and danger toasts', () => {
    let q = push(emptyQueue(), t('warning', 'w'), 0);
    q = push(q, t('danger', 'd'), 0);
    expect(expire(q, 1e9).visible.length).toBe(2);
  });
  it('pauses and resumes with the time left', () => {
    let q = push(emptyQueue(), t('info', 'a'), 0);
    const id = q.visible[0].id;
    q = pause(q, id, 2000);
    expect(expire(q, 10000).visible.length).toBe(1);
    q = resume(q, id, 10000);
    expect(expire(q, 12999).visible.length).toBe(1);
    expect(expire(q, 13000).visible.length).toBe(0);
  });
  it('shows at most 3, evicting the oldest info toast first', () => {
    let q = push(emptyQueue(), t('success', 's'), 0);
    q = push(q, t('info', 'i1'), 1);
    q = push(q, t('danger', 'd'), 2);
    q = push(q, t('info', 'i2'), 3);
    expect(q.visible.map((x) => x.title)).toEqual(['s', 'd', 'i2']);
    q = push(q, t('warning', 'w'), 4);
    expect(q.visible.map((x) => x.title)).toEqual(['s', 'd', 'w']);
    q = push(q, t('danger', 'd2'), 5);
    expect(q.visible.map((x) => x.title)).toEqual(['d', 'w', 'd2']);
  });
  it('holds a new toast while 3 that never expire show', () => {
    let q = push(emptyQueue(), t('danger', 'a'), 0);
    q = push(q, t('danger', 'b'), 0);
    q = push(q, t('warning', 'c'), 0);
    q = push(q, t('info', 'd'), 0);
    expect(q.visible.map((x) => x.title)).toEqual(['a', 'b', 'c']);
    q = remove(q, q.visible[0].id, 100);
    expect(q.visible.map((x) => x.title)).toEqual(['b', 'c', 'd']);
    expect(expire(q, 5099).visible.length).toBe(3);
    expect(expire(q, 5100).visible.length).toBe(2);
  });
});
