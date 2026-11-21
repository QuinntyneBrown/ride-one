import type { Page } from '@playwright/test';

/** A bike the fake Bluetooth stack offers: its advertised name, and its services' characteristic UUIDs. */
export interface FakeBike {
  name: string;
  services: Record<string, string[]>;
}

/** One write the page made, in the order it made them. */
export interface RecordedWrite {
  characteristic: string;
  /** Upper-case hex bytes separated by spaces, as the protocol documents them ("F0 A1 00 91"). */
  hex: string;
  withResponse: boolean;
}

/** The options the page passed to `requestDevice`, as JSON (numbers stay numbers, UUIDs strings). */
export interface RecordedRequest {
  filters: { services: (string | number)[] }[];
  optionalServices?: (string | number)[];
}

type Report =
  | { kind: 'write'; characteristic: string; hex: string; withResponse: boolean }
  | { kind: 'subscribe'; characteristic: string }
  | { kind: 'request'; options: RecordedRequest }
  | { kind: 'unexpected'; call: string };

/**
 * A fake `navigator.bluetooth`, installed before the app loads (L2-148 AC1). Until the spec offers a bike, every call
 * is unexpected; so is a call to a member, service or characteristic the bike does not have. An unexpected call
 * rejects in the page and fails the spec. Writes and unexpected calls reach the spec through a binding, so they
 * survive navigation, and a write resolves in the page only once the spec has recorded it.
 */
export class FakeBluetooth {
  private readonly recorded: RecordedWrite[] = [];
  private readonly refused: string[] = [];
  private readonly requested: RecordedRequest[] = [];
  private readonly order: string[] = [];

  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<FakeBluetooth> {
    const fake = new FakeBluetooth(page);
    await page.exposeFunction('__fakeBluetoothReport', (report: Report) => fake.receive(report));
    await page.addInitScript(installInPage);
    return fake;
  }

  /** From the next page load, the browser has no `navigator.bluetooth`, as Safari and Firefox (L2-008). */
  async remove(): Promise<void> {
    await this.page.addInitScript(removeFromPage);
  }

  /**
   * From the next page load, the page is served over plain `http` from an address other than `localhost`: no secure
   * context, so no `navigator.bluetooth` either, as Chromium does (L2-009).
   */
  async servePlainHttp(): Promise<void> {
    await this.page.addInitScript(() =>
      Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true }),
    );
    await this.page.addInitScript(removeFromPage);
  }

  /** Puts the fake `navigator.bluetooth` back on the current page, as if the rider had switched browser. */
  async restore(): Promise<void> {
    await this.page.evaluate(installInPage);
  }

  /** Offers `bike` to `requestDevice` and `getDevices`, from the next page load and on the current page. */
  async offer(bike: FakeBike): Promise<void> {
    await this.page.addInitScript(
      (offered) => Object.assign(window, { __fakeBike: offered }),
      bike,
    );
    await this.page.evaluate((offered) => Object.assign(window, { __fakeBike: offered }), bike);
  }

  /** The rider closes the browser's chooser without picking a bike: `requestDevice` rejects with `NotFoundError`. */
  async cancelChooser(): Promise<void> {
    await this.chooser('cancel');
  }

  /** A policy keeps the chooser from opening: `requestDevice` rejects with `SecurityError` (L2-012 AC4). */
  async blockChooser(): Promise<void> {
    await this.chooser('block');
  }

  /** The chooser opens again as usual. */
  async allowChooser(): Promise<void> {
    await this.chooser(null);
  }

  /** Every `requestDevice` call's options, oldest first. */
  requests(): RecordedRequest[] {
    return [...this.requested];
  }

  /** Subscriptions and writes in the order the page made them: `subscribe <uuid>` or `write <uuid> <hex>`. */
  log(): string[] {
    return [...this.order];
  }

  private async chooser(mode: 'cancel' | 'block' | null): Promise<void> {
    await this.page.addInitScript((m) => Object.assign(window, { __fakeChooser: m }), mode);
    await this.page.evaluate((m) => Object.assign(window, { __fakeChooser: m }), mode);
  }

  /** Pushes `bytes` from the bike on `characteristic`, to every subscription the page holds. */
  async notify(characteristic: string, bytes: readonly number[]): Promise<void> {
    await this.page.evaluate(
      ({ characteristic, bytes }) =>
        (
          window as unknown as { __fakeBluetooth: { notify(c: string, b: number[]): void } }
        ).__fakeBluetooth.notify(characteristic, bytes),
      { characteristic, bytes: [...bytes] },
    );
  }

  /** Every write the page made, oldest first. */
  writes(): RecordedWrite[] {
    return [...this.recorded];
  }

  /** The calls the spec did not expect; the shared fixture fails the spec when there are any. */
  unexpected(): string[] {
    return [...this.refused];
  }

  private receive(report: Report): void {
    if (report.kind === 'request') {
      this.requested.push(report.options);
    } else if (report.kind === 'subscribe') {
      this.order.push(`subscribe ${report.characteristic}`);
    } else if (report.kind === 'write') {
      this.order.push(`write ${report.characteristic} ${report.hex}`);
      this.recorded.push({
        characteristic: report.characteristic,
        hex: report.hex,
        withResponse: report.withResponse,
      });
    } else {
      this.refused.push(report.call);
    }
  }
}

