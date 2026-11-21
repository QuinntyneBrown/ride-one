import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Home (`/`). Slice 13.2 fills it with the greeting, the next ride and the two doors. */
@Component({
  selector: 'wz-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {}
