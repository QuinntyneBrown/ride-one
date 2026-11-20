// The packet log (L2-095): the newest 2,000 lines in memory, in the raw_packets.log format.
import { computed, Injectable, signal } from '@angular/core';
import type { PacketLog as PacketLogContract, PacketLogView } from '@wattzup/api';

export const PACKET_LOG_CAPACITY = 2000;

/** Mirrors RawPacketFormatter.Format: epoch seconds with 3 decimals, then lowercase hex bytes. */
export function formatRawPacket(epochSeconds: number, bytes: Uint8Array): string {
  const seconds = (Math.floor(epochSeconds * 1000 + 1e-6) / 1000).toFixed(3);
  return [seconds, ...Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))].join(' ');
}

@Injectable()
export class PacketLog implements PacketLogContract {
  private readonly ring: string[] = [];
  private readonly _everyPacket = signal(false);
  /** Bumped on each line, so the view recomputes. */
  private readonly revision = signal(0);
  private size = 0;

  readonly everyPacket = this._everyPacket.asReadonly();
  readonly view = computed<PacketLogView>(() => {
    this.revision();
    return { entries: this.ring.length, bytes: this.size, everyPacket: this._everyPacket() };
  });

  setEveryPacket(on: boolean): void {
    this._everyPacket.set(on);
  }

  /** A command written to the bike: always logged. */
  sent(epochMs: number, bytes: Uint8Array): void {
    this.add(epochMs, bytes);
  }

  /** A packet from the bike: logged while every packet is (L2-095 AC4). */
  received(epochMs: number, bytes: Uint8Array): void {
    if (this._everyPacket()) this.add(epochMs, bytes);
  }

  lines(): readonly string[] {
    return this.ring;
  }

  file(): Blob {
    return new Blob(
      this.ring.map((line) => `${line}\n`),
      { type: 'text/plain' },
    );
  }

  private add(epochMs: number, bytes: Uint8Array): void {
    const line = formatRawPacket(epochMs / 1000, bytes);
    this.ring.push(line);
    this.size += line.length + 1;
    if (this.ring.length > PACKET_LOG_CAPACITY) this.size -= this.ring.shift()!.length + 1;
    this.revision.update((r) => r + 1);
  }
}
