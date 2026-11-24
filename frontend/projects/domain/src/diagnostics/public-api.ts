// The diagnostic recording's part of the domain library (L2-178, ADR 0048), as `@telo/domain/diagnostics`. It is an
// entry point of its own, and `@telo/domain` exports none of it, so its code is bundled only into the chunk the app
// imports dynamically when it is opened with `?diagnose`: a rider's app never fetches it (L2-178 AC1).
export { DiagnosticRecorder } from './recording/diagnostic-recorder';
export { RECORDING_LIMITS } from './recording/recording-buffer';
export { BrowserFileSaver } from '../browser/browser-file-saver';
