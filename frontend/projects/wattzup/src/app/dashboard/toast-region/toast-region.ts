import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Toast } from '../toast/toast';

/** The single toast region, mounted in the root so toasts survive navigation (L2-053). */
@Component({
  selector: 'wz-toast-region',
  imports: [Toast],
  templateUrl: './toast-region.html',
  styleUrl: './toast-region.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegion {
  protected readonly toasts = inject(ToastService);

  protected hold(id: number, held: boolean): void {
    if (held) this.toasts.pause(id);
    else this.toasts.resume(id);
  }
}
