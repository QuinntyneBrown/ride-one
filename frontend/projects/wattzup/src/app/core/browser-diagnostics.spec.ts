import {
  browserDiagnosticsRows,
  browserLabel,
  packetLogCount,
  packetLogFileName,
} from './browser-diagnostics';
import { testState } from './test-state';

const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

describe('browser diagnostics (L2-095)', () => {
  it.each([
    [MAC_CHROME, 'Chrome 126 · macOS'],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
      'Edge 126 · Windows',
    ],
    [
      'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
      'Firefox 128 · Linux',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      'Safari 17 · iOS',
    ],
    ['curl/8.0', 'Unknown browser'],
  ])('names the browser: %s', (ua, label) => {
    expect(browserLabel(ua)).toBe(label);
  });

  const base = {
    support: 'ready' as const,
    userAgent: MAC_CHROME,
    pageUrl: 'https://wattzup.app/ride',
    stored: { rides: 11, bytes: 418 * 1024 },
  };

  it('lists what the browser knows for a connected bike, and no backend rows', () => {
    const state = testState({
      device: 'ECHEX-3',
      ble: 'connected',
      connection_id: '0bf669f1-aaaa',
      commands: [{ at: 1, ride_seconds: 10, level: 18, source: 'plan', status: 'ack', ack_ms: 40 }],
    });
    const rows = browserDiagnosticsRows({ ...base, state });
    expect(rows.map((r) => `${r.label}: ${r.value}`)).toEqual([
      'Browser: Chrome 126 · macOS',
      'Web Bluetooth: Available',
      'Page: https://wattzup.app/ride',
      `Bike: ${state.device_label} · 0bf669f1`,
      'Connection: Connected',
      'Last command: RES 18 · plan · ack 40 ms',
      'Rides stored: 11 · 418 KB in this browser',
      'Edition: Browser edition',
    ]);
  });

  it('says the adapter is off and that no bike is connected', () => {
    const state = testState({ device: null, adapter: 'off', ble: 'disconnected' });
    const rows = browserDiagnosticsRows({ ...base, state });
    expect(rows.find((r) => r.label === 'Web Bluetooth')?.value).toBe('Supported · adapter off');
    expect(rows.map((r) => r.label)).toEqual([
      'Browser',
      'Web Bluetooth',
      'Page',
      'Bike',
      'Rides stored',
      'Edition',
    ]);
    expect(rows.find((r) => r.label === 'Bike')?.value).toBe('None connected');
  });

  it.each([
    [false, '212', 'commands'],
    [true, '1,284', 'packets'],
  ])('counts the packet log (every packet %s)', (everyPacket, count, unit) => {
    const entries = Number(count.replace(',', ''));
    expect(packetLogCount({ entries, bytes: 20 * 1024, everyPacket })).toEqual({
      count,
      unit,
      size: '20 KB',
    });
  });

  it('names the download by local date and time', () => {
    expect(packetLogFileName(new Date(2026, 10, 15, 19, 10).getTime())).toBe(
      'wattzup-packets-2026-11-15T19-10.log',
    );
  });
});
