import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiKeyStore } from '../../core/api-key.store';
import { BIKE_API } from '../../core/bike-api';
import { LiveStateService } from '../../core/live-state.service';
import { safeReturnUrl } from '../../core/safe-return-url';
import { Alert } from '../alert/alert';
import { AuthCard } from '../auth-card/auth-card';

type Problem = 'empty' | 'rejected' | 'unreachable' | null;

/** Route `/unlock`: ask for the API key of a shared server (L2-055). */
@Component({
  selector: 'wz-unlock-page',
  imports: [Alert, AuthCard],
  templateUrl: './unlock-page.html',
  styleUrl: './unlock-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnlockPage {
  /** From the query string, bound by the router. */
  readonly returnUrl = input<string | undefined>(undefined);

  private readonly bike = inject(BIKE_API);
  private readonly keys = inject(ApiKeyStore);
  private readonly live = inject(LiveStateService);
  private readonly router = inject(Router);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('key');

  protected readonly host = location.host;
  protected readonly busy = signal(false);
  protected readonly problem = signal<Problem>(null);

  protected async unlock(event: Event): Promise<void> {
    event.preventDefault();
    const input = this.field().nativeElement;
    const key = input.value.trim();
    if (!key) {
      this.problem.set('empty');
      input.focus();
      return;
    }
    this.busy.set(true);
    const result = await this.bike.verifyKey(key);
    this.busy.set(false);
    if (result === 'ok') {
      this.problem.set(null);
      this.keys.set(key);
      this.live.restart();
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      return;
    }
    this.problem.set(result);
    if (result === 'rejected') input.focus();
  }

  protected focusKey(event: Event): void {
    event.preventDefault();
    this.field().nativeElement.focus();
  }
}
