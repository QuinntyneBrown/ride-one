import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

/** The Import history button of Your history: opens the file picker for a JSON history file
 * (L2-094 AC5). A part of DeviceHistory, also offered on an empty Progress page. */
@Component({
  selector: 'wz-history-import',
  imports: [Icon],
  templateUrl: './history-import.html',
  styleUrl: './history-import.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryImport {
  /** The id of the hint that describes the button. */
  readonly describedBy = input<string | null>(null);
  readonly pick = output<File>();
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('file');

  protected open(): void {
    this.input().nativeElement.click();
  }

  protected chosen(): void {
    const field = this.input().nativeElement;
    const file = field.files?.[0];
    // Cleared so the same file can be picked again.
    field.value = '';
    if (file) this.pick.emit(file);
  }
}
