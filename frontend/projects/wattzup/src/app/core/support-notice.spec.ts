import { supportNotice } from './support-notice';

describe('supportNotice (L2-089)', () => {
  const url = 'http://wattzup.example/setup';

  it('says nothing when Bluetooth can be reached', () => {
    expect(supportNotice('ready', url)).toBeNull();
  });

  it('asks for Chrome or Edge, copying the page address, where Web Bluetooth is missing', () => {
    const n = supportNotice('unsupported', url)!;
    expect([n.heading, n.actionLabel, n.href, n.startHint]).toEqual([
      'Open Wattzup in Chrome or Edge.',
      'Copy link',
      null,
      'Needs Chrome or Edge to reach the bike.',
    ]);
  });

  it('links the same page over HTTPS on plain http', () => {
    const n = supportNotice('insecure', url)!;
    expect([n.heading, n.actionLabel, n.href, n.startHint]).toEqual([
      'Open the secure version of this page.',
      'Open over HTTPS',
      'https://wattzup.example/setup',
      'Needs the HTTPS page to reach the bike.',
    ]);
  });
});
