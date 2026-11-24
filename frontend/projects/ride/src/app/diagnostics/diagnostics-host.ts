import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { DIAGNOSTIC_RECORDING, FILE_SAVER } from '@telo/api';
import {
  DiagnosticMark,
  type DiagnosticMarkScreen,
  DiagnosticPanel,
  type DiagnosticStatus,
} from '@telo/components/diagnostics';

/**
 * The diagnostic recording's controls (docs/mocks/dialogs/diagnostic-recording/, L2-178 AC11): the recording mark,
 * fixed at the foot of every screen, and the "Diagnostic recording" dialog it opens. The dialog is the platform's
 * `<dialog>` element opened with `showModal()`, not the CDK's (ADR 0048): the browser keeps focus in it, closes it on
 * Escape and returns focus to the mark. It is mounted only when the app is opened with `?diagnose`.
 */
@Component({
  selector: 'wz-diagnostics-host',
  imports: [DiagnosticMark, DiagnosticPanel],
  templateUrl: './diagnostics-host.html',
  styleUrl: './diagnostics-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsHost {
  protected readonly recording = inject(DIAGNOSTIC_RECORDING);
  private readonly saver = inject(FILE_SAVER);
  private readonly router = inject(Router);

  /** Whether the dialog is open; its content is drawn only then. */
  protected readonly open = signal(false);
  protected readonly status = signal<DiagnosticStatus | null>(null);
  /** The screen the mark is on, where that screen keeps its foot for something else. */
  protected readonly screen = signal<DiagnosticMarkScreen | null>(screenAt(this.router.url));
  /** When the recording started, as the dialog's first line says it. */
  protected readonly since = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(this.recording.startedAt);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.screen.set(screenAt(event.urlAfterRedirects));
    });
  }

  protected show(dialog: HTMLDialogElement): void {
    this.status.set(null);
    this.open.set(true);
    dialog.showModal();
  }

  /** Saves the recording, then each screen capture, as files the browser downloads (AC15). */
  protected save(): void {
    const files = this.recording.files();
    try {
      for (const file of files) this.saver.save(file);
    } catch {
      this.status.set({ text: 'The files couldn’t be saved. Try again.', tone: 'warn' });
      return;
    }
    this.status.set({ text: savedText(files.length), tone: 'ok' });
  }
}

/** The screen at an address, for the two that keep their foot for something else. */
function screenAt(url: string): DiagnosticMarkScreen | null {
  const path = url.split(/[?#]/)[0];
  if (path === '/') return 'the-class';
  return path === '/ride' ? 'class-ride' : null;
}

/** "Saved 1 file: the recording." or "Saved 3 files: the recording and 2 screen captures." */
function savedText(files: number): string {
  const captures = files - 1;
  const what =
    captures === 0
      ? 'the recording'
      : `the recording and ${captures} screen capture${captures === 1 ? '' : 's'}`;
  return `Saved ${files} file${files === 1 ? '' : 's'}: ${what}.`;
}
