import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DialogLauncher } from '../../core/dialog-launcher';
import { formatDuration } from '../../core/format-duration';
import { LiveStateService } from '../../core/live-state.service';
import { planSummary } from '../../core/plan-expansion';
import { PlanDraftStore } from '../../core/plan-draft.store';
import {
  type DraftField,
  type PlanDraft,
  type PresetId,
  applyPreset,
  editDraft,
  stepDraft,
  toPlan,
  validateDraft,
} from '../../core/plan-form';
import { previewOf } from '../../core/ride-preview';
import { isActive } from '../../core/workout-status';
import { WORKOUT_API } from '../../core/workout-api';
import { Alert } from '../alert/alert';
import { FormSummary } from '../form-summary/form-summary';
import { Icon } from '../icon/icon';
import { LevelSlider } from '../level-slider/level-slider';
import { ModeCards } from '../mode-cards/mode-cards';
import { NumStepper } from '../num-stepper/num-stepper';
import { Presets } from '../presets/presets';
import { RidePreview } from '../ride-preview/ride-preview';
import { Toggles } from '../toggles/toggles';

/** The input id of each draft field; the form summary links to them. */
export const FIELD_IDS: Record<DraftField, string> = {
  rounds: 'rounds',
  work: 'work',
  rest: 'rest',
  workLevel: 'work-level',
  restLevel: 'rest-level',
  flatLevel: 'flat-level',
  minutes: 'duration',
  cadence: 'cadence',
};

type StartError = { kind: 'invalid'; messages: string[] } | { kind: 'failed' };

/** Route `/setup`: build a plan and start it (L2-029, L2-052, L2-059). */
@Component({
  selector: 'wz-setup-page',
  imports: [
    Alert,
    FormSummary,
    Icon,
    LevelSlider,
    ModeCards,
    NumStepper,
    Presets,
    RidePreview,
    RouterLink,
    Toggles,
  ],
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupPage {
  private readonly live = inject(LiveStateService);
  private readonly store = inject(PlanDraftStore);
  private readonly workouts = inject(WORKOUT_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly router = inject(Router);
  private readonly summary = viewChild(FormSummary);

  protected readonly ids = FIELD_IDS;
  protected readonly draft = signal<PlanDraft>(this.store.load());
  protected readonly errors = computed(() => validateDraft(this.draft()));
  protected readonly errorFor = computed(() => {
    const map: Partial<Record<DraftField, string>> = {};
    for (const e of this.errors()) map[e.field] = e.message;
    return map;
  });
  protected readonly links = computed(() =>
    this.errors().map((e) => ({ fieldId: FIELD_IDS[e.field], text: e.link })),
  );
  private readonly plan = computed(() => toPlan(this.draft()));
  /** The preview of the last valid plan, kept while the form is invalid. */
  private readonly preview = computed(() => {
    const plan = this.plan();
    return plan ? previewOf(plan) : null;
  });
  protected readonly shownPreview = linkedSignal<
    ReturnType<typeof previewOf> | null,
    ReturnType<typeof previewOf> | null
  >({
    source: this.preview,
    computation: (next, previous) => next ?? previous?.value ?? null,
  });

  protected readonly loading = computed(() => !this.live.state() && !this.live.loadFailed());
  protected readonly busy = signal(false);
  protected readonly startError = signal<StartError | null>(null);

  constructor() {
    this.live.ensureStarted();
  }

  protected setMode(mode: 'hiit' | 'flat'): void {
    this.draft.update((d) => editDraft(d, { mode }));
  }

  protected edit(change: Partial<PlanDraft>): void {
    this.draft.update((d) => editDraft(d, change));
  }

  protected preset(id: PresetId): void {
    this.draft.update((d) => applyPreset(d, id));
  }

  protected step(field: DraftField, dir: 1 | -1): void {
    this.draft.update((d) => stepDraft(d, field, dir));
  }

  protected focusSummary(): void {
    this.summary()?.focus();
  }

  protected async start(): Promise<void> {
    const plan = this.plan();
    if (!plan || this.busy()) return;
    this.store.save(this.draft());
    const workout = this.live.state()?.workout ?? null;
    if (isActive(workout) && workout) {
      const started = await this.dialogs.openReplaceRide({
        plan,
        elapsed: formatDuration(workout.elapsed_seconds),
        currentSummary: workout.summary,
        newSummary: planSummary(plan),
      });
      if (started) await this.router.navigateByUrl('/');
      return;
    }
    this.busy.set(true);
    this.startError.set(null);
    try {
      await this.workouts.start(plan);
      await this.router.navigateByUrl('/');
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      const errors = e instanceof HttpErrorResponse && e.status === 400 ? problemErrors(e) : null;
      this.startError.set(errors ? { kind: 'invalid', messages: errors } : { kind: 'failed' });
    } finally {
      this.busy.set(false);
    }
  }
}

/** The messages of a ProblemDetails `errors` map, in order. */
function problemErrors(e: HttpErrorResponse): string[] {
  const body = e.error as { errors?: Record<string, string[]>; detail?: string } | null;
  const messages = Object.values(body?.errors ?? {}).flat();
  return messages.length ? messages : [body?.detail ?? 'The plan was not accepted.'];
}
