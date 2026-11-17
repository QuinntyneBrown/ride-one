// The diagnostics dialog's rows and the plain-text report it copies (L2-023).
import type { BikeState } from '@wattzup/api';
import { formatCount } from '@wattzup/components';

export interface DiagnosticsRow {
  label: string;
  value: string;
}

export function diagnosticsRows(
  state: BikeState | null,
  streamOpen: boolean,
  renderer: string,
  localTime: (epochSeconds: number | null) => string,
): DiagnosticsRow[] {
  const s = state;
  const shown = Math.floor(s?.displayed_seconds ?? 0);
  const bluetooth = !s
    ? 'unknown'
    : s.device === null
      ? s.ble
      : `${s.ble} · ${s.device} (${s.device_label ?? s.device})`;
  return [
    {
      label: 'Server',
      value: streamOpen
        ? `Connected · event stream open · ${s?.ui_clients ?? 0} viewers`
        : 'Offline · retrying every 2 s',
    },
    { label: 'Bluetooth', value: bluetooth },
    { label: 'Transport', value: s?.transport ?? 'unknown' },
    { label: 'Packets', value: formatCount(s?.packets ?? 0) },
    { label: 'Live on screen', value: `${Math.floor(shown / 60)} min ${shown % 60} s` },
    { label: 'Last update', value: localTime(s?.last_data_at ?? null) },
    { label: 'Trace renderer', value: renderer },
    { label: 'Last error', value: s?.error ?? 'None' },
  ];
}

export function diagnosticsReport(
  rows: readonly DiagnosticsRow[],
  lines: readonly string[],
): string {
  return [...rows.map((r) => `${r.label}: ${r.value}`), '', ...lines].join('\n');
}
