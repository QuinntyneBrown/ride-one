import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  ANNOUNCER,
  BIKE_CONNECTION,
  COURSE_GRAPHICS,
  type ClassDefinition,
  type ClassResult,
  HOW_TO_RIDE,
  RIDE_ACTIVITY,
  RIDE_MUSIC,
  RIDE_RECORD,
  SCREEN_WAKE_LOCK,
  THE_CLASS,
  TICKER,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import {
  BikeTelemetry,
  PowerModel,
  ResistanceController,
  RideClock,
  EffortTally,
  RideRecorder,
  RideTicker,
  VideoClockSync,
  VideoStallWatch,
  WorkoutEngine,
  rideWith,
} from '@telo/domain';
import { classStepAnnouncement } from '../rides/step-announcement';
import { lostBikeMessage, pauseAnnouncement, rideHold } from './ride-hold';
import { type StatView, cadenceStat, powerStat } from './stat-view';

/**
 * The solo class ride's state (docs/detailed-designs/class-ride/ride-the-class), provided by the page so it goes when the
 * rider leaves. It reads the class from `THE_CLASS` and how the rider chose to ride it, and starts the ride at once,
 * whichever way: the clock, the ticker and the engine following the plan, which sends each segment's level (L2-027,
 * L2-175 AC1). In Ibiza no video player is loaded (L2-174 AC1), and the course's box loads until its first frame is
 * drawn. The header and the segment card read
 * the ticker's whole seconds (L2-134 AC2); Power and Cadence read the bike's telemetry as it arrives (AC1). The class
 * video plays from the ride clock plus the class's sync offset (L2-088 AC1) and, on each tick, seeks back when it has
 * drifted more than 1.5 s (AC2); when it cannot play, or has not played for 10 s of the ride, the ride carries on
 * without it and the notice says so (AC4). A bike that refuses control is set by hand, and is sent nothing (L2-014 AC3). The rider pauses and
 * resumes it (docs/detailed-designs/class-ride/pause-leave-or-finish-the-class, L2-091), each said once to a screen
 * reader; a lost bike holds it until the bike is back, when the segment's level is sent again
 * (docs/detailed-designs/class-ride/wait-for-a-lost-bike, L2-092); the screen stays awake while it runs (L2-133 AC3);
 * and at the class length it opens Class Done. Once the rider leaves or the ride finishes, the connection forgets the
 * ride's target, so no resistance command follows it (L2-093 AC3).
 */
