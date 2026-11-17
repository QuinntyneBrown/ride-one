import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { EditStretchData } from '../../core/dialog-launcher';
import {
  STRETCH_NAMES,
  type StretchDraft,
  type StretchField,
  type StretchFields,
  stepStretchField,
  stretchFieldsOf,
  toStretch,
  validateStretch,
} from '../../core/intervals-form';
import { DialogShell } from '../dialog-shell/dialog-shell';
import { LevelSlider } from '../level-slider/level-slider';
import { NumStepper } from '../num-stepper/num-stepper';

const DESCRIPTIONS = {
  warmup: 'An easy start before the first effort. 1:00 to 30:00.',
  cooldown: 'An easy finish after the last effort. 1:00 to 30:00.',
};

/** Warm-up or Cool-down: its length, resistance and cadence aim (L2-029 AC14, AC15). */
@Component({
  selector: 'wz-edit-stretch-dialog',
  imports: [DialogShell, LevelSlider, NumStepper],
  templateUrl: './edit-stretch-dialog.html',
  styleUrl: './edit-stretch-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStretchDialog {
  protected readonly ref = inject<DialogRef<StretchDraft>>(DialogRef);
  protected readonly data = inject<EditStretchData>(DIALOG_DATA);
  protected readonly heading = STRETCH_NAMES[this.data.kind];
  protected readonly description = DESCRIPTIONS[this.data.kind];
  protected readonly fields = signal<StretchFields>(stretchFieldsOf(this.data.stretch));
  protected readonly errors = computed(() => validateStretch(this.data.kind, this.fields()));
  protected readonly saved = computed(() =>
    toStretch(this.fields(), this.data.stretch.on, this.data.kind),
  );

  protected edit(change: Partial<StretchFields>): void {
    this.fields.update((f) => ({ ...f, ...change }));
  }

  protected step(field: StretchField, dir: 1 | -1): void {
    this.fields.update((f) => stepStretchField(f, field, dir));
  }

  protected save(): void {
    const stretch = this.saved();
    if (stretch) this.ref.close(stretch);
  }
}
