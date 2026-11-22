// Unit test
// Traces to: L2-044 AC2; L2-074 AC2, AC3, AC4; L2-125 AC3
// Description: the outbox sends a finished ride once for its ride id and follows it: sending, then recorded with the
// backend's answer; waiting offline when the request never reached the backend, and sent again when the browser is back
// online; not recorded when the backend refused it or failed. It holds the last ten rides, and stops listening for the
// network when it goes.
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RIDES_API, type RideRecordedDto, type SubmitRideRequest } from '@telo/api';
import { Subject } from 'rxjs';
import { SessionRideOutbox } from './session-ride-outbox';

const ride = (rideId: string) =>
  ({ rideId, kind: 'class', classId: 'hiit-cardio-30' }) as SubmitRideRequest;
const answer = (rideId: string) => ({ rideId, xpTotal: 110 }) as RideRecordedDto;

describe('SessionRideOutbox', () => {
  let sent: { ride: SubmitRideRequest; reply: Subject<RideRecordedDto> }[];
  let outbox: SessionRideOutbox;

  beforeEach(() => {
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        SessionRideOutbox,
        {
          provide: RIDES_API,
          useValue: {
            submitRide: (submitted: SubmitRideRequest) => {
              const reply = new Subject<RideRecordedDto>();
              sent.push({ ride: submitted, reply });
              return reply;
            },
          },
        },
      ],
    });
    outbox = TestBed.inject(SessionRideOutbox);
  });

  afterEach(() => TestBed.resetTestingModule());

  const fail = (index: number, status: number) =>
    sent[index].reply.error(new HttpErrorResponse({ status }));

  it('sends a ride, and follows it from sending to recorded with the answer', () => {
    outbox.submit(ride('a'));
    expect(outbox.status('a')()).toEqual({ kind: 'sending' });

    sent[0].reply.next(answer('a'));
    sent[0].reply.complete();

    expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
  });

  it('sends a ride id once, however often it is submitted', () => {
    outbox.submit(ride('a'));
    outbox.submit(ride('a'));
    sent[0].reply.next(answer('a'));
    outbox.submit(ride('a'));

    expect(sent.length).toBe(1);
  });

  it('reads a ride it has not been given as sending', () => {
    expect(outbox.status('unknown')()).toEqual({ kind: 'sending' });
  });

  it('waits offline when the request never reached the backend, and sends it again when the browser is back online', () => {
    outbox.submit(ride('a'));
    fail(0, 0);
    expect(outbox.status('a')()).toEqual({ kind: 'waitingOffline' });

    window.dispatchEvent(new Event('online'));
    expect(sent.length).toBe(2);
    expect(outbox.status('a')()).toEqual({ kind: 'sending' });
    sent[1].reply.next(answer('a'));

    expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
  });

  it('marks a ride the backend refused or failed as not recorded, and never sends it again', () => {
    outbox.submit(ride('a'));
    outbox.submit(ride('b'));
    fail(0, 422);
    fail(1, 500);

    expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
    expect(outbox.status('b')()).toEqual({ kind: 'notRecorded' });
    window.dispatchEvent(new Event('online'));
    outbox.submit(ride('a'));
    expect(sent.length).toBe(2);
  });

  it('holds the last ten rides', () => {
    for (let index = 0; index < 11; index += 1) outbox.submit(ride(`r${index}`));

    outbox.submit(ride('r0'));
    outbox.submit(ride('r10'));
    expect(sent.map((each) => each.ride.rideId)).toEqual([
      ...Array.from({ length: 11 }, (_, index) => `r${index}`),
      'r0',
    ]);
  });

  it('stops listening for the network when it goes', () => {
    outbox.submit(ride('a'));
    fail(0, 0);

    TestBed.resetTestingModule();
    window.dispatchEvent(new Event('online'));

    expect(sent.length).toBe(1);
  });
});
