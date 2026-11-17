import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

/** What one toast says, and its optional action. */
export interface ToastMessage {
  tone: ToastTone;
  title: string;
  text: string;
  action?: { label: string; run: () => void };
}

const ICONS: Record<ToastTone, IconName> = {
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
