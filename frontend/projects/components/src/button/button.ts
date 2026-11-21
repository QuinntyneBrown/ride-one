import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'default' | 'primary';
export type ButtonSize = 'md' | 'lg';

/**
 * A button or a link drawn as one (design-system block btn). Put it on the native element so the element keeps its
 * own role and keyboard behaviour: `<a wz-button variant="primary" size="lg" routerLink="/">`.
 */
@Component({
  selector: 'a[wz-button], button[wz-button]',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn--primary]': 'variant() === "primary"',
    '[class.btn--lg]': 'size() === "lg"',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
}
