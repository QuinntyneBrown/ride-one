import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { Alert } from '../alert/alert';

export interface SummaryLink {
  fieldId: string;
  text: string;
}

/** `<n> things to fix before you start` with a link per field (L2-029). */
@Component({
  selector: 'wz-form-summary',
  imports: [Alert],
  templateUrl: './form-summary.html',
  styleUrl: './form-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSummary {
  readonly links = input.required<readonly SummaryLink[]>();
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  protected readonly title = computed(() => {
    const n = this.links().length;
    return `${n} ${n === 1 ? 'thing' : 'things'} to fix before you start`;
  });

  focus(): void {
    this.box().nativeElement.focus();
  }

  protected go(event: Event, fieldId: string): void {
    event.preventDefault();
    document.getElementById(fieldId)?.focus();
  }
}
