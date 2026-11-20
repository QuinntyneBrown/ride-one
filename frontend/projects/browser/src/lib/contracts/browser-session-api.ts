// SESSION_API (L2-094): sessions come from IndexedDB through SessionStore, and Progress is
// computed in the page, in the browser's time zone (AC8).
import { inject, Injectable } from '@angular/core';
import type { ProgressReport, SessionApi, SessionDetail, SessionList } from '@wattzup/api';
import { CLOCK } from '../bluetooth/clock';
import { bestsSetBy, previousAttempt, report } from '../engine/progress-calculator';
import { toSummary } from '../engine/session-record';
import { SessionStore } from '../storage/session-store';
import { BROWSER_TIME_ZONE } from '../engine/time-zone';

const ID = /^[a-f0-9]{12}$/;

@Injectable()
export class BrowserSessionApi implements SessionApi {
  private readonly store = inject(SessionStore);
  private readonly clock = inject(CLOCK);

  async list(): Promise<SessionList> {
    await this.store.ready();
    return { sessions: this.store.list().map(toSummary) };
  }

  async get(id: string): Promise<SessionDetail | 'not-found'> {
    await this.store.ready();
    const session = ID.test(id) ? this.store.find(id) : null;
    if (!session) return 'not-found';
    const all = this.store.list();
    const previous = previousAttempt(all, session);
    return {
      ...session,
      previous: previous && toSummary(previous),
      bests: bestsSetBy(all, session),
    };
  }

  async progress(): Promise<ProgressReport> {
    await this.store.ready();
    return report(this.store.list(), this.clock.epochMs(), BROWSER_TIME_ZONE);
  }
}
