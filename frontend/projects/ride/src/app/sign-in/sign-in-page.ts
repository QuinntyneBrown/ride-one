import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SignInForm } from '@telo/components';
import { SignInStore } from './sign-in-store';

/** Sign in (L2-001, docs/mocks/pages/sign-in/): sends a code, then opens the code screen. */
@Component({
  selector: 'wz-sign-in-page',
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignInForm],
})
export default class SignInPage {
  protected readonly store = inject(SignInStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected async send(email: string): Promise<void> {
    if (await this.store.send(email)) {
      await this.router.navigate(['code'], { relativeTo: this.route });
    }
  }
}
