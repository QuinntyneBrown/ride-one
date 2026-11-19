// Whether this page can reach Web Bluetooth at all (L2-089). A page on plain http wins over a
// missing navigator.bluetooth, because Chromium hides Web Bluetooth there and the fix is HTTPS.
import type { BluetoothSupport } from '@wattzup/api';

export interface SupportEnvironment {
  isSecureContext: boolean;
  hasBluetooth: boolean;
}

export function supportVerdict(env: SupportEnvironment): BluetoothSupport {
  if (!env.isSecureContext) return 'insecure';
  if (!env.hasBluetooth) return 'unsupported';
  return 'ready';
}
