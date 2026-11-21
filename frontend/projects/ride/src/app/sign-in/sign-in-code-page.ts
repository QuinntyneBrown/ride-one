import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SignInCodeForm } from '@telo/components';
import { SignInStore } from './sign-in-store';

/** The code screen (L2-002, docs/mocks/pages/sign-in-code/): names the email and offers "Send a new code". */
@Component({
  selector: 'wz-sign-in-code-page',
  templateUrl: './sign-in-code-page.html',
  styleUrl: './sign-in-code-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignInCodeForm],
})
export default class SignInCodePage {
  protected readonly store = inject(SignInStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected async changeEmail(): Promise<void> {
    this.store.changeEmail();
    await this.router.navigate(['..'], { relativeTo: this.route });
  }
}
