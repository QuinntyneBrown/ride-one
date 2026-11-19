// What setup and a class page say when the browser edition cannot reach Bluetooth (L2-089 AC1,
// AC3): a banner over a page that stays usable, and why Start ride is disabled.
import type { BluetoothSupport } from '@wattzup/api';

export interface SupportNotice {
  icon: 'monitor-off' | 'lock';
  heading: string;
  text: string;
  actionLabel: 'Copy link' | 'Open over HTTPS';
  /** The HTTPS address to open; null when the action copies the page's own address. */
  href: string | null;
  /** Under the disabled Start ride. */
  startHint: string;
}

export function supportNotice(support: BluetoothSupport, pageUrl: string): SupportNotice | null {
  switch (support) {
    case 'unsupported':
      return {
        icon: 'monitor-off',
        heading: 'Open Wattzup in Chrome or Edge.',
        text: 'Bluetooth to the bike only works there — you can look around, but not ride.',
        actionLabel: 'Copy link',
        href: null,
        startHint: 'Needs Chrome or Edge to reach the bike.',
      };
    case 'insecure':
      return {
        icon: 'lock',
        heading: 'Open the secure version of this page.',
        text: 'Bluetooth is blocked on plain http, so the bike can’t connect.',
        actionLabel: 'Open over HTTPS',
        href: pageUrl.replace(/^http:/, 'https:'),
        startHint: 'Needs the HTTPS page to reach the bike.',
      };
    default:
      return null;
  }
}
