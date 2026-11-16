import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommandFeedbackService } from '../../core/command-feedback.service';
import { CountdownService } from '../../core/countdown.service';
import { LiveStateService } from '../../core/live-state.service';
import { formatLive } from '../../core/metric-format';
import { powerDelta } from '../../core/power-delta';
import { estimateWatts } from '../../core/plan-expansion';
import { ResistanceCommandService } from '../../core/resistance-command.service';
import { controlsState, planNote, stepLevel } from '../../core/resistance-controls';
import { resistanceView } from '../../core/resistance-view';
import { rideViewState } from '../../core/ride-view-state';
import { CmdLog } from '../cmd-log/cmd-log';
import { LevelControl } from '../level-control/level-control';
import { LevelPicker } from '../level-picker/level-picker';
import { PlanNote } from '../plan-note/plan-note';
import { AppBar } from '../app-bar/app-bar';
import { Interval } from '../interval/interval';
import { MetricsStrip } from '../metrics-strip/metrics-strip';
import { Readout } from '../readout/readout';

/** Route `/`: the ride dashboard. */
@Component({
  selector: 'wz-ride-page',
  imports: [AppBar, CmdLog, Interval, LevelControl, LevelPicker, MetricsStrip, PlanNote, Readout],
  providers: [CountdownService],
  templateUrl: './ride-page.html',
  styleUrl: './ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RidePage {
  protected readonly live = inject(LiveStateService);
  protected readonly state = this.live.state;
  protected readonly workout = computed(() => this.state()?.workout ?? null);
  protected readonly view = computed(() =>
    rideViewState(this.state(), this.live.connection(), this.live.loadFailed()),
  );

  protected readonly power = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    const target = w
      ? (s?.target_power ?? (segment ? estimateWatts(segment.cadence, segment.level) : null))
      : null;
    return {
      value: formatLive(s?.power ?? null),
      target,
      delta: powerDelta(s?.power ?? null, target, w?.status ?? null),
    };
  });

  protected readonly cadence = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    return {
      value: formatLive(s?.cadence ?? null),
      sub: segment ? `Aim for ${segment.cadence}` : 'No cadence goal',
    };
  });

  protected readonly commands = inject(ResistanceCommandService);
  protected readonly resistance = computed(() => resistanceView(this.state()));
  protected readonly resistanceControls = computed(() =>
    controlsState(this.state(), this.view().commandsEnabled),
  );
  protected readonly planNote = computed(() => {
    const note = this.view().controlsNote;
    return note && this.view().view === 'ride'
      ? { text: note, backToPlan: false }
      : planNote(this.state());
  });

  protected stepResistance(delta: 1 | -1): void {
    void this.commands.set(stepLevel(this.state(), delta));
  }

  constructor() {
    inject(CommandFeedbackService).start();
    this.live.ensureStarted();
  }
}
