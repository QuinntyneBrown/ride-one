import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassCard, ClassShelf } from '@telo/components';
import { ClassLibraryStore } from './class-library-store';

/**
 * The Class Library at `/classes` (L2-081): the head, and one shelf per length band with its class cards; an open card
 * leads to its Class Start.
 */
@Component({
  selector: 'wz-class-library-page',
  imports: [RouterLink, ClassCard, ClassShelf],
  templateUrl: './class-library-page.html',
  styleUrl: './class-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassLibraryPage {
  protected readonly library = inject(ClassLibraryStore);
}
