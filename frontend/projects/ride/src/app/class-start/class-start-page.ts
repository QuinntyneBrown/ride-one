import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BackLink,
  ClassPlan,
  ClassStartHeader,
  ClassStartVideo,
  ClassSync,
  Button,
} from '@telo/components';
import { ClassStartStore } from './class-start-store';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/**
 * Class Start at `/classes/:id` (L2-084, L2-085): the class between the library and its ride, with "← Classes" back to
 * the library, and Start class into the ride, always solo (ADR 0038).
 */
@Component({
  selector: 'wz-class-start-page',
  imports: [
    FullscreenButton,
    RouterLink,
    BackLink,
    Button,
    ClassPlan,
    ClassStartHeader,
    ClassStartVideo,
    ClassSync,
  ],
  templateUrl: './class-start-page.html',
  styleUrl: './class-start-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClassStartStore],
})
export default class ClassStartPage {
  protected readonly store = inject(ClassStartStore);
  private readonly router = inject(Router);

  /** Start class: the class ride, solo, at once (L2-085 AC4). */
  protected start(id: string): void {
    void this.router.navigate(['/classes', id, 'ride'], { queryParams: { mode: 'solo' } });
  }
}
