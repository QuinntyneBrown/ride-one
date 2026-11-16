import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAN_DRAFT_KEY, PlanDraftStore, readDraft } from './plan-draft.store';
import { DEFAULT_DRAFT, applyPreset } from './plan-form';

describe('readDraft', () => {
  it('returns the default for a missing key or unreadable data', () => {
    expect(readDraft(null)).toBe(DEFAULT_DRAFT);
    expect(readDraft('{not json')).toBe(DEFAULT_DRAFT);
  });

  it('returns the default for data of the wrong shape', () => {
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, workLevel: 40 }))).toBe(DEFAULT_DRAFT);
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, mode: 'sprint' }))).toBe(DEFAULT_DRAFT);
    expect(readDraft(JSON.stringify({ ...DEFAULT_DRAFT, rounds: 8 }))).toBe(DEFAULT_DRAFT);
  });

  it('restores a stored draft', () => {
    const draft = applyPreset(DEFAULT_DRAFT, 'tabata');
    expect(readDraft(JSON.stringify(draft))).toEqual(draft);
  });
});

describe('PlanDraftStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves and loads through localStorage', () => {
    const store = TestBed.inject(PlanDraftStore);
    const draft = applyPreset(DEFAULT_DRAFT, 'long-climbs');
    store.save(draft);
    expect(localStorage.getItem(PLAN_DRAFT_KEY)).toContain('long-climbs');
    expect(store.load()).toEqual(draft);
  });

  it('falls back to the default when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(TestBed.inject(PlanDraftStore).load()).toEqual(DEFAULT_DRAFT);
  });
});
