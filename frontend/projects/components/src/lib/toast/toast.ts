import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ToastMessage } from './toast-queue';
import { Icon, type IconName } from '../icon/icon';

const ICONS: Record<ToastMessage['tone'], IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'alert-circle',
};

/** One toast: tone icon, title, text, optional action and Dismiss (L2-053). */
@Component({
  selector: 'wz-toast',
  imports: [Icon],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  readonly toast = input.required<ToastMessage>();
  readonly dismiss = output();
  readonly hold = output<boolean>();
  protected readonly icon = computed(() => ICONS[this.toast().tone]);
}
