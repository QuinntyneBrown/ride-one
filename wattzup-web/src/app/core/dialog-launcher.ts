// Opens the dashboard's dialogs through the CDK (L2-023, L2-051).
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DialogLauncher {
  openDiagnostics(): void {
    /* the diagnostics dialog arrives in the dialogs slice */
  }
}
