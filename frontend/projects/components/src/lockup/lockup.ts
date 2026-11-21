import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The TELO Ride lockup (design-system block lockup): the logo mark and the wordmark, named "Telo Ride". */
@Component({
  selector: 'wz-lockup',
  templateUrl: './lockup.html',
  styleUrl: './lockup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lockup {}
