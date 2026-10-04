export function runInBackground(label: string, work: () => unknown): void {
  setImmediate(() => {
    void Promise.resolve()
      .then(work)
      .catch((err: unknown) => {
        console.error(`[${label}]`, err);
      });
  });
}
