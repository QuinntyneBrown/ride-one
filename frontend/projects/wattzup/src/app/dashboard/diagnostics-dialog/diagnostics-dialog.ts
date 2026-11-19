import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BIKE_API, BIKE_PAIRING, EDITION, PACKET_LOG, SESSION_ARCHIVE } from '@wattzup/api';
import {
  browserDiagnosticsRows,
  packetLogCount,
  packetLogFileName,
} from '../../core/browser-diagnostics';
import { saveFile } from '../../core/save-file';
import { diagnosticsReport, diagnosticsRows } from '../../core/diagnostics-report';
import { LiveStateService } from '../../core/live-state.service';
import { epochTime } from '../../core/local-time';
import { TraceRendererStatus } from '../../core/trace-renderer-status';
import { Dialog, Icon } from '@wattzup/components';

/** What Wattzup sees right now (L2-023); in the browser edition, what the browser knows, with the
 * packet log and its download (L2-095). */
@Component({
  selector: 'wz-diagnostics-dialog',
  imports: [Dialog, Icon],
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

  protected readonly browser = inject(EDITION) === 'browser';
  protected readonly packetLog = this.browser ? inject(PACKET_LOG, { optional: true }) : null;
  private readonly archive = this.browser ? inject(SESSION_ARCHIVE, { optional: true }) : null;
  private readonly pairing = inject(BIKE_PAIRING);
  private readonly stored = signal<{ rides: number; bytes: number | null } | null>(null);
  protected readonly browserRows = computed(() =>
    browserDiagnosticsRows({
      state: this.live.state(),
      support: this.pairing.support(),
      userAgent: navigator.userAgent,
      pageUrl: location.href,
      stored: this.stored(),
    }),
  );
  protected readonly logCount = computed(() =>
    packetLogCount(this.packetLog?.view() ?? { entries: 0, bytes: 0, everyPacket: false }),
  );
  protected readonly fileName = signal(packetLogFileName(Date.now()));
  /** Download packet log reads Saved to Downloads for 1.6 s (browser mock). */
  protected readonly saved = signal(false);
  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (this.browser) {
      this.archive?.stored().then(
        (stored) => this.stored.set(stored),
        () => undefined,
      );
      return;
    }
    this.bike.diagnosticsPackets().then(
      (lines) => this.lines.set(lines),
      () => this.packetsFailed.set(true),
    );
  }

  /** Saves the packet log as a raw_packets.log file (L2-095 AC2). */
  protected download(): void {
    if (!this.packetLog) return;
    const name = packetLogFileName(Date.now());
    this.fileName.set(name);
    saveFile(this.packetLog.file(), name);
    this.saved.set(true);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.saved.set(false), 1600);
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
