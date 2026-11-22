import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core';
import { CURRENT_RIDER } from '@telo/api';
import { SettingRow } from '@telo/components';
import { DisplayNameDialog } from './display-name-dialog';

/** Every rider is level 1 until XP lands (journey 10). */
const LEVEL = 1;

/**
 * Profile (docs/mocks/pages/profile/): in slice 9.3, the headline with the rider's display name and level ("Sam ·
 * Level 1", L2-005 AC3) and Settings, whose Display name row changes the name in a dialog. Slice 13.3 adds the XP bar,
 * maps, recent rides and the other Settings rows.
 */
@Component({
  selector: 'wz-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SettingRow],
})
export default class ProfilePage {
  private readonly currentRider = inject(CURRENT_RIDER);
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  protected readonly level = LEVEL;
  protected readonly name = computed(() => this.currentRider.rider()?.displayName ?? null);

  /**
   * Opens the Display name dialog: a sheet at the bottom of a phone, centred from sm (640 px), as the design system
   * draws a dialog. The CDK returns the focus to the row when it closes.
   */
  protected changeName(): void {
    const sheet = matchMedia('(max-width: 39.99rem)').matches;
    const position = this.overlay.position().global().centerHorizontally();
    this.dialog.open(DisplayNameDialog, {
      positionStrategy: sheet ? position.bottom('0') : position.centerVertically(),
      disableClose: true,
      injector: this.injector,
      data: this.name() ?? '',
      ariaLabelledBy: 'display-name-title',
      autoFocus: '#display-name',
      hasBackdrop: false,
    });
  }
}
