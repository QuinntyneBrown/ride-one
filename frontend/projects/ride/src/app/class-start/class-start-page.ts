import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AppHeaderBike,
  ClassPlan,
  ClassStartHeader,
  ClassStartVideo,
  ClassSync,
  Button,
  InlineMessage,
} from '@telo/components';
import { ClassStartStore } from './class-start-store';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/**
 * Class Start at `/` (L2-084, L2-085): the one class, until slice 30.2 draws The Class in its place (ADR 0040). Its
 * header has the wordmark, the bike's status and Full screen, and no navigation; Start class opens the ride, always
 * solo (ADR 0038).
 */
@Component({
  selector: 'wz-class-start-page',
  imports: [
    FullscreenButton,
    AppHeaderBike,
    Button,
    InlineMessage,
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
