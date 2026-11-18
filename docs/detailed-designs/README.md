# Wattzup detailed designs

This tree holds the detailed designs for the Wattzup rewrite: an ASP.NET Core (.NET) backend and an Angular frontend. Each feature is a vertical slice with its own `README.md` and rendered diagrams, and traces to the level-2 requirements in [`docs/specs/L2.md`](../specs/L2.md).

| Subsystem | Feature | L2 requirements |
|---|---|---|
| bike-connectivity | [Discover and connect the bike](bike-connectivity/discover-and-connect-bike/README.md) | `L2-001`, `L2-002`, `L2-039` |
|  | [Maintain the bike connection](bike-connectivity/maintain-bike-connection/README.md) | `L2-003`, `L2-004` |
|  | [Bluetooth platform transports](bike-connectivity/bluetooth-platform-transports/README.md) | `L2-043` |
|  | [List nearby machines](bike-connectivity/list-nearby-machines/README.md) | `L2-074` |
| telemetry | [Decode bike telemetry](telemetry/decode-bike-telemetry/README.md) | `L2-005`, `L2-006`, `L2-007` |
|  | [Estimate power and ride totals](telemetry/estimate-power-and-totals/README.md) | `L2-049` |
|  | [Log raw packets](telemetry/log-raw-packets/README.md) | `L2-030`, `L2-057` |
| resistance-control | [Set resistance](resistance-control/set-resistance/README.md) | `L2-008`, `L2-009`, `L2-016`, `L2-020`, `L2-047` |
|  | [Show resistance](resistance-control/show-resistance/README.md) | `L2-019` |
|  | [Log resistance commands](resistance-control/log-resistance-commands/README.md) | `L2-048` |
| workouts | [Start and stop a workout](workouts/start-and-stop-workout/README.md) | `L2-010`, `L2-017`, `L2-046` |
|  | [Run an interval workout](workouts/run-interval-workout/README.md) | `L2-011`, `L2-012`, `L2-013`, `L2-045`, `L2-060` |
|  | [Set up a ride](workouts/set-up-ride/README.md) | `L2-010`, `L2-029`, `L2-052`, `L2-059`, `L2-080` |
|  | [Show the workout countdown](workouts/show-workout-countdown/README.md) | `L2-024`, `L2-025` |
|  | [Play workout cues](workouts/play-workout-cues/README.md) | `L2-027` |
|  | [Ride along to a video](workouts/ride-along-video/README.md) | `L2-076`, `L2-010`, `L2-014`, `L2-029`, `L2-036`, `L2-059` |
| live-state | [Stream live state](live-state/stream-live-state/README.md) | `L2-014`, `L2-015`, `L2-032`, `L2-037` |
|  | [Serve the power trace](live-state/serve-power-trace/README.md) | `L2-050` |
|  | [Persist the status snapshot](live-state/persist-status-snapshot/README.md) | `L2-031` |
| dashboard | [Show connection status](dashboard/show-connection-status/README.md) | `L2-018`, `L2-054`, `L2-058` |
|  | [Show live metrics](dashboard/show-live-metrics/README.md) | `L2-021`, `L2-022`, `L2-026`, `L2-028`, `L2-076` |
|  | [Responsive and accessible layout](dashboard/responsive-accessible-layout/README.md) | `L2-040`, `L2-041`, `L2-061` |
|  | [Dialogs and notifications](dashboard/dialogs-and-notifications/README.md) | `L2-023`, `L2-051`, `L2-053` |
|  | [Unlock and not-found pages](dashboard/unlock-and-not-found/README.md) | `L2-055`, `L2-056` |
| treadmill | [Choose the machine](treadmill/choose-machine/README.md) | `L2-062`, `L2-063`, `L2-070`, `L2-073`, `L2-075` |
|  | [Decode treadmill telemetry](treadmill/decode-treadmill-telemetry/README.md) | `L2-064` |
|  | [Control speed and incline](treadmill/control-speed-and-incline/README.md) | `L2-065`, `L2-069` |
|  | [Control the belt](treadmill/control-the-belt/README.md) | `L2-066` |
|  | [Run a treadmill workout](treadmill/run-treadmill-workout/README.md) | `L2-067`, `L2-068` |
|  | [Treadmill dashboard and setup](treadmill/treadmill-dashboard-and-setup/README.md) | `L2-071`, `L2-072` |
| classes | [Browse the class library](classes/browse-classes/README.md) | `L2-077`, `L2-078`, `L2-079`, `L2-036`, `L2-073` |
|  | [Ride a class](classes/ride-a-class/README.md) | `L2-080`, `L2-078`, `L2-010`, `L2-029`, `L2-052`, `L2-059`, `L2-076` |
| history | [Record a session](history/record-session/README.md) | `L2-081`, `L2-082`, `L2-014`, `L2-051` |
|  | [Review a session](history/review-session/README.md) | `L2-083`, `L2-084`, `L2-085`, `L2-087`, `L2-051`, `L2-058` |
|  | [Track progress](history/track-progress/README.md) | `L2-086`, `L2-087`, `L2-083`, `L2-079` |
| platform | [Secure the API](platform/secure-api/README.md) | `L2-034`, `L2-035`, `L2-036`, `L2-078` |
|  | [Observability and resource use](platform/observability-and-resources/README.md) | `L2-033`, `L2-038` |
|  | [Host and solution structure](platform/host-and-structure/README.md) | `L2-042`, `L2-044` |
