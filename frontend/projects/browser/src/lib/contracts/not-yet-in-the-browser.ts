// A contract the browser edition does not implement yet: every call rejects, naming it. Each
// later slice of the browser edition replaces one binding; this file goes with the last.
export function notYetInTheBrowser<T extends object>(contract: string): T {
  return new Proxy({} as T, {
    get: (_target, member) => () =>
      Promise.reject(
        new Error(`${contract}.${String(member)} is not available in the browser edition yet`),
      ),
  });
}
