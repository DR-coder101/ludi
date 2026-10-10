export type VideoConnectFacts = {
  matchStarted: boolean;
  token: string | null;
  url: string | null;
  liveKitAvailable: boolean;
  declined: boolean;
  fetchError: string | null;
};

export type VideoSession =
  | { status: 'idle' }
  | { status: 'live'; token: string; url: string }
  | { status: 'unavailable'; notice: string }
  | { status: 'declined' };

export function resolveVideoSession(facts: VideoConnectFacts): VideoSession {
  if (facts.declined) return { status: 'declined' };
  if (!facts.matchStarted) return { status: 'idle' };
  if (!facts.liveKitAvailable) {
    return { status: 'unavailable', notice: 'Video is unavailable on this device.' };
  }
  if (facts.token && facts.url) {
    return { status: 'live', token: facts.token, url: facts.url };
  }
  if (facts.fetchError) {
    return { status: 'unavailable', notice: facts.fetchError };
  }
  return { status: 'idle' };
}

export function shouldFetchVideoToken(facts: VideoConnectFacts): boolean {
  return (
    facts.matchStarted &&
    facts.liveKitAvailable &&
    !facts.declined &&
    !facts.token &&
    !facts.fetchError
  );
}

export function shouldMountLiveKit(session: VideoSession): boolean {
  return session.status === 'live';
}

export function videoNotice(session: VideoSession): string | null {
  return session.status === 'unavailable' ? session.notice : null;
}

export function resolveLivekitUrl(
  fromServer: string | null | undefined,
  fromEnv: string | undefined,
): string | null {
  return fromServer || fromEnv || null;
}
