import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackLink, ClassPlan, ClassStartHeader, ClassStartVideo } from '@telo/components';
import { ClassStartStore } from './class-start-store';

/**
 * Class Start at `/classes/:id` (L2-084, L2-085): the class between the library and its ride, with "← Classes" back to
 * the library.
 */
@Component({
  selector: 'wz-class-start-page',
  imports: [RouterLink, BackLink, ClassPlan, ClassStartHeader, ClassStartVideo],
  templateUrl: './class-start-page.html',
  styleUrl: './class-start-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClassStartStore],
})
export default class ClassStartPage {
  protected readonly store = inject(ClassStartStore);
}
