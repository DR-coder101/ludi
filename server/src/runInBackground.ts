/**
 * Run work on a later event-loop turn.
 * Returns void before work is called.
 * Logs a sync throw or a rejection as `[${label}]` plus the error.
 * Does not rethrow, retry, or return a promise the caller can await.
 */
export function runInBackground(label: string, work: () => unknown): void {
  setImmediate(() => {
    void Promise.resolve()
      .then(work)
      .catch((err: unknown) => {
        console.error(`[${label}]`, err);
      });
  });
}
