import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

/** Header, body and footer of every dialog (block `dialog`); the CDK supplies the rest. */
@Component({
  selector: 'wz-dialog-shell',
  imports: [Icon],
  templateUrl: './dialog-shell.html',
  styleUrl: './dialog-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShell {
  private readonly ref = inject(DialogRef);
  /** Prefix of the title and description ids the CDK container points at. */
  readonly dialogId = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input.required<IconName>();
  readonly tone = input<'info' | 'danger'>('info');
  readonly size = input<'sm' | 'md'>('md');
  readonly busy = input(false);

  protected close(): void {
    if (!this.busy()) this.ref.close();
  }
}
