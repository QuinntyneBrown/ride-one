# Wattzup detailed designs

This tree holds the detailed designs for the Wattzup rewrite: an ASP.NET Core (.NET) backend and an Angular frontend. Each feature is a vertical slice with its own `README.md` and rendered diagrams, and traces to the level-2 requirements in [`docs/specs/L2.md`](../specs/L2.md).

| Subsystem | Feature | L2 requirements |
|---|---|---|
| bike-connectivity | [Discover and connect the bike](bike-connectivity/discover-and-connect-bike/README.md) | `L2-001`, `L2-002`, `L2-039` |
| | [Maintain the bike connection](bike-connectivity/maintain-bike-connection/README.md) | `L2-003`, `L2-004` |
| | [Bluetooth platform transports](bike-connectivity/bluetooth-platform-transports/README.md) | `L2-043` |
| telemetry | [Decode bike telemetry](telemetry/decode-bike-telemetry/README.md) | `L2-005`, `L2-006`, `L2-007` |
| | [Log raw packets](telemetry/log-raw-packets/README.md) | `L2-030` |
| resistance-control | [Set resistance](resistance-control/set-resistance/README.md) | `L2-008`, `L2-009`, `L2-016`, `L2-020` |
| | [Show resistance](resistance-control/show-resistance/README.md) | `L2-019` |
| workouts | [Start and stop a workout](workouts/start-and-stop-workout/README.md) | `L2-010`, `L2-017`, `L2-029` |
| | [Run an interval workout](workouts/run-interval-workout/README.md) | `L2-011`, `L2-012`, `L2-013` |
| | [Show the workout countdown](workouts/show-workout-countdown/README.md) | `L2-024`, `L2-025`, `L2-026`, `L2-028` |
| | [Play workout cues](workouts/play-workout-cues/README.md) | `L2-027` |
| live-state | [Stream live state](live-state/stream-live-state/README.md) | `L2-014`, `L2-015`, `L2-032`, `L2-037` |
| | [Persist the status snapshot](live-state/persist-status-snapshot/README.md) | `L2-031` |
| dashboard | [Show connection status](dashboard/show-connection-status/README.md) | `L2-018`, `L2-023` |
| | [Show live metrics](dashboard/show-live-metrics/README.md) | `L2-021`, `L2-022` |
| | [Responsive and accessible layout](dashboard/responsive-accessible-layout/README.md) | `L2-040`, `L2-041` |
| platform | [Secure the API](platform/secure-api/README.md) | `L2-034`, `L2-035`, `L2-036` |
| | [Observability and resource use](platform/observability-and-resources/README.md) | `L2-033`, `L2-038` |
| | [Host and solution structure](platform/host-and-structure/README.md) | `L2-042`, `L2-044` |
