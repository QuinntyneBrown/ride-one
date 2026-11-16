import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LiveStateService } from '../../core/live-state.service';
import { AppBar } from '../app-bar/app-bar';

/** Route `/`: the ride dashboard. */
@Component({
  selector: 'wz-ride-page',
  imports: [AppBar],
  templateUrl: './ride-page.html',
  styleUrl: './ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RidePage {
  protected readonly live = inject(LiveStateService);

  constructor() {
    this.live.ensureStarted();
  }
}
