// Unit Test
// Traces to: L2-095
// Description: Mirrors RawPacketTests: the raw-log line format and the ring, here of 2,000 lines,
// oldest first; commands are always kept, the bike's packets only while every packet is logged.
import { TestBed } from '@angular/core/testing';
import { formatRawPacket, PACKET_LOG_CAPACITY, PacketLog } from './packet-log';

const log = () => {
  TestBed.configureTestingModule({ providers: [PacketLog] });
  return TestBed.inject(PacketLog);
};

describe('PacketLog', () => {
  it('formats a packet as epoch seconds with 3 decimals and lowercase hex', () => {
    expect(formatRawPacket(1794784639.0213, Uint8Array.of(0xf0, 0xd2, 0x01, 0x0c, 0xcf))).toBe(
      '1794784639.021 f0 d2 01 0c cf',
    );
  });

  it.each([
    [0, 0, null],
    [1, 1, 1],
    [PACKET_LOG_CAPACITY, PACKET_LOG_CAPACITY, 1],
    [PACKET_LOG_CAPACITY + 1, PACKET_LOG_CAPACITY, 2],
  ])('keeps the newest 2,000, oldest first: %i added', (added, count, first) => {
    const l = log();
    for (let i = 1; i <= added; i++) l.sent(i * 1000, Uint8Array.of(0xf0));
    expect(l.lines()).toHaveLength(count);
    expect(l.view().entries).toBe(count);
    if (first !== null) {
      expect(l.lines()[0].startsWith(`${first}.000 `)).toBe(true);
      expect(l.lines().at(-1)!.startsWith(`${added}.000 `)).toBe(true);
    }
  });

  it('keeps the bike’s packets only while every packet is logged', () => {
    const l = log();
    l.received(1000, Uint8Array.of(0xf0, 0xd1));
    expect(l.view().entries).toBe(0);
    l.setEveryPacket(true);
    l.received(2000, Uint8Array.of(0xf0, 0xd1));
    expect(l.lines()).toEqual(['2.000 f0 d1']);
    expect(l.view()).toEqual({ entries: 1, bytes: 12, everyPacket: true });
  });

  it('downloads the lines as raw_packets.log text', async () => {
    const l = log();
    l.sent(1000, Uint8Array.of(0xf0, 0xa0));
    l.sent(2000, Uint8Array.of(0xf0, 0xa1));
    expect(await l.file().text()).toBe('1.000 f0 a0\n2.000 f0 a1\n');
  });
});
