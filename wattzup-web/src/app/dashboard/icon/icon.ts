import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bluetooth'
  | 'bluetooth-scan'
  | 'bluetooth-off'
  | 'wifi-off'
  | 'minus'
  | 'plus'
  | 'stop'
  | 'pause'
  | 'play'
  | 'activity'
  | 'sliders'
  | 'close'
  | 'bell'
  | 'bell-off'
  | 'alert-circle'
  | 'info'
  | 'check-circle'
  | 'warning'
  | 'refresh'
  | 'copy'
  | 'key'
  | 'flag';

/** The mocks' stroke icons, always decorative (`aria-hidden`). */
@Component({
  selector: 'wz-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly spin = input(false);
}
