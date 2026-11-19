// The words of an error, read by shape: a DOMException is an Error in Chromium but not in every
// runtime, and Web Bluetooth rejects with DOMExceptions.

/** The error's message. */
export function messageOf(e: unknown): string {
  const message = (e as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : String(e);
}

/** `<error name>: <message>`, as L2-091 AC3 asks. */
export function nameAndMessage(e: unknown): string {
  const name = (e as { name?: unknown } | null)?.name;
  return typeof name === 'string' ? `${name}: ${messageOf(e)}` : messageOf(e);
}
