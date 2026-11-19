# User journeys

The journeys Wattzup implements today, in the order of the value they add for a rider. Each has a
narrated film in [`docs/videos/`](videos/README.md).

| # | Journey | Description |
|---|---------|-------------|
| 1 | Ride a HIIT workout | Pick a preset, press Start ride; the plan sets your resistance. |
| 2 | Connect your bike | Pick the bike once in the browser's chooser; Wattzup connects and keeps it connected, and the status line says how it's going. |
| 3 | Read your live metrics | Power, cadence, speed and ride totals, live as you pedal. |
| 4 | Take over the resistance | Raise, lower or pick a level, then go back to plan. |
| 5 | Build an intervals plan | Warm-up, ordered sets and cool-down, previewed before you start. |
| 7 | Pause, resume or end a ride | Pause the ride, pick it up again, or end it. |
| 8 | Follow the countdown and cues | See time left and what's next; hear each change coming. |
| 9 | Ride along to a video | Sync a YouTube video to your ride; it pauses with you. |
| 10 | Recover a dropped connection | Banners and overlays say what dropped and how to reconnect. |
| 12 | Check diagnostics | See what Wattzup knows about the browser and the bike; download the packet log. |
| 13 | Switch light or dark | Ride in the dark theme by default, or switch to light. |
| 14 | Review your rides | See each saved ride's summary and dips, then your progress and streak; export or import your history. |

Journey 6 (Run on the treadmill) was removed with the treadmill ([ADR 0016](adr/0016-bike-only.md)), and
journey 11 (Unlock a shared server) with the backend ([ADR 0019](adr/0019-no-backend.md)); the other
journeys keep their numbers, which name their films.
