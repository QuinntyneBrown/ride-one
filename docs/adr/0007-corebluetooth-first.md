# 0007. CoreBluetooth is the first real transport

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

Every automated test runs against `SimulatedBikeTransport`. A real transport is needed for the
hardware smoke test (L2-043), and the machine next to the bike today is a Mac.

## Decision

`Wattzup.Ble.CoreBluetooth` is built first and shipped in `Wattzup.Mac`, a `net10.0-macos` app
bundle around `Wattzup.Api` with `NSBluetoothAlwaysUsageDescription` in its `Info.plist`. The
BlueZ and Windows transports follow against the same `IBikeTransport` abstraction; until they pass
their smoke tests they are built but not advertised as supported.

## Consequences

- The macOS workload is needed to build `Wattzup.Mac`; the other projects build without it.
- CI builds every project but runs no transport against hardware.
