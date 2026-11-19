# Load classes in the browser

## Overview

A class is a bike plan with the YouTube video it follows, listed on a shelf of the class library (ADR 0014). In the backend edition the backend reads and validates the catalogue file `classes.json` and serves it through `/api/classes` (L2-077, L2-078). In the browser edition the same file sits beside `index.html` on the static host, and the page fetches and validates it itself. The owner still changes the classes by replacing 1 file, with no rebuild (L2-096).

**catalogue** — the JSON file of shelves and classes whose fields and limits L2-077 tables

**catalogue reader** — the code that applies L2-077's rules: it keeps valid shelves and classes in file order and leaves out the rest with a named problem

## Description

- **`classes.json` in the build** — `scripts/copy-classes.mjs` copies `backend/src/Wattzup.Api/classes.json` into `frontend/public/browser/classes.json` before `ng build --configuration browser`, so the default build ships the same catalogue as the backend edition (L2-096 criterion 1). The owner may replace the deployed file at any time.
- **`ClassCatalogueReader`** (`@wattzup/browser`, `lib/engine/`; mirror of `Wattzup.Core/Classes/ClassCatalogueReader`) — `read(text: string): CatalogueResult`. It rejects text over 1 MB or not a JSON catalogue as a whole; it leaves out each shelf or class that breaks a rule of L2-077, with a `CatalogueProblem` naming the `id` (or position) and field; it keeps the first 20 shelves and 200 valid classes; it keeps only a video's id and start point. It validates each plan with the `WorkoutPlanValidator` mirror (L2-096 criterion 2). Its tests restate the .NET reader's rows.
- **`BrowserClassApi`** — implements `CLASS_API`. On first use it fetches `classes.json` relative to the document's base URL with `cache: 'no-cache'`, reads it, logs each problem with `console.warn` naming the class or shelf, and caches the result for the page's life. `list()` answers the shelves that hold a class, with their classes; `get(id)` answers a class or `not-found` (L2-078 shapes). A failed fetch or whole-file rejection logs 1 `console.error` naming `classes.json` and the reason and answers an empty catalogue, so the class library shows its empty state and `/setup` still works (L2-096 criterion 3).
- **Service worker** — caches `classes.json` with a freshness strategy, so an online visit sees the owner's latest file and an offline visit sees the last one fetched (see `build-and-host`).
- **Pages** — the class library and class page are unchanged and behave as L2-079 and L2-080 (L2-096 criterion 4). Covers come from `https://i.ytimg.com`, allowed by the CSP. Every text field is bound as text.
- The backend edition's live reload of the file (L2-077 criterion 7) has no counterpart: the next page load reads the new file.

Verification: parity tests of `ClassCatalogueReader`; `BrowserClassApi` tests with a fake `fetch` (valid, 404, invalid JSON, over 1 MB, mixed valid and invalid classes); a browser-edition spec that serves a 2-class `classes.json` through the fixture and opens the library and a class page.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-096` | `L1-016` | Class catalogue in the browser. The catalogue shall be read from `classes.json` beside `index.html`, replaceable without a rebuild, with the default build shipping the backend edition's file; it shall be validated by L2-077's rules and limits in the browser, leaving out invalid entries and naming them in the console; a missing or invalid file shall show the library's empty state with rides from `/setup` still working; the library and class pages shall behave as L2-079 and L2-080. |

## Diagrams

### System context

The owner publishes `classes.json` with the static files. The rider's browser fetches it and loads covers and videos from YouTube.

![C4 system context for loading classes in the browser](diagrams/c4-context.png)

### Containers

The service worker passes the fetch to the host or answers from its cache. The app reads and validates the file.

![C4 container view for loading classes in the browser](diagrams/c4-container.png)

### Components

The class pages call `CLASS_API`. `BrowserClassApi` fetches the file once and hands it to `ClassCatalogueReader`, which uses the `WorkoutPlanValidator` mirror.

![C4 component view for loading classes in the browser](diagrams/c4-component.png)

### Class structure

`ClassCatalogueReader` turns text into a `CatalogueResult` of the kept catalogue and its problems. `BrowserClassApi` caches the result.

![Class diagram for loading classes in the browser](diagrams/class-structure.png)

### Behaviour — open the class library

The first call fetches and reads the file; invalid entries are left out and named; a missing file gives the empty state (L2-096).

![Sequence for opening the class library](diagrams/sequence-load-catalogue.png)
