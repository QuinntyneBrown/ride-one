import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { HistoryImport } from './history-import';

/** What Your history shows, computed by the page (L2-094 AC4). */
export interface DeviceHistoryView {
  /** `14 rides are saved in this browser only. …` */
  readonly text: string;
  /** `Last exported 12 days ago.`, `Never exported.` */
  readonly age: string;
  /** Over 30 days, or never: the age is a warning. */
  readonly stale: boolean;
}

/** Your history, the panel on Progress: where rides are kept, when they were
 * last exported, and Export and Import history (L2-094). */
@Component({
  selector: 'wz-device-history',
  imports: [Icon, HistoryImport],
  templateUrl: './device-history.html',
  styleUrl: './device-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceHistory {
  readonly view = input.required<DeviceHistoryView>();
  readonly exportHistory = output<void>();
  readonly importFile = output<File>();
}
