import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, type IconName } from '@wattzup/components';

/** An inline alert or a full-width banner (block `alert`, `banner`). */
@Component({
  selector: 'wz-alert',
  imports: [Icon],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly tone = input<'info' | 'success' | 'warning' | 'danger'>('info');
  readonly icon = input.required<IconName>();
  readonly heading = input.required<string>();
  readonly text = input<string | null>(null);
  readonly banner = input(false);
  readonly actionLabel = input<string | null>(null);
  readonly dismissable = input(false);
  readonly action = output();
  readonly dismiss = output();
}
