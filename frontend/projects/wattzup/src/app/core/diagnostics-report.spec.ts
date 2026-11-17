import { diagnosticsReport, diagnosticsRows } from './diagnostics-report';
import { testState } from './test-state';

describe('diagnostics (L2-023)', () => {
  const rows = diagnosticsRows(
    testState({ ui_clients: 2, displayed_seconds: 2490.4 }),
    true,
    'WebGL',
    (s) => (s === null ? 'never' : 'T' + s),
  );
  it('lists the 8 rows', () => {
    expect(rows).toEqual([
      { label: 'Server', value: 'Connected · event stream open · 2 viewers' },
      { label: 'Bluetooth', value: 'connected · ECHEX-3-141844 (Echelon EX-5s)' },
      { label: 'Transport', value: 'Simulated' },
      { label: 'Packets', value: '2,517' },
      { label: 'Live on screen', value: '41 min 30 s' },
      { label: 'Last update', value: 'T1794787812' },
      { label: 'Trace renderer', value: 'WebGL' },
      { label: 'Last error', value: 'None' },
    ]);
  });
  it('reads offline, a bare ble and never', () => {
    const r = diagnosticsRows(
      testState({ device: null, last_data_at: null, error: 'boom' }),
      false,
      'Canvas 2D',
      (s) => (s === null ? 'never' : 'x'),
    );
    expect(r[0].value).toBe('Offline · retrying every 2 s');
    expect(r[1].value).toBe('connected');
    expect(r[5].value).toBe('never');
    expect(r[7].value).toBe('boom');
  });
  it('copies Label: value lines, a blank line, then packets', () => {
    expect(diagnosticsReport(rows.slice(0, 2), ['a', 'b'])).toBe(
      'Server: Connected · event stream open · 2 viewers\nBluetooth: connected · ECHEX-3-141844 (Echelon EX-5s)\n\na\nb',
    );
  });
});
