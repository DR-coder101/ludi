export type TtlCacheOptions = {
  ttlMs: number;
  now?: () => number;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type TtlCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  deleteWhere(predicate: (key: string) => boolean): void;
  clear(): void;
  size(): number;
};

export function createTtlCache<T>(options: TtlCacheOptions): TtlCache<T> {
  const entries = new Map<string, CacheEntry<T>>();
  const now = options.now ?? Date.now;

  function isFresh(entry: CacheEntry<T>): boolean {
    return entry.expiresAt > now();
  }

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }
      if (!isFresh(entry)) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key, value) {
      entries.set(key, {
        value,
        expiresAt: now() + options.ttlMs,
      });
    },

    delete(key) {
      entries.delete(key);
    },

    deleteWhere(predicate) {
      for (const key of entries.keys()) {
        if (predicate(key)) {
          entries.delete(key);
        }
      }
    },

    clear() {
      entries.clear();
    },

    size() {
      for (const [key, entry] of entries) {
        if (!isFresh(entry)) {
          entries.delete(key);
        }
      }
      return entries.size;
    },
  };
}
