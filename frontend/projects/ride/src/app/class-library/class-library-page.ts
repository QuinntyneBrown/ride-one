import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassCard, ClassShelf, TierTabs } from '@telo/components';
import { ClassLibraryStore, LENGTH_TABS } from './class-library-store';

/**
 * The Class Library at `/classes` (L2-081): the head with the Class length tabs, and the shelves the chosen tab shows,
 * each with its class cards; an open card leads to its Class Start.
 */
@Component({
  selector: 'wz-class-library-page',
  imports: [RouterLink, ClassCard, ClassShelf, TierTabs],
  templateUrl: './class-library-page.html',
  styleUrl: './class-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassLibraryPage {
  protected readonly library = inject(ClassLibraryStore);
  protected readonly tabs = LENGTH_TABS;
}
