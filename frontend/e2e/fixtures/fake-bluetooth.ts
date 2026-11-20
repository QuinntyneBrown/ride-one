// A fake navigator.bluetooth, installed before the app loads (AGENTS.md).
// It records every call and write, answers the device chooser as the spec says, and has no other
// member, so an unexpected Bluetooth call throws in the page and fails the spec.
import type { Page } from '@playwright/test';

export type ChooserAnswer = 'pick' | 'cancel' | 'blocked';

export interface BluetoothCall {
  name: string;
  at: number;
  args?: unknown;
}

interface Control {
  chooser: ChooserAnswer;
  /** What `getAvailability()` answers: false when the device has no Bluetooth radio turned on. */
  available: boolean;
  /** Changes the answer and fires `availabilitychanged`, as when the rider switches Bluetooth. */
  setAvailable(value: boolean): void;
  deviceName: string;
  calls: BluetoothCall[];
  /** Sends a frame from the bike on every subscribed characteristic. */
  notify(hex: string): void;
  /** The bike drops the link: `gattserverdisconnected` on the device picked. */
  drop(): void;
  /** Offers `getDevices()`, answering the bike as chosen on an earlier visit (L2-090 AC5). */
  rememberBike(): void;
  /** The remembered bike advertises: `advertisementreceived` while it is watched. */
  advertise(): void;
}

