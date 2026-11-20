import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  SESSION_API,
  SESSION_ARCHIVE,
  type ProgressReport,
  type SessionSummary,
} from '@wattzup/api';
import {
  AchievementList,
  DeviceHistory,
  HistoryImport,
  Icon,
  SessionList,
  StreakCalendar,
  TrendChart,
} from '@wattzup/components';
import { nextTab } from '../../core/class-library-view';
import {
  achievementView,
  comparable,
  LIST_LENGTH,
  type Measure,
  MEASURES,
  rideLabel,
  sessionRow,
  streakView,
  trendView,
} from '../../core/progress-view';
import {
  deviceHistoryView,
  exportFileName,
  IMPORT_FAILED,
  importToast,
} from '../../core/history-view';
import { saveFile } from '../../core/save-file';
import { ToastService } from '../../core/toast.service';

type Phase = 'loading' | 'ready' | 'error';

/** Arrow keys of a radio group: up and down move as left and right do. */
const RADIO_KEYS: Record<string, string> = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' };

/** Route `/progress`: the trend, every saved session, the streak and the achievements (L2-086). */
@Component({
  selector: 'wz-progress-page',
  imports: [
    AchievementList,
    DeviceHistory,
    HistoryImport,
    Icon,
    RouterLink,
    SessionList,
    StreakCalendar,
    TrendChart,
  ],
  templateUrl: './progress-page.html',
  styleUrl: './progress-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
  private readonly sessions = inject(SESSION_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  /** The history file (L2-094). */
  private readonly archive = inject(SESSION_ARCHIVE);
  private readonly lastExportedAt = signal(this.archive.lastExportedAt());
  private readonly classButtons = viewChildren<ElementRef<HTMLButtonElement>>('classButton');
  private readonly measureButtons = viewChildren<ElementRef<HTMLButtonElement>>('measureButton');

  protected readonly measures = MEASURES;
  protected readonly phase = signal<Phase>('loading');
  private readonly progress = signal<ProgressReport | null>(null);
  private readonly list = signal<readonly SessionSummary[]>([]);
  /** The class to compare; null selects the most recently ridden (AC2). */
  private readonly chosen = signal<string | null>(null);
  protected readonly measure = signal<Measure>('power');
  protected readonly expanded = signal(false);

  protected readonly empty = computed(() => this.phase() === 'ready' && this.list().length === 0);
  protected readonly ride = computed(() => {
    const p = this.progress();
    return p ? rideLabel(p.streak) : null;
  });
  protected readonly classes = computed(() => comparable(this.progress()?.classes ?? []));
  protected readonly selected = computed(() => {
    const classes = this.classes();
    return classes.find((c) => c.class_id === this.chosen()) ?? classes[0] ?? null;
  });
  protected readonly trend = computed(() => {
    const cls = this.selected();
    return cls ? trendView(cls, this.measure()) : null;
  });
  protected readonly rows = computed(() => {
    const all = this.list();
    return (this.expanded() ? all : all.slice(0, LIST_LENGTH)).map((s) => sessionRow(s));
  });
  protected readonly total = computed(() => this.list().length);
  protected readonly foldable = computed(() => this.list().length > LIST_LENGTH);
  protected readonly streak = computed(() => {
    const p = this.progress();
    return p ? streakView(p) : null;
  });
  protected readonly achievements = computed(() =>
    (this.progress()?.achievements ?? []).map(achievementView),
  );

  /** Your history (L2-094 AC4). */
  protected readonly history = computed(() =>
    deviceHistoryView(this.total(), this.lastExportedAt(), Date.now()),
  );

  constructor() {
    void this.load();
  }

  /** Saves the history as wattzup-sessions-<date>.json (L2-094 AC5). */
  protected async exportHistory(): Promise<void> {
    saveFile(await this.archive.exportAll(), exportFileName(Date.now()));
    this.lastExportedAt.set(this.archive.lastExportedAt());
  }

  /** Adds a history file's new rides and says what happened (L2-094 AC5, AC6). */
  protected async importHistory(file: File): Promise<void> {
    try {
      const result = await this.archive.importFile(file);
      this.toasts.show(importToast(result, file.name));
      if (result !== 'not-a-history' && result.added > 0) await this.load();
    } catch {
      this.toasts.show(IMPORT_FAILED);
    }
  }

  /** Both requests together; Try again repeats both (AC10). */
  protected async load(): Promise<void> {
    this.phase.set('loading');
    try {
      const [progress, list] = await Promise.all([this.sessions.progress(), this.sessions.list()]);
      this.progress.set(progress);
      this.list.set(list.sessions);
      this.phase.set('ready');
    } catch {
      this.phase.set('error');
    }
  }

  protected chooseClass(id: string): void {
    this.chosen.set(id);
  }

  protected onClassKey(event: KeyboardEvent): void {
    const ids = this.classes().map((c) => c.class_id);
    const next = nextTab(ids, this.selected()?.class_id ?? '', RADIO_KEYS[event.key] ?? event.key);
    if (next === null) return;
    event.preventDefault();
    this.chosen.set(ids[next]!);
    this.classButtons()[next]?.nativeElement.focus();
  }

  protected onMeasureKey(event: KeyboardEvent): void {
    const ids = this.measures.map((m) => m.id);
    const next = nextTab(ids, this.measure(), event.key);
    if (next === null) return;
    event.preventDefault();
    this.measure.set(ids[next]!);
    this.measureButtons()[next]?.nativeElement.focus();
  }

  protected toggleList(): void {
    this.expanded.update((e) => !e);
  }

  protected openSession(id: string): void {
    void this.router.navigate(['/sessions', id]);
  }
}
