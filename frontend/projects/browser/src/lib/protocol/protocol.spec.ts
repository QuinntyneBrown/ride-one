// Unit Test
// Traces to: L2-001, L2-002, L2-003, L2-005, L2-006, L2-007, L2-008, L2-092
// Description: The Echelon protocol (frames, commands, checksum, decoder, device filter, speed),
// one case per table row.
import { checksum, INIT_SEQUENCE, KEEPALIVE, setResistance } from './echelon-commands';
import { BIKE_FILTER, matchesBike } from './echelon-device-filter';
import { ECHELON_UUIDS } from './echelon-uuids';
import { decode } from './packet-decoder';

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
const bytes = (text: string): Uint8Array =>
  Uint8Array.from(text.split(' ').map((b) => parseInt(b, 16)));

describe('EchelonCommands', () => {
  it.each([
    [1, 'F0B10101A3'],
    [12, 'F0B1010CAE'],
    [32, 'F0B10120C2'],
  ])('set resistance %i appends the checksum: %s', (level, expected) => {
    expect(hex(setResistance(level))).toBe(expected);
  });

  it('the init sequence is device info, resistance range, then start stream', () => {
    expect(INIT_SEQUENCE.map(hex)).toEqual(['F0A10091', 'F0A30093', 'F0B00101A2']);
  });

  it('the keepalive is F0 A0 01 01 92', () => {
    expect(hex(KEEPALIVE)).toBe('F0A0010192');
  });

  it.each([0, 33])('set resistance rejects level %i, outside 1 to 32', (level) => {
    expect(() => setResistance(level)).toThrow(RangeError);
  });

  it('the checksum is the sum of the bytes masked to 8 bits', () => {
    expect(checksum(Uint8Array.of(0xf0, 0xb1, 0x01, 0x20))).toBe(0xc2);
  });

  it('the connection id is the first 8 hex digits of the service', () => {
    expect(ECHELON_UUIDS.connectionId).toBe('0bf669f1');
  });
});

describe('EchelonDeviceFilter', () => {
  it.each<[string | null, string[], boolean]>([
    ['ECHEX-3-141844', [], true],
    ['echex-3', [], true],
    [null, ['0BF669F1-45F2-11E7-9598-0800200C9A66'], true],
    ['Peloton', [], false],
    ['Peloton', ['0000180d-0000-1000-8000-00805f9b34fb'], false],
    [null, [], false],
    ['STRIDE-8s22-000766', [], false],
    ['STRIDE-8s22-000766', ['0bf669f1-45f2-11e7-9598-0800200c9a66'], false],
    [null, ['0bf669f0-45f2-11e7-9598-0800200c9a66'], false],
  ])('matches(%s, %j) is %s', (name, services, expected) => {
    expect(matchesBike(name, services)).toBe(expected);
  });

  it("asks the browser's chooser for ECH names or the Echelon service, never a STRIDE (L2-090 AC2)", () => {
    expect(BIKE_FILTER).toEqual({
      filters: [
        { namePrefix: 'ECH' },
        { namePrefix: 'Ech' },
        { namePrefix: 'ech' },
        { services: [ECHELON_UUIDS.service] },
      ],
      exclusionFilters: [{ namePrefix: 'STRIDE' }],
      optionalServices: [ECHELON_UUIDS.service],
    });
  });
});

describe('PacketDecoder', () => {
  it.each([
    ['F0 D2 01', 'shorter than 4 bytes'],
    ['E0 D2 01 0C CF', 'first byte is not 0xF0'],
    ['F0 D0 01 01 C2', 'unknown type'],
    ['F0 D1 09 00 05 00 00 00 00 00 50 00', '0xD1 of 12 bytes'],
  ])('%s decodes to nothing (%s)', (frame) => {
    expect(decode(bytes(frame))).toBeNull();
  });

  it('a resistance frame carries byte 3', () => {
    expect(decode(bytes('F0 D2 01 0C CF'))).toEqual({ kind: 'resistance', level: 12 });
  });

  it.each([
    ['F0 D1 09 00 05 00 00 00 00 00 50 00 1F', 80, 30.0, 18.6],
    ['F0 D1 09 00 05 00 00 00 00 01 00 00 1F', 256, 96.0, 59.6],
    ['F0 D1 09 00 05 00 00 00 00 00 00 00 1F', 0, 0.0, 0.0],
  ])('%s carries cadence %i and derived speed', (frame, rpm, speedKmh, speedMph) => {
    expect(decode(bytes(frame))).toEqual({ kind: 'cadence', rpm, speedKmh, speedMph });
  });
});
