// Opens the dialogs through the CDK, which owns the backdrop, focus trap, Escape and focus
// return (L2-023, L2-051, L2-052). Dialog components load on first use.
import { Dialog } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import type { WorkoutPlan } from './api-types';

@Injectable({ providedIn: 'root' })
export class DialogLauncher {
  private readonly dialog = inject(Dialog);

  async openDiagnostics(): Promise<void> {
    const { DiagnosticsDialog } =
      await import('../dashboard/diagnostics-dialog/diagnostics-dialog');
    this.open(DiagnosticsDialog, 'diagnostics', 'first-tabbable');
  }

  async openEndRide(): Promise<void> {
    const { EndRideDialog } = await import('../dashboard/end-ride-dialog/end-ride-dialog');
    this.open(EndRideDialog, 'end-ride', '[data-autofocus]');
  }

  async openReplaceRide(plan: WorkoutPlan): Promise<boolean> {
    void plan;
    return false;
  }

  private open<T>(
    component: ComponentType<T>,
    id: string,
    autoFocus: string,
    data?: unknown,
  ): void {
    if (this.dialog.getDialogById(id)) return;
    this.dialog.open(component, {
      panelClass: 'wz-dialog-pane',
      backdropClass: 'wz-backdrop',
      restoreFocus: true,
      id,
      data,
      autoFocus,
      ariaLabelledBy: `${id}-title`,
      ariaDescribedBy: `${id}-desc`,
    });
  }
}
