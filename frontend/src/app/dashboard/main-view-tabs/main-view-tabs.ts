import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  model,
  viewChildren,
} from '@angular/core';

export type MainView = 'video' | 'chart';
const ORDER: MainView[] = ['video', 'chart'];

/**
 * The `Main view` tab list over the ride-along video and the trace, with a roving tabindex: the
 * arrow keys, Home and End move between the tabs and select them (L2-076 criteria 1 and 11).
 */
@Component({
  selector: 'wz-main-view-tabs',
  templateUrl: './main-view-tabs.html',
  styleUrl: './main-view-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainViewTabs {
  readonly view = model.required<MainView>();
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected onKey(event: KeyboardEvent): void {
    const i = ORDER.indexOf(this.view());
    const next =
      event.key === 'ArrowRight'
        ? (i + 1) % ORDER.length
        : event.key === 'ArrowLeft'
          ? (i + ORDER.length - 1) % ORDER.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? ORDER.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    this.view.set(ORDER[next]!);
    this.tabs()[next]?.nativeElement.focus();
  }
}