/** Runs in the page before any app script. */
function installFakeBluetooth(): void {
  const subscribed: EventTarget[] = [];
  let picked: (EventTarget & { gatt: { connected: boolean } }) | null = null;
  const control: Control = {
    chooser: 'pick',
    available: true,
    setAvailable: (value) => {
      control.available = value;
      const event = Object.assign(new Event('availabilitychanged'), { value });
      bluetooth.dispatchEvent(event);
    },
    deviceName: 'ECHEX-3-141844',
    calls: [],
    rememberBike: () => undefined,
    advertise: () => undefined,
    notify: (text) => {
      const bytes = Uint8Array.from(text.split(' ').map((b) => parseInt(b, 16)));
      for (const c of subscribed) {
        (c as unknown as { value: DataView }).value = new DataView(bytes.buffer);
        c.dispatchEvent(new Event('characteristicvaluechanged'));
      }
    },
    drop: () => {
      if (!picked) return;
      picked.gatt.connected = false;
      subscribed.length = 0;
      picked.dispatchEvent(new Event('gattserverdisconnected'));
    },
  };
  control.rememberBike = () => {
    const known = device();
    let watching = false;
    Object.assign(known, {
      watchAdvertisements: async () => {
        record('watchAdvertisements');
        watching = true;
      },
      get watchingAdvertisements() {
        return watching;
      },
    });
    control.advertise = () => {
      if (watching) known.dispatchEvent(new Event('advertisementreceived'));
    };
    Object.assign(bluetooth, {
      getDevices: async () => {
        record('getDevices');
        return [known];
      },
    });
  };
  control.advertise = () => undefined;
  (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth = control;
  const record = (name: string, args?: unknown): void => {
    control.calls.push({ name, at: performance.now(), args });
  };
  const hex = (value: BufferSource): string =>
    Array.from(
      value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      (b) => b.toString(16).toUpperCase().padStart(2, '0'),
    ).join('');

  // As Chrome: one GATT operation at a time; a write while another is in flight fails.
  let writing = false;
  const write = async (name: string, value: BufferSource): Promise<void> => {
    if (writing) throw new DOMException('GATT operation already in progress.', 'NetworkError');
    writing = true;
    await new Promise((resolve) => setTimeout(resolve, 5));
    writing = false;
    record(name, hex(value));
  };

  const characteristic = (uuid: string) => {
    const c = Object.assign(new EventTarget(), {
      uuid,
      value: null as DataView | null,
      startNotifications: async () => {
        record('startNotifications', uuid);
        subscribed.push(c);
        return c;
      },
      writeValueWithResponse: (value: BufferSource) => write('writeWithResponse', value),
      writeValueWithoutResponse: (value: BufferSource) => write('writeWithoutResponse', value),
    });
    return c;
  };

  const device = () => {
    const server = {
      connected: false,
      device: null as unknown,
      connect: async () => {
        record('gatt.connect');
        server.connected = true;
        return server;
      },
      disconnect: () => {
        record('gatt.disconnect');
        server.connected = false;
      },
      getPrimaryService: async (uuid: string) => {
        record('getPrimaryService', uuid);
        return {
          uuid,
          getCharacteristic: async (c: string) => {
            record('getCharacteristic', c);
            return characteristic(c);
          },
        };
      },
    };
    const d = Object.assign(new EventTarget(), {
      id: 'fake-bike',
      name: control.deviceName,
      gatt: server,
    });
    server.device = d;
    picked = d;
    return d;
  };

  const bluetooth = Object.assign(new EventTarget(), {
    getAvailability: async () => {
      record('getAvailability');
      return control.available;
    },
    requestDevice: async (options: unknown) => {
      record('requestDevice', options);
      if (control.chooser === 'cancel') {
        throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
      }
      if (control.chooser === 'blocked') {
        throw new DOMException(
          'Must be handling a user gesture to show a permission request.',
          'SecurityError',
        );
      }
      return device();
    },
  });
  Object.defineProperty(navigator, 'bluetooth', { value: bluetooth, configurable: true });
}

export class FakeBluetooth {
  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.addInitScript(installFakeBluetooth);
  }

  /** Before the page loads: a browser without Web Bluetooth, such as Safari or Firefox. */
  async removeBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      // Shadow Chromium's own navigator.bluetooth, as a browser without Web Bluetooth has none.
      Object.defineProperty(navigator, 'bluetooth', { value: undefined, configurable: true });
    });
  }

  /** Before the page loads: a page on plain http, where Chromium hides Web Bluetooth. */
  async insecureBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      // Shadow Chromium's own navigator.bluetooth, as a browser without Web Bluetooth has none.
      Object.defineProperty(navigator, 'bluetooth', { value: undefined, configurable: true });
      Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    });
  }

  /** Before the page loads: no Bluetooth radio turned on. */
  async unavailableBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.available = false;
    });
  }

  /** Before the page loads: the bike was chosen on an earlier visit, and the browser offers
   * `getDevices()` to find it again (L2-090 AC5). */
  async rememberBikeBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.rememberBike();
    });
  }

  /** The remembered bike advertises, as when the rider wakes it. */
  async advertise(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.advertise();
    });
  }

  /** The rider turns Bluetooth on or off; the page hears `availabilitychanged`. */
  async setAvailable(value: boolean): Promise<void> {
    await this.page.evaluate((v) => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.setAvailable(v);
    }, value);
  }

  /** How the browser's device chooser answers the next request. */
  async answerChooser(answer: ChooserAnswer): Promise<void> {
    await this.page.evaluate((a) => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.chooser = a;
    }, answer);
  }

  /** Sends a frame from the bike, as space-separated hex bytes (`F0 D2 01 12 D5`). */
  async notify(hex: string): Promise<void> {
    await this.page.evaluate((h) => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.notify(h);
    }, hex);
  }

  /** The bike drops the link, as when it shuts off or goes out of range. */
  async drop(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.drop();
    });
  }

  /** How many times the page called `name`. */
  async count(name: string): Promise<number> {
    return (await this.calls()).filter((c) => c.name === name).length;
  }

  /** Every Bluetooth call the page made, in order. */
  calls(): Promise<BluetoothCall[]> {
    return this.page.evaluate(
      () => (window as unknown as { __fakeBluetooth: Control }).__fakeBluetooth.calls,
    );
  }

  /** The calls that reach for a device, leaving out `getAvailability()`, which only asks whether
   * Bluetooth is on (L2-089) and requests nothing. */
  async deviceCalls(): Promise<BluetoothCall[]> {
    return (await this.calls()).filter((c) => c.name !== 'getAvailability');
  }

  /** The bytes written to the bike, as upper-case hex, with how they were written. */
  async writes(): Promise<BluetoothCall[]> {
    return (await this.calls()).filter((c) => c.name.startsWith('write'));
  }
}
