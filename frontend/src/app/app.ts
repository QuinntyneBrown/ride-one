import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastRegion } from './dashboard/toast-region/toast-region';

@Component({
  selector: 'wz-root',
  imports: [RouterOutlet, ToastRegion],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
