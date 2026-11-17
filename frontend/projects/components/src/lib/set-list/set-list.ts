import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Icon } from '../icon/icon';

export type StretchKind = 'warmup' | 'cooldown';

/** One Warm-up or Cool-down row: its switch, name and summary line. */
export interface StretchRow {
  kind: StretchKind;
  name: string;
  line: string;
  on: boolean;
}

/** What the set list shows: each set's two lines, the two stretch rows, and whether it is full. */
export interface SetListView {
  sets: readonly { work: string; rest: string }[];
  warmup: StretchRow;
  cooldown: StretchRow;
  full: boolean;
}

/** The warm-up, the sets and the cool-down of an Intervals plan, each with its actions (block
 * `set-list`, L2-029 AC12). It emits the action; the page applies it. */
@Component({
  selector: 'wz-set-list',
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './set-list.html',
  styleUrl: './set-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetList {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly view = input.required<SetListView>();
  readonly disabled = input(false);
  /** The plan rule the whole plan breaks, shown under Add set (L2-029 AC15). */
  readonly error = input<string | null>(null);

  readonly editSet = output<number>();
  readonly editStretch = output<StretchKind>();
  readonly switchStretch = output<{ kind: StretchKind; on: boolean }>();
  readonly move = output<{ index: number; dir: 1 | -1 }>();
  readonly remove = output<number>();
  readonly add = output();

  protected moveSet(index: number, dir: 1 | -1): void {
    this.move.emit({ index, dir });
    // Focus stays on the same button of the moved set (design system, Set list).
    this.focusAfterRender(`${dir > 0 ? 'down' : 'up'}-${index + dir}`, `edit-${index + dir}`);
  }

  protected removeSet(index: number): void {
    this.remove.emit(index);
    this.focusAfterRender(`edit-${index}`, 'add');
  }

  private focusAfterRender(...keys: string[]): void {
    afterNextRender(
      () => {
        for (const key of keys) {
          const el = this.host.nativeElement.querySelector<HTMLButtonElement>(
            `[data-focus="${key}"]`,
          );
          if (el && !el.disabled) {
            el.focus();
            return;
          }
        }
      },
      { injector: this.injector },
    );
  }
}
