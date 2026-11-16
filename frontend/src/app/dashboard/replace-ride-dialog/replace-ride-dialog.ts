import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { ReplaceRideData } from '../../core/dialog-launcher';
import { isTreadmillPlan } from '../../core/plan-expansion';
import { WORKOUT_API } from '../../core/workout-api';
import { Alert } from '../alert/alert';
import { DialogShell } from '../dialog-shell/dialog-shell';

/** Replace the ride in progress? (L2-052, L2-071 criterion 12) */
@Component({
  selector: 'wz-replace-ride-dialog',
  imports: [Alert, DialogShell],
  templateUrl: './replace-ride-dialog.html',
  styleUrl: './replace-ride-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceRideDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ReplaceRideData>(DIALOG_DATA);
  private readonly workouts = inject(WORKOUT_API);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly description =
    `You're ${this.data.elapsed} into ${this.data.currentSummary}. Starting ${this.data.newSummary} ends it and begins the new ride at 0:00.` +
    (isTreadmillPlan(this.data.plan)
      ? ' Wattzup stops the belt first, then counts down 3 seconds before starting it again.'
      : '');

  protected async replace(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    try {
      await this.workouts.start(this.data.plan);
      this.ref.close(true);
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
      this.ref.disableClose = false;
    }
  }
}
