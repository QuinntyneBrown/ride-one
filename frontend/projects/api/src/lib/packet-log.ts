// The browser edition's packet log (L2-095): the commands sent to the bike, and every packet while
// Log every packet is on, downloadable in the raw_packets.log format. The backend edition binds
// nothing: its log is a file on the server (L2-030).
import { InjectionToken, type Signal } from '@angular/core';

export interface PacketLogView {
  /** Lines kept, at most 2,000. */
  entries: number;
  /** The size of the log as downloaded, in bytes. */
  bytes: number;
  /** True while every packet is logged, not only the commands sent. */
  everyPacket: boolean;
}

export interface PacketLog {
  readonly view: Signal<PacketLogView>;
  setEveryPacket(on: boolean): void;
  /** The log as a text file, oldest line first. */
  file(): Blob;
}

export const PACKET_LOG = new InjectionToken<PacketLog>('PACKET_LOG');
