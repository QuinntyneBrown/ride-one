// Unit Test
// Traces to: L2-048, L2-092
// Description: The command log keeps the 5
// newest entries and acknowledges only matching, unblocked entries.
import { acknowledge, add, type CommandEntry, fail } from './command-log';

const sending = (level: number, writtenMs = 1_000): CommandEntry => ({
  at: writtenMs / 1000,
  ride_seconds: null,
  level,
  source: 'manual',
  status: 'sending',
  ack_ms: null,
});

describe('CommandLog', () => {
  it('add puts the entry first and keeps the 5 newest', () => {
    let log: CommandEntry[] = [];
    for (let level = 1; level <= 6; level++) log = add(log, sending(level));
    expect(log.map((e) => e.level)).toEqual([6, 5, 4, 3, 2]);
  });

  it('acknowledge marks the matching entry ack with its latency', () => {
    const log = acknowledge(add([], sending(22, 1_000)), 22, 1_038);
    expect(log[0]).toMatchObject({ status: 'ack', ack_ms: 38 });
  });

  it('a newer command for another level blocks the older entry', () => {
    const log = acknowledge(add(add([], sending(20)), sending(22)), 20, 1_050);
    expect(log.map((e) => e.status)).toEqual(['sending', 'sending']);
  });

  it('a report for another level acknowledges nothing', () => {
    const log = acknowledge(add([], sending(22)), 12, 1_050);
    expect(log[0].status).toBe('sending');
  });

  it('fail marks only that entry failed', () => {
    const first = sending(20);
    const second = sending(22, 2_000);
    const log = fail(add(add([], first), second), second);
    expect(log.map((e) => e.status)).toEqual(['failed', 'sending']);
  });
});
