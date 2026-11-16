// Storage access that never throws: blocked storage falls back to memory.
export class SafeStorage {
  private readonly memory = new Map<string, string>();

  constructor(private readonly storage: () => Storage) {}

  get(key: string): string | null {
    try {
      return this.storage().getItem(key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }

  set(key: string, value: string): void {
    this.memory.set(key, value);
    try {
      this.storage().setItem(key, value);
    } catch {
      /* memory only */
    }
  }

  remove(key: string): void {
    this.memory.delete(key);
    try {
      this.storage().removeItem(key);
    } catch {
      /* memory only */
    }
  }
}
