// The Diagnostics dialog's rows in the browser edition (L2-095): only what the browser knows. The
// backend's server, transport, snapshot and viewer rows have no counterpart here (AC3).
import type { BikeState, BluetoothSupport, PacketLogView } from '@wattzup/api';
import type { DiagnosticsRow } from './diagnostics-report';

export interface BrowserDiagnosticsInput {
  state: BikeState | null;
  support: BluetoothSupport;
  userAgent: string;
  pageUrl: string;
  /** Rides kept and the origin's storage use, once known. */
  stored: { rides: number; bytes: number | null } | null;
}

/** `Chrome 126 · macOS` from a user agent string; the browser's own words where it is unknown. */
export function browserLabel(userAgent: string): string {
  const edge = /Edg\/(\d+)/.exec(userAgent);
  const chrome = /Chrome\/(\d+)/.exec(userAgent);
  const firefox = /Firefox\/(\d+)/.exec(userAgent);
  const safari = /Version\/(\d+)[\d.]* .*Safari\//.exec(userAgent);
  const browser = edge
    ? `Edge ${edge[1]}`
    : chrome
      ? `Chrome ${chrome[1]}`
      : firefox
        ? `Firefox ${firefox[1]}`
        : safari
          ? `Safari ${safari[1]}`
          : 'Unknown browser';
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /CrOS/.test(userAgent)
        ? 'ChromeOS'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Windows/.test(userAgent)
            ? 'Windows'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : null;
  return os ? `${browser} · ${os}` : browser;
}

function webBluetooth(support: BluetoothSupport, state: BikeState | null): string {
  if (support === 'unsupported') return 'Not in this browser';
  if (support === 'insecure') return 'Blocked: the page is not on HTTPS';
  return state?.adapter === 'off' ? 'Supported · adapter off' : 'Available';
}

const kilobytes = (bytes: number): string => `${Math.ceil(bytes / 1024)} KB`;

export function browserDiagnosticsRows(input: BrowserDiagnosticsInput): DiagnosticsRow[] {
  const { state, stored } = input;
  const rows: DiagnosticsRow[] = [
    { label: 'Browser', value: browserLabel(input.userAgent) },
    { label: 'Web Bluetooth', value: webBluetooth(input.support, state) },
    { label: 'Page', value: input.pageUrl },
  ];
  if (state?.device) {
    const id = state.connection_id.slice(0, 8);
    rows.push(
      {
        label: 'Bike',
        value: id
          ? `${state.device_label ?? state.device} · ${id}`
          : (state.device_label ?? state.device),
      },
      { label: 'Connection', value: state.ble.charAt(0).toUpperCase() + state.ble.slice(1) },
      { label: 'Last command', value: lastCommand(state) },
    );
  } else {
    rows.push({ label: 'Bike', value: 'None connected' });
  }
  rows.push(
    {
      label: 'Rides stored',
      value: stored
        ? `${stored.rides}${stored.bytes === null ? '' : ` · ${kilobytes(stored.bytes)}`} in this browser`
        : 'Counting…',
    },
    { label: 'Edition', value: 'Browser edition' },
  );
  return rows;
}

function lastCommand(state: BikeState): string {
  const c = state.commands.at(-1);
  if (!c) return 'None yet';
  const status = c.status === 'ack' ? `ack ${c.ack_ms ?? 0} ms` : c.status;
  return `RES ${c.level} · ${c.source} · ${status}`;
}

/** `212 commands · 20 KB`, or `1,284 packets · 186 KB` while every packet is logged. */
export function packetLogCount(view: PacketLogView): { count: string; unit: string; size: string } {
  return {
    count: view.entries.toLocaleString('en-US'),
    unit: view.everyPacket ? 'packets' : 'commands',
    size: kilobytes(view.bytes),
  };
}

/** `wattzup-packets-2026-11-15T19-10.log`, in local time. */
export function packetLogFileName(nowMs: number): string {
  const d = new Date(nowMs);
  const two = (n: number) => String(n).padStart(2, '0');
  return `wattzup-packets-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}-${two(d.getMinutes())}.log`;
}
