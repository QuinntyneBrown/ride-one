import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusLine } from '../status-line/status-line';

/** The ride dashboard's app bar, in DOM order = Tab order (L2-041). */
@Component({
  selector: 'wz-app-bar',
  imports: [RouterLink, StatusLine],
  templateUrl: './app-bar.html',
  styleUrl: './app-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBar {}
