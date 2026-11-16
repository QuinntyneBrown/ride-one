import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Route `/setup`: set up a ride (L2-029). */
@Component({
  selector: 'wz-setup-page',
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupPage {}
