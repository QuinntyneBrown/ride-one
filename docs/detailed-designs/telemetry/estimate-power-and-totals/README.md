# Estimate power and ride totals

## Overview

The ride dashboard leads with power, and shows the ride's average power, distance and energy. The Echelon bike reports none of these. Its frames carry cadence and resistance only (ADR 0003). This feature estimates power from those 2 values and derives the ride totals from the estimate and from speed. The figures are comparable between rides on the same bike, not with a power meter, so the dashboard labels power as an estimate (L2-021).

**estimated power** — `max(0, round(cadence × (0.55 + resistance × 0.155)))` watts, the design's `estimateWatts` (`power`)

**target power** — estimated power at the current segment's cadence aim and level (`target_power`)

**running second** — 1 workout tick while `status` is `running`

**ride totals** — average power (`avg_power`), distance (`distance_km`) and energy (`kcal`) of the current or last workout

**energy** — `round(avg_power × running seconds ÷ 1000 ÷ 0.24 ÷ 4.184)` kilocalories, which assumes 24 % pedalling efficiency

Power follows each telemetry frame. Target power and the totals follow the workout engine's 1 s tick. Heart rate stays in the contract and the layout but is always `null`, because no heart-rate source exists (ADR 0003).

## Description

Backend (`Wattzup.Core`; no rule lives in `Wattzup.Protocol`, the transports or the endpoints):

- **`PowerEstimator`** — static and pure. `EstimateWatts(int? cadence, int? level)` returns `null` when either value is `null` (L2-049). Otherwise it returns `Math.Max(0, (int)Math.Round(cadence × (0.55 + level × 0.155), MidpointRounding.AwayFromZero))`. Away-from-zero rounding matches the design's JavaScript `Math.round` for these non-negative values. Cadence 95 at level 18 gives 317; cadence 98 at level 18 gives 327 (L2-049).
- **`TelemetryIngestor`** (see `decode-bike-telemetry`) — sets `power = EstimateWatts(cadence, resistance)` in the same `BikeStateStore.Update` that applies each decoded frame, so `power` always matches the cadence and resistance it is shown with.
- **`RideTotals`** — immutable record owned by the engine's `WorkoutRun`: `RunningSeconds`, `PowerSum` and `DistanceKm` (unrounded). `Tick(int? power, double? speedKmh)` adds `power ?? 0` to `PowerSum`, adds `(speedKmh ?? 0) ÷ 3600` to `DistanceKm` and adds 1 to `RunningSeconds` (L2-049). Derived values:
  - `AvgPower` — `round(PowerSum ÷ RunningSeconds)`, or `0` before the first running second.
  - `DistanceKmRounded` — `DistanceKm` rounded to 2 decimals.
  - `Kcal` — `round(AvgPower × RunningSeconds ÷ 1000 ÷ 0.24 ÷ 4.184)`. `AvgPower` 208 after 760 running seconds gives 157 (L2-049).
- **`WorkoutEngine`** (see `workouts/run-interval-workout`) — on each running tick it calls `RideTotals.Tick` with the current `power` and `speed_kmh`, and writes `avg_power`, `distance_km`, `kcal` and `target_power` in the tick's 1 `BikeStateStore.Update`:
  - `target_power` is `EstimateWatts(segment.cadence, segment.level)` while `status` is `running`, and `null` otherwise (L2-049).
  - Starting a workout replaces the run, so the totals reset to `0`, `0.00` and `0` (L2-049, L2-013).
  - Ending or stopping a workout leaves the last totals in the state until the next start (L2-049).
  - Before any workout has started, the 3 totals are `null` (L2-014). The dashboard shows them as `0`, `0.00` and `0` (L2-022, see `dashboard/show-live-metrics`).
- **`BikeState.HeartRate`** — always `null`. No transport and no Core service writes it (L2-049, ADR 0003).

Frontend: the power readout, its delta to the target and the totals strip belong to `dashboard/show-live-metrics` (L2-021, L2-022). The setup preview's expected power and energy (L2-059) use a TypeScript twin of `EstimateWatts` in `frontend/src/app/core/`, tested against the same table of cases as `PowerEstimator`.

Verification:

- `Wattzup.Core.Tests` — `PowerEstimator` table: (95, 18) → 317; (98, 18) → 327; (`null`, 18) → `null`; (95, `null`) → `null`; (0, 18) → 0. `RideTotals` table: the 760 s case giving `kcal` 157; `null` power counted as 0; distance from `speed_kmh` ÷ 3600; reset on start; values kept on stop.
- `Wattzup.Api.AcceptanceTests` — with `SimulatedBikeTransport` and `FakeTimeProvider`, a started workout advanced by 10 ticks shows non-zero `avg_power` and `distance_km` in `GET /api/status`, `target_power` while running and `null` after pause, and `heart_rate` `null` throughout.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-049` | `L1-002` | Power and ride-total estimates. Estimates live in `Wattzup.Core`. |

## Diagrams

### System context

The bike supplies cadence and resistance; Wattzup estimates power and totals from them for the rider.

![C4 system context for estimating power and ride totals](diagrams/c4-context.png)

### Containers

All estimates are computed in the Wattzup API container and pushed to Wattzup Web in the state.

![C4 container view for estimating power and ride totals](diagrams/c4-container.png)

### Components

`TelemetryIngestor` and `WorkoutEngine` call `PowerEstimator`. The engine keeps `RideTotals` per run. Both write through `BikeStateStore`.

![C4 component view for estimating power and ride totals](diagrams/c4-component.png)

### Class structure

`PowerEstimator` is a pure function and `RideTotals` an immutable accumulator, so every formula is a table test.

![Class diagram for estimating power and ride totals](diagrams/class-structure.png)

### Behaviour — estimate on each frame and accumulate on each tick

A frame recomputes `power`. A running tick adds that power and the speed to the totals and sets `target_power`. A new workout resets the totals (L2-049).

![Sequence diagram for estimating power and accumulating ride totals](diagrams/sequence-estimate-and-accumulate.png)
