import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BIKE_API } from '../../core/bike-api';
import { diagnosticsReport, diagnosticsRows } from '../../core/diagnostics-report';
import { LiveStateService } from '../../core/live-state.service';
import { epochTime } from '../../core/local-time';
import { TraceRendererStatus } from '../../core/trace-renderer-status';
import { DialogShell } from '../dialog-shell/dialog-shell';
import { Icon } from '../icon/icon';

/** What Wattzup sees right now (L2-023). */
@Component({
  selector: 'wz-diagnostics-dialog',
  imports: [DialogShell, Icon],
  templateUrl: './diagnostics-dialog.html',
  styleUrl: './diagnostics-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsDialog {
  protected readonly ref = inject(DialogRef);
  private readonly live = inject(LiveStateService);
  private readonly bike = inject(BIKE_API);
  private readonly renderer = inject(TraceRendererStatus).name;

  protected readonly rows = computed(() =>
    diagnosticsRows(
      this.live.state(),
      this.live.connection() === 'open',
      this.renderer(),
      epochTime,
    ),
  );
  protected readonly lines = signal<string[] | null>(null);
  protected readonly packetsFailed = signal(false);
  protected readonly copied = signal(false);
  protected readonly packetText = computed(() => {
    if (this.packetsFailed()) return "Couldn't read raw_packets.log.";
    const lines = this.lines();
    if (lines === null) return 'Loading…';
    return lines.length ? lines.join('\n') : 'No packets yet.';
  });

  constructor() {
    this.bike.diagnosticsPackets().then(
      (lines) => this.lines.set(lines),
      () => this.packetsFailed.set(true),
    );
  }

  protected async copy(): Promise<void> {
    const text = diagnosticsReport(this.rows(), this.lines() ?? []);
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
