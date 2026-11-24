import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import {
  type BikeKind,
  type BikeLinkTap,
  type CapturedScreen,
  type DiagnosticRecording,
  MONOTONIC_TIME,
  type ReceivedHow,
  type RecordingFile,
  type ScreenCaptureErrorCode,
  type ShownReadouts,
  type WriteSettled,
} from '@telo/api';
import { redact } from '../console-app-logger';
import { RecordingBuffer } from './recording-buffer';
import { type EntryKind, entryLine, recordingFileName, recordingHeader } from './recording-format';

/**
 * The diagnostic recording (L2-178; docs/detailed-designs/security/record-diagnostics): the tap on the Bluetooth
 * link and the recording it fills. Every entry is formatted to its line when it is made and kept in a ring with a
 * fixed limit, so nothing grows with the ride (AC9). Times come from the monotonic clock, counted from the moment the
 * recording started (AC10). It writes nothing to the console (L2-115 AC2) and sends nothing anywhere: `files()` is
 * the only way out. Provided only when the app is opened with `?diagnose`.
 */
@Injectable()
export class DiagnosticRecorder implements BikeLinkTap, DiagnosticRecording {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly clock = inject(MONOTONIC_TIME, { optional: true });
  private readonly buffer = new RecordingBuffer();
  private readonly origin = this.now();
  private readonly held = signal(0);
  private readonly gone = signal(0);
  private readonly kept = signal(0);

  readonly startedAt = new Date();
  readonly entries = this.held.asReadonly();
  readonly dropped = this.gone.asReadonly();
  readonly captures = this.kept.asReadonly();

  constructor() {
    this.add('EVT', 'recording-started');
  }

  received(from: string, bytes: Uint8Array, how: ReceivedHow, bike: BikeKind | null): void {
    void [from, bytes, how, bike];
  }

  writing(to: string, bytes: Uint8Array, targetResistance?: number): WriteSettled {
    void [to, bytes, targetResistance];
    return () => undefined;
  }

  event(name: string, detail?: string): void {
    this.add('EVT', detail === undefined ? name : `${name} ${detail}`);
  }

  readouts(shown: ShownReadouts): void {
    void shown;
  }

  note(text: string): void {
    void text;
  }

  keepCapture(captured: CapturedScreen): number {
    void captured;
    return 0;
  }

  captureFailed(code: ScreenCaptureErrorCode, error?: unknown): void {
    void [code, error];
  }

  files(): RecordingFile[] {
    const header = recordingHeader({
      startedAt: this.startedAt,
      savedAt: new Date(),
      address: redact(this.view?.location.href ?? ''),
      browser: this.view?.navigator.userAgent ?? '',
      dropped: this.buffer.dropped,
    });
    const text = [...header, ...this.buffer.lines(), ''].join('\n');
    return [
      {
        name: recordingFileName(this.startedAt),
        blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      },
    ];
  }

  private add(kind: EntryKind, detail: string): void {
    this.buffer.push(entryLine(this.now() - this.origin, kind, detail));
    this.held.set(this.buffer.size);
    this.gone.set(this.buffer.dropped);
  }

  private now(): number {
    return this.clock?.now() ?? this.view?.performance.now() ?? 0;
  }
}
