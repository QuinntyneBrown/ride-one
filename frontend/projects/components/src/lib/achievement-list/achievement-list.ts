import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

/** One achievement as its badge reads (L2-086 AC8). */
export interface AchievementView {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly unlocked: boolean;
  readonly percent: number;
  /** `6 / 7 days` */
  readonly progress: string;
  readonly value: number;
  readonly goal: number;
}

/** The achievements, unlocked first, then by how close each is (L2-086 AC8). */
@Component({
  selector: 'wz-achievement-list',
  imports: [Icon],
  templateUrl: './achievement-list.html',
  styleUrl: './achievement-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementList {
  readonly achievements = input.required<readonly AchievementView[]>();
  protected readonly unlocked = computed(
    () => this.achievements().filter((a) => a.unlocked).length,
  );
}
