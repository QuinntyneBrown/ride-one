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
import type { Machine } from '../../core/api-types';
import { LiveStateService } from '../../core/live-state.service';
import { MACHINE_API } from '../../core/machine-api';
import { setupLead } from '../../core/machine-words';
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
import {
  type RidePreview as Preview,
  previewOf,
  treadmillPreviewOf,
} from '../../core/ride-preview';
import {
  type TreadmillField,
  type TreadmillPlanDraft,
  applyTreadmillPreset,
  editTreadmillDraft,
  stepTreadmillDraft,
  toTreadmillPlan,
  validateTreadmillDraft,
} from '../../core/treadmill-plan-form';
import { isActive } from '../../core/workout-status';
import { WORKOUT_API } from '../../core/workout-api';
import { Alert } from '../alert/alert';
import { FormSummary } from '../form-summary/form-summary';
import { Icon } from '../icon/icon';
import { LevelSlider } from '../level-slider/level-slider';
import { MachineChoice } from '../machine-choice/machine-choice';
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

/** The input id of each treadmill draft field (L2-072 AC7). */
export const TREADMILL_FIELD_IDS: Record<TreadmillField, string> = {
  rounds: 'rounds',
  work: 'work',
  rest: 'rest',
  workSpeed: 'work-speed',
  restSpeed: 'rest-speed',
  workIncline: 'work-incline',
  restIncline: 'rest-incline',
  speed: 'speed',
  incline: 'incline',
  minutes: 'duration',
};

type StartError = { kind: 'invalid'; messages: string[] } | { kind: 'failed' };

/** Route `/setup`: choose the machine, build a plan and start it (L2-029, L2-052, L2-059, L2-072). */
@Component({
  selector: 'wz-setup-page',
  imports: [
    Alert,
    FormSummary,
    Icon,
    LevelSlider,
    MachineChoice,
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
  private readonly machines = inject(MACHINE_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly router = inject(Router);
  private readonly summary = viewChild(FormSummary);

  /** The machine the state reports; changes only when the value does. */
  private readonly stateMachine = computed<Machine>(() => this.live.state()?.machine ?? 'bike');
  /** The checked machine: the rider's choice while it is sent, then the state's (L2-072 AC2). */
  protected readonly machine = linkedSignal(() => this.stateMachine());
  protected readonly treadmill = computed(() => this.machine() === 'treadmill');

  protected readonly ids = FIELD_IDS;
  protected readonly tids = TREADMILL_FIELD_IDS;
  protected readonly draft = signal<PlanDraft>(this.store.load());
  protected readonly tdraft = signal<TreadmillPlanDraft>(this.store.loadTreadmill());
  protected readonly errors = computed(() => validateDraft(this.draft()));
  protected readonly terrors = computed(() => validateTreadmillDraft(this.tdraft()));
  protected readonly errorFor = computed(() => {
    const map: Partial<Record<DraftField, string>> = {};
    for (const e of this.errors()) map[e.field] = e.message;
    return map;
  });
  protected readonly terrorFor = computed(() => {
    const map: Partial<Record<TreadmillField, string>> = {};
    for (const e of this.terrors()) map[e.field] = e.message;
    return map;
  });
  protected readonly links = computed(() =>
    this.treadmill()
      ? this.terrors().map((e) => ({ fieldId: TREADMILL_FIELD_IDS[e.field], text: e.link }))
      : this.errors().map((e) => ({ fieldId: FIELD_IDS[e.field], text: e.link })),
  );
  private readonly plan = computed(() =>
    this.treadmill() ? toTreadmillPlan(this.tdraft()) : toPlan(this.draft()),
  );
  /** The preview of the last valid plan for this machine, kept while the form is invalid. */
  private readonly preview = computed(() => {
    const plan = this.plan();
    const preview = plan ? (this.treadmill() ? treadmillPreviewOf(plan) : previewOf(plan)) : null;
    return { machine: this.machine(), preview };
  });
  protected readonly shownPreview = linkedSignal<
    { machine: Machine; preview: Preview | null },
    Preview | null
  >({
    source: this.preview,
    computation: (next, previous) =>
      next.preview ??
      (previous && previous.source.machine === next.machine ? previous.value : null),
  });

  protected readonly machineFailed = signal(false);
  protected readonly machineHelp = computed(() =>
    isActive(this.live.state()?.workout) ? 'End the ride in progress to change the machine.' : null,
  );
  protected readonly lead = computed(() => setupLead(this.machine()));

  protected readonly loading = computed(() => !this.live.state() && !this.live.loadFailed());
  protected readonly busy = signal(false);
  protected readonly startError = signal<StartError | null>(null);

  constructor() {
    this.live.ensureStarted();
  }

  protected async chooseMachine(machine: Machine): Promise<void> {
    this.machineFailed.set(false);
    this.machine.set(machine);
    try {
      await this.machines.choose(machine);
    } catch (e) {
      this.machine.set(this.stateMachine());
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      this.machineFailed.set(true);
    }
  }

  protected setMode(mode: 'hiit' | 'flat'): void {
    if (this.treadmill()) this.tdraft.update((d) => editTreadmillDraft(d, { mode }));
    else this.draft.update((d) => editDraft(d, { mode }));
  }

  protected tedit(change: Partial<TreadmillPlanDraft>): void {
    this.tdraft.update((d) => editTreadmillDraft(d, change));
  }

  protected tstep(field: TreadmillField, dir: 1 | -1): void {
    this.tdraft.update((d) => stepTreadmillDraft(d, field, dir));
  }

  protected edit(change: Partial<PlanDraft>): void {
    this.draft.update((d) => editDraft(d, change));
  }

  protected preset(id: PresetId): void {
    if (this.treadmill()) this.tdraft.update((d) => applyTreadmillPreset(d, id));
    else this.draft.update((d) => applyPreset(d, id));
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
    this.machineFailed.set(false);
    if (this.treadmill()) this.store.saveTreadmill(this.tdraft());
    else this.store.save(this.draft());
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
