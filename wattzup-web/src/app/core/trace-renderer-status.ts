// The trace renderer in use, for the Diagnostics dialog (L2-028).
import { Injectable, signal } from '@angular/core';

export type TraceRendererName = 'WebGL' | 'Canvas 2D' | 'Not started';

@Injectable({ providedIn: 'root' })
export class TraceRendererStatus {
  private readonly _name = signal<TraceRendererName>('Not started');
  readonly name = this._name.asReadonly();

  set(name: TraceRendererName): void {
    this._name.set(name);
  }
}
