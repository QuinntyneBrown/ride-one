import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, REMEMBERED_BIKE } from '@telo/api';
import { SettingRow } from '@telo/components';
import { openDiagnostics } from '../diagnostics/open-diagnostics';
import { bikeRow } from './bike-row';

/**
 * Profile (docs/mocks/pages/profile/): its title and Settings, with the bike row and Ride settings. Telo Ride 1 has no
 * account, so there is no headline with a name and level, no XP bar, and no Display name, Sign out, Delete my account
 * or Custom workout row (ADR 0039).
 */
@Component({
  selector: 'wz-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SettingRow],
})
export default class ProfilePage {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly remembered = inject(REMEMBERED_BIKE).get();

  /** The bike row (L2-112 AC1, AC2): with no bike, it goes to Connect Bike to pair one; with one, it opens Diagnostics. */
  protected readonly bike = computed(() =>
    bikeRow(
      this.connection.ble(),
      this.support.state(),
      (this.connection.bike() ?? this.remembered)?.name ?? null,
    ),
  );

  /** Diagnostics, from the bike row once a bike is paired (L2-113 AC1). */
  protected openDiagnostics(): void {
    void openDiagnostics(this.dialog, this.injector);
  }
}
