import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { EditSetData } from '../../core/dialog-launcher';
import { formatClock } from '../../core/plan-form';
import {
  type SetDraft,
  type SetField,
  type SetFields,
  setFieldsOf,
  stepSetField,
  toSetDraft,
  validateSet,
} from '../../core/intervals-form';
import { DialogShell } from '../dialog-shell/dialog-shell';
import { LevelSlider } from '../level-slider/level-slider';
import { NumStepper } from '../num-stepper/num-stepper';

/** Edit set <i> or Add set: the set's times, levels and cadence aims (L2-029 AC13, AC15). */
@Component({
  selector: 'wz-edit-set-dialog',
  imports: [DialogShell, LevelSlider, NumStepper],
  templateUrl: './edit-set-dialog.html',
  styleUrl: './edit-set-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSetDialog {
  protected readonly ref = inject<DialogRef<SetDraft>>(DialogRef);
  protected readonly data = inject<EditSetData>(DIALOG_DATA);
  protected readonly fields = signal<SetFields>(setFieldsOf(this.data.set));
  protected readonly errors = computed(() => validateSet(this.fields()));
  protected readonly saved = computed(() => toSetDraft(this.fields()));
  protected readonly description = `${this.data.set.rounds === 1 ? '1 effort' : `${this.data.set.rounds} efforts`} of ${formatClock(this.data.set.work_seconds)}, each followed by a recover. Recover can go down to None.`;

  protected edit(change: Partial<SetFields>): void {
    this.fields.update((f) => ({ ...f, ...change }));
  }

  protected step(field: SetField, dir: 1 | -1): void {
    this.fields.update((f) => stepSetField(f, field, dir));
  }

  protected save(): void {
    const set = this.saved();
    if (set) this.ref.close(set);
  }
}
