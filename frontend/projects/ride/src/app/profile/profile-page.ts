import { Dialog, type DialogConfig } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core';
import { CURRENT_RIDER, PROGRESS_STORE } from '@telo/api';
import { InlineMessage, ProfileLevel, SettingRow } from '@telo/components';
import { AccountStore } from './account-store';
import { DeleteAccountDialog } from './delete-account-dialog';
import { toLevelView } from '../progress/level-view';
import { profileMeta, profileXpLabel } from '../progress/profile-meta';
import { DisplayNameDialog } from './display-name-dialog';

/**
 * Profile (docs/mocks/pages/profile/): in slice 9.3, the headline with the rider's display name and level ("Sam ·
 * Level 1", L2-005 AC3), the level from the progress the header shows (slice 10.3), the XP to the next level and the
 * streak under it (slice 10.4), and Settings, whose Display name row changes the name in a dialog, and whose Sign out and
 * Delete my account rows end the session or delete the account (slice 9.4, L2-006). Slice 13.3 draws the headline
 * through `ProfileLevel`, with the XP bar and the rides and kilometres, and adds the bike, Ride settings and Custom
 * workout rows.
 */
@Component({
  selector: 'wz-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineMessage, ProfileLevel, SettingRow],
})
export default class ProfilePage {
  private readonly currentRider = inject(CURRENT_RIDER);
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  protected readonly account = inject(AccountStore);

  private readonly progress = inject(PROGRESS_STORE);

  /** The rider's level, unknown until the progress arrives. */
  protected readonly level = computed(() => this.progress.progress()?.level ?? null);
  /** The XP bar's name and fill, once the progress arrives (L2-109 AC1). */
  protected readonly xp = computed(() => {
    const progress = this.progress.progress();
    return progress === null
      ? null
      : { label: profileXpLabel(progress), fillPercent: toLevelView(progress).fillPercent };
  });
  /** "760 XP to level 8 · 23 rides · 412 km · 4-day streak", once the progress arrives. */
  protected readonly meta = computed(() => {
    const progress = this.progress.progress();
    return progress === null ? null : profileMeta(progress);
  });
  /** "Sam · Level 7"; the name or the level alone until both are known. */
  protected readonly headline = computed(() => {
    const level = this.level();
    return [this.name(), level === null ? null : `Level ${level}`].filter(Boolean).join(' · ');
  });
  protected readonly name = computed(() => this.currentRider.rider()?.displayName ?? null);

  protected changeName(): void {
    this.dialog.open(DisplayNameDialog, {
      ...this.settingsDialog('display-name', 'display-name'),
      data: this.name() ?? '',
    });
  }

  protected deleteAccount(): void {
    this.dialog.open(DeleteAccountDialog, {
      ...this.settingsDialog('delete-account', 'delete-account-confirm'),
      ariaDescribedBy: 'delete-account-lead',
    });
  }

  /**
   * How a Settings dialog opens: a sheet at the bottom of a phone, centred from sm (640 px), as the design system draws
   * a dialog, labelled by `${block}-title` and with the focus on `field`. The CDK returns the focus to the row when it
   * closes.
   */
  private settingsDialog(
    block: string,
    field: string,
  ): Pick<
    DialogConfig,
    | 'positionStrategy'
    | 'disableClose'
    | 'injector'
    | 'ariaLabelledBy'
    | 'autoFocus'
    | 'hasBackdrop'
  > {
    const sheet = matchMedia('(max-width: 39.99rem)').matches;
    const position = this.overlay.position().global().centerHorizontally();
    return {
      positionStrategy: sheet ? position.bottom('0') : position.centerVertically(),
      disableClose: true,
      injector: this.injector,
      ariaLabelledBy: `${block}-title`,
      autoFocus: `#${field}`,
      hasBackdrop: false,
    };
  }
}
