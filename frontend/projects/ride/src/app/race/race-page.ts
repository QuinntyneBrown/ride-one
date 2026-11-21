import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RaceBar, RaceInterval, RacePower, RaceResist, RaceRoute } from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  WorkoutEngine,
} from '@telo/domain';
import { RaceStore } from './race-store';

/**
 * The race at `/race/:mapId/ride` (docs/mocks/pages/race/): full screen with no app header, the scene behind the HUD.
 * Every part of the race is provided here, so leaving the page stops the clock and the ticker and releases them.
 */
@Component({
  selector: 'wz-race-page',
  imports: [RaceBar, RaceInterval, RacePower, RaceResist, RaceRoute],
  templateUrl: './race-page.html',
  styleUrl: './race-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RaceStore, RideClock, RideTicker, WorkoutEngine, ResistanceController, BikeTelemetry],
})
export default class RacePage {
  protected readonly store = inject(RaceStore);
}