@Injectable()
export class ClassRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly resistance = inject(ResistanceController);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly loaded = signal<ClassDefinition | null>(null);
  private readonly sync = inject(VideoClockSync);
  private readonly stall = inject(VideoStallWatch);
  private readonly stalled = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private readonly pausedByRider = signal(false);
  private readonly pausedByBike = signal(false);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly beat = inject(TICKER);
  private readonly router = inject(Router);
  private readonly announcer = inject(ANNOUNCER);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly music = inject(RIDE_MUSIC);
  private readonly rideRecord = inject(RIDE_RECORD);
  /** Whether a ride is in progress, so a new version of the app waits for its end (L2-150 AC2). */
  private readonly activity = inject(RIDE_ACTIVITY);
  private readonly started = signal(false);
  /** The ride's output and share on target, for Class Done. */
  private recorder: RideRecorder | null = null;
  /** The watts of each effort, a sum for each work segment of the plan (L2-169). */
  private efforts: EffortTally | null = null;
  private lastSecond = 0;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  /**
   * How the ride is ridden, as the rider chose on The Class (L2-173 AC5): with the class video, or in Ibiza. A browser
   * that cannot draw the course rides with the class video (AC6).
   */
  readonly way = rideWith(inject(HOW_TO_RIDE).kept(), inject(COURSE_GRAPHICS).available());
  /** What the lost-bike alert says is paused: the video, or in Ibiza the ride (L2-092 AC1). */
  readonly lostBody = lostBikeMessage(this.way);
  private readonly courseShown = signal(false);
  /** Whether the course's first frame has been drawn; until then its box reads "Loading …" (L2-175 AC1). */
  readonly courseDrawn = this.courseShown.asReadonly();
  private readonly courseFailed = signal(false);
  /** Whether the course cannot be drawn: its still stays and a notice says so (L2-175 AC2). */
  readonly courseUnavailable = this.courseFailed.asReadonly();
  readonly ride = this.loaded.asReadonly();
  readonly elapsed = this.ticker.second;
  /** Where the plan stands. */
  readonly plan = this.engine.state;
  readonly level = this.telemetry.resistance;
  readonly canControl = this.resistance.canControl;
  /** Whether the bike refused control of its resistance, so the rider sets it by hand (L2-014 AC3). */
  readonly byHand = this.resistance.byHand;
  /** Whether the rider paused the ride: the clock, the plan and the video hold (L2-091 AC1). */
  readonly paused = this.pausedByRider.asReadonly();
  /** Whether the bike has stopped answering (`ble` disconnected, L2-017); the ride waits for it (L2-092 AC4). */
  readonly bikeLost = computed(() => this.connection.ble() === 'disconnected');
  /** Which of its four states the ride is in, and what the screen shows for it (L2-091, L2-092). */
  readonly state = computed(() =>
    rideHold({ pausedByRider: this.pausedByRider(), bikeLost: this.bikeLost() }),
  );
  /** Whether the ride runs: started, and held neither by the rider nor by a lost bike; the course moves while it does. */
  readonly running = computed(() => this.started() && this.state().running);
  /** The bike's speed, which turns the pedals of the course's rider; the clock places them (L2-174 AC2). */
  readonly speedKmh = this.telemetry.speedKmh;
  /**
   * Whether the video cannot play: its code or YouTube's did not load, the player failed, or it has not played for
   * 10 s of the ride, as with no network (L2-088 AC4). A video that plays again can.
   */
  readonly videoUnavailable = computed(
    () => this.playerMissing() || this.player()?.state() === 'error' || this.stalled(),
  );

  /** Power against the segment's target power: "On target" within 10 %, otherwise the signed difference (L2-089 AC2). */
  readonly power = computed<StatView>(() =>
    powerStat(this.telemetry.powerW(), this.plan()?.targetPower ?? null),
  );

  /** Cadence with the segment's aim (L2-089 AC3). */
  readonly cadence = computed<StatView>(() =>
    cadenceStat(this.telemetry.cadence(), this.plan()?.segment.cadenceAim),
  );

  constructor() {
    // Each segment, said once as it starts, in the segment card's words (L2-141 AC2).
    const announcer = this.announcer;
    const step = computed(() => this.engine.state()?.index ?? null);
    effect(() => {
      if (step() === null) return;
      const segment = untracked(() => this.engine.state()?.segment);
      if (segment) announcer.announce(classStepAnnouncement(segment));
    });
    // The music plays through a ride in Ibiza and holds with it, as the course does (L2-176 AC1, AC4); a ride with the
    // class video has its own sound and no music (AC3).
    if (this.way === 'ibiza') {
      effect(() => (this.running() && this.music.on() ? this.music.play() : this.music.pause()));
    }
    this.start(inject(THE_CLASS).get());
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      // The connection outlives the ride: it must not send this ride's level after a later reconnect (L2-093 AC3).
      this.connection.forgetTarget();
      this.player()?.destroy();
      // The lock is bound on the route, whose injector outlives the page.
      this.wakeLock.release();
      this.music.release();
      this.activity.end();
    });
  }

  /** The "Music" toggle: pressed while the music is on, disabled once it cannot be played (L2-176 AC5, AC7). */
  readonly musicOn = this.music.on;
  readonly musicAvailable = this.music.available;

  toggleMusic(): void {
    this.music.toggle();
  }

  /** Plays the class video in `host`, the frame the page renders once the class has arrived; called once. */
  playVideo(host: HTMLElement): void {
    const ride = this.loaded();
    if (!ride || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player.set(player);
        void player.load(host, ride.video.videoId, {
          startSeconds: ride.video.syncOffsetSeconds + this.clock.elapsedMs() / 1000,
          controls: false,
          autoplay: true,
          title: ride.title,
        });
      },
      () => this.playerMissing.set(true),
    );
  }

  /** The course's files could not be loaded, were malformed, or its graphics context was lost for good. */
  failCourse(): void {
    this.courseFailed.set(true);
  }

  /** The course's first frame has been drawn: it takes the box from its still (L2-175 AC1, AC3). */
  showCourse(): void {
    this.courseShown.set(true);
  }

  /** Holds the clock, the plan and the video where they are, and says so once (L2-091 AC1, AC3, L2-088 AC3). */
  pause(): void {
    if (this.pausedByRider() || this.bikeLost()) return;
    this.pausedByRider.set(true);
    this.announcer.announce(pauseAnnouncement(true));
    if (!this.pausedByBike()) this.hold();
  }

  /**
   * Carries the ride on from where it was held, with the video back on the clock, and says so once (L2-091 AC2, AC3).
   * Not while the bike is lost: only the bike coming back ends that hold (L2-092 AC2).
   */
  resume(): void {
    const ride = this.loaded();
    if (!this.pausedByRider() || this.bikeLost() || !ride) return;
    this.pausedByRider.set(false);
    this.announcer.announce(pauseAnnouncement(false));
    if (!this.pausedByBike()) this.carryOn(ride);
  }

  /** Tries the lost bike at once, rather than at the connection's next retry: the alert's Reconnect. */
  reconnect(): void {
    this.connection.reconnectNow();
  }

  raise(): void {
    void this.resistance.nudge(1);
  }

  lower(): void {
    void this.resistance.nudge(-1);
  }

  /** The ride starts at once, always solo (ADR 0038). */
  private start(dto: ClassDefinition): void {
    this.loaded.set(dto);
    this.started.set(true);
    this.recorder = new RideRecorder();
    this.efforts = new EffortTally(dto.plan.segments);
    this.wakeLock.hold();
    this.activity.begin();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(dto.plan);
    this.ticker.ticks.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((second) => {
      this.record(Math.min(second, dto.lengthSeconds));
      if (second >= dto.lengthSeconds) return this.finish(dto);
      // A ride in Ibiza has no video to stall (L2-174 AC1).
      if (this.way === 'video')
        this.stalled.set(this.stall.check(this.player()?.state() ?? 'loading', second));
      this.syncVideo(dto);
    });
    // The bike is watched on a beat of its own: the ride clock's ticks stop while the ride is held.
    this.beat.seconds
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.followBike(dto));
  }

  /**
   * The ride waits for a lost bike: checked once a second, it holds within a second of the drop and carries on
   * within a second of the bike's return, unless the rider had paused it before (L2-092 AC4). The alert shows at once.
   * When the bike is back the current segment's level is sent again, after the target the connection kept and sent
   * first (L2-017 AC4, L2-027 AC4, L2-092 AC3), whether or not the rider had paused.
   */
  private followBike(ride: ClassDefinition): void {
    const lost = this.bikeLost();
    if (lost === this.pausedByBike()) return;
    this.pausedByBike.set(lost);
    if (!lost) this.engine.resend();
    if (this.pausedByRider()) return;
    if (lost) this.hold();
    else this.carryOn(ride);
  }

  /**
   * The plan's end: the clock stops at the class length, the video pauses, and Class Done opens with the class's result
   * in the navigation's state (L2-093 AC2, L2-078 AC1). The ride is sent nowhere (L2-132 AC3, ADR 0039). Leaving the
   * page releases the rest.
   */
  private finish(ride: ClassDefinition): void {
    this.clock.pause();
    this.ticker.stop();
    this.player()?.pause();
    this.wakeLock.release();
    this.music.release();
    this.activity.end();
    this.connection.forgetTarget();
    // The best before this ride is counted: Class Done compares with it, and a reload still does (L2-077).
    const previousBestKj = this.rideRecord.read().bestKj;
    const classResult: ClassResult = {
      classId: ride.id,
      title: ride.title,
      elapsedSeconds: ride.lengthSeconds,
      outputKj: this.recorder?.outputKj ?? 0,
      onTargetShare: this.recorder?.onTargetShare ?? 0,
      previousBestKj,
      efforts: this.efforts?.watts() ?? [],
    };
    // Only a ride that reaches its end is counted (L2-168 AC1, AC2).
    this.rideRecord.add(classResult.outputKj);
    void this.router.navigateByUrl('/done', { state: { classResult } });
  }

  /**
   * Each second ridden at the bike's power (L2-022 AC2), on target when the power is within 10 % of the
   * segment's target (L2-037 AC3); seconds a hidden tab skipped count at those of the moment, and a held ride's clock
   * does not tick.
   */
  private record(second: number): void {
    const power = this.telemetry.powerW();
    const target = this.plan()?.targetPower ?? null;
    const onTarget = power !== null && target !== null && PowerModel.onTarget(power, target);
    this.recorder?.record(power, second - this.lastSecond, onTarget);
    this.efforts?.add(power, this.lastSecond, second);
    this.lastSecond = second;
  }

  private hold(): void {
    this.clock.pause();
    this.player()?.pause();
  }

  private carryOn(ride: ClassDefinition): void {
    this.clock.resume();
    const player = this.player();
    player?.seekTo(ride.video.syncOffsetSeconds + this.clock.elapsedMs() / 1000);
    player?.play();
  }

  private syncVideo(ride: ClassDefinition): void {
    const player = this.player();
    if (player?.state() !== 'playing') return;
    // A player that became ready during a pause starts playing on its own; it follows the pause instead.
    if (this.pausedByRider() || this.pausedByBike()) return player.pause();
    const elapsed = this.clock.elapsedMs() / 1000;
    const seek = this.sync.check(player.currentTime(), elapsed, ride.video.syncOffsetSeconds);
    if (seek !== null) player.seekTo(seek);
  }
}
