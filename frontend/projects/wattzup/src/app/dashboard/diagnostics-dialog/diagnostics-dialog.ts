import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BIKE_PAIRING, PACKET_LOG, SESSION_ARCHIVE } from '@wattzup/api';
import {
  browserDiagnosticsRows,
  packetLogCount,
  packetLogFileName,
} from '../../core/browser-diagnostics';
import { saveFile } from '../../core/save-file';
import { LiveStateService } from '../../core/live-state.service';
import { Dialog, Icon } from '@wattzup/components';

/** What the browser knows right now, with the packet log and its download (L2-023, L2-095). */
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
  protected readonly packetLog = inject(PACKET_LOG);
  private readonly archive = inject(SESSION_ARCHIVE);
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
  protected readonly logCount = computed(() => packetLogCount(this.packetLog.view()));
  protected readonly fileName = signal(packetLogFileName(Date.now()));
  /** Download packet log reads Saved to Downloads for 1.6 s (mock). */
  protected readonly saved = signal(false);
  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.archive.stored().then(
      (stored) => this.stored.set(stored),
      () => undefined,
    );
  }

  /** Saves the packet log as a raw_packets.log file (L2-095 AC2). */
  protected download(): void {
    const name = packetLogFileName(Date.now());
    this.fileName.set(name);
    saveFile(this.packetLog.file(), name);
    this.saved.set(true);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.saved.set(false), 1600);
  }
}
