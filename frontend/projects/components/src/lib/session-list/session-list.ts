import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** One saved ride in the session list (L2-086 AC6). */
export interface SessionRow {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly early: boolean;
  readonly time: string;
  readonly avgPower: string;
  readonly onTarget: string;
  readonly dips: number;
}

/** Every saved ride, newest first; each row is one link to its summary (L2-086 AC6). */
@Component({
  selector: 'wz-session-list',
  imports: [Icon],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionList {
  readonly rows = input.required<readonly SessionRow[]>();
  readonly total = input.required<number>();
  /** Whether the rows beyond the newest few are shown. */
  readonly expanded = input(false);
  /** Shown when there are more rows than the list shows folded. */
  readonly foldable = input(false);
  readonly toggleAll = output<void>();
  /** A plain click on a session link: the page routes to `/sessions/<id>`. */
  readonly open = output<string>();

  protected onClick(event: MouseEvent, id: string): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.open.emit(id);
  }
}
