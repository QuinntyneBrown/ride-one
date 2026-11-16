import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthCard } from '../auth-card/auth-card';

/** Any unknown route (L2-056). */
@Component({
  selector: 'wz-not-found-page',
  imports: [AuthCard, RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected readonly path = decodeURIComponentSafe(inject(Router).url.split(/[?#]/)[0]);
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
