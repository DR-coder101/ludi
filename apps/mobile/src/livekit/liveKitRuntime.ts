export type LiveKitRuntime = {
  os: string;
  appOwnership: string | null;
  executionEnvironment: string | null;
  isTest: boolean;
};

export function isTestRuntime(
  env: Record<string, string | undefined> = typeof process === 'undefined' ? {} : process.env,
): boolean {
  return Boolean(env.JEST_WORKER_ID || env.VITEST || env.VITEST_WORKER_ID);
}

export function shouldRegisterLiveKitGlobals(runtime: LiveKitRuntime): boolean {
  if (runtime.isTest) return false;
  if (runtime.os === 'web') return false;
  if (runtime.appOwnership === 'expo') return false;
  if (runtime.executionEnvironment === 'storeClient') return false;
  return true;
}