/** Takes `navigator.bluetooth` away, the browser's own and the fake. It must not close over anything outside itself. */
function removeFromPage(): void {
  delete (navigator as unknown as { bluetooth?: unknown }).bluetooth;
  delete (Navigator.prototype as unknown as { bluetooth?: unknown }).bluetooth;
}

/** Runs in the page before any app script. It must not close over anything outside itself. */
function installInPage(): void {
  type Bike = { name: string; services: Record<string, string[]> };
  const report = (window as unknown as { __fakeBluetoothReport(r: unknown): Promise<void> })
    .__fakeBluetoothReport;
  const offered = (): Bike | undefined => (window as unknown as { __fakeBike?: Bike }).__fakeBike;
  const refuse = async (call: string): Promise<never> => {
    await report({ kind: 'unexpected', call });
    throw new DOMException(`Unexpected Bluetooth call: ${call}`, 'NotFoundError');
  };
  /** Reports any member the fake does not implement; `then` and symbols are probes, not calls. */
  const strict = <T extends object>(target: T, name: string): T =>
    new Proxy(target, {
      get(object, key) {
        if (typeof key === 'symbol' || key === 'then' || key in object) {
          const value = Reflect.get(object, key, object) as unknown;
          return typeof value === 'function' ? value.bind(object) : value;
        }
        void report({ kind: 'unexpected', call: `${name}.${key}` });
        return undefined;
      },
    });
  const hex = (value: BufferSource): string =>
    Array.from(
      ArrayBuffer.isView(value)
        ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
        : new Uint8Array(value),
      (b) => b.toString(16).toUpperCase().padStart(2, '0'),
    ).join(' ');

  const subscriptions = new Map<string, EventTarget[]>();
  const characteristic = (uuid: string) => {
    const write = async (value: BufferSource, withResponse: boolean) =>
      report({ kind: 'write', characteristic: uuid, hex: hex(value), withResponse });
    const c = Object.assign(new EventTarget(), {
      uuid,
      value: null as DataView | null,
      startNotifications: async () => {
        await report({ kind: 'subscribe', characteristic: uuid });
        subscriptions.set(uuid, [...(subscriptions.get(uuid) ?? []), c]);
        return c;
      },
      stopNotifications: async () => {
        subscriptions.set(
          uuid,
          (subscriptions.get(uuid) ?? []).filter((s) => s !== c),
        );
        return c;
      },
      writeValueWithResponse: (value: BufferSource) => write(value, true),
      writeValueWithoutResponse: (value: BufferSource) => write(value, false),
    });
    return strict(c, 'characteristic');
  };
  const device = (bike: Bike) => {
    const server = {
      connected: false,
      device: null as unknown,
      connect: async () => {
        server.connected = true;
        return gatt;
      },
      disconnect: () => {
        server.connected = false;
      },
      getPrimaryService: async (uuid: string) => {
        const characteristics = bike.services[uuid];
        if (!characteristics) return refuse(`getPrimaryService(${uuid})`);
        return strict(
          {
            uuid,
            getCharacteristic: async (c: string) =>
              characteristics.includes(c) ? characteristic(c) : refuse(`getCharacteristic(${c})`),
          },
          'service',
        );
      },
    };
    const gatt = strict(server, 'gatt');
    const d = strict(
      Object.assign(new EventTarget(), { id: 'fake-bike', name: bike.name, gatt }),
      'device',
    );
    server.device = d;
    return d;
  };

  const bluetooth = strict(
    Object.assign(new EventTarget(), {
      requestDevice: async (options: unknown) => {
        await report({ kind: 'request', options: JSON.parse(JSON.stringify(options)) });
        const mode = (window as unknown as { __fakeChooser?: string | null }).__fakeChooser;
        if (mode === 'cancel')
          throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
        if (mode === 'block')
          throw new DOMException(
            'requestDevice() is disallowed by permissions policy.',
            'SecurityError',
          );
        const bike = offered();
        return bike ? device(bike) : refuse('requestDevice');
      },
      getDevices: async () => {
        const bike = offered();
        return bike ? [device(bike)] : refuse('getDevices');
      },
    }),
    'bluetooth',
  );
  Object.defineProperty(navigator, 'bluetooth', { value: bluetooth, configurable: true });
  Object.assign(window, {
    __fakeBluetooth: {
      notify: (uuid: string, bytes: number[]) => {
        for (const c of subscriptions.get(uuid) ?? []) {
          (c as unknown as { value: DataView }).value = new DataView(Uint8Array.from(bytes).buffer);
          c.dispatchEvent(new Event('characteristicvaluechanged'));
        }
      },
    },
  });
}
