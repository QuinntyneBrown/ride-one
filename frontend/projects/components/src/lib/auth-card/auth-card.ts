import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The centred card with the large lockup, used by the unlock and not-found pages. */
@Component({
  selector: 'wz-auth-card',
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCard {
  readonly centered = input(false);
}
