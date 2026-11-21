import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Button,
  ClassBike,
  ClassHeader,
  ClassLost,
  ClassResist,
  ClassSegment,
  ClassStat,
  ClassVideo,
} from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  VideoClockSync,
  WorkoutEngine,
} from '@telo/domain';
import { ClassRideStore } from './class-ride-store';

/**
 * Class Ride at `/classes/:id/ride` (docs/mocks/pages/class-ride/, solo): the header with the class and its clock,
 * the class video, and the bike panel with the segment card, Power, Cadence and the resistance stepper. Every part of the ride is
 * provided here, so leaving the page stops the clock and the ticker and releases them.
 */
@Component({
  selector: 'wz-class-ride-page',
  imports: [
    Button,
    ClassBike,
    ClassHeader,
    ClassLost,
    ClassResist,
    ClassSegment,
    ClassStat,
    ClassVideo,
  ],
  templateUrl: './class-ride-page.html',
  styleUrl: './class-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ClassRideStore,
    RideClock,
    RideTicker,
    WorkoutEngine,
    ResistanceController,
    BikeTelemetry,
    VideoClockSync,
  ],
})
export default class ClassRidePage {
  protected readonly store = inject(ClassRideStore);
}
