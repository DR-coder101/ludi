import type { VideoTokenResponse } from '@ludi/protocol';
import { resolveSocketServerUrl } from './socketUrl';

export function readVideoToken(
  data: VideoTokenResponse,
): { token: string; url: string | null } | { error: string } {
  if (!data.success || !data.token) {
    return { error: data.error || 'Failed to fetch video token' };
  }
  return { token: data.token, url: data.url ?? null };
}

export async function fetchVideoToken(
  roomCode: string,
  userId: string,
  sessionToken: string,
): Promise<{ token: string; url: string | null } | { error: string }> {
  try {
    const response = await fetch(`${resolveSocketServerUrl()}/video-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        userId,
        sessionToken,
      }),
    });

    const data: VideoTokenResponse = await response.json();
    const result = readVideoToken(data);
    if ('error' in result) {
      console.warn('[Video] token fetch failed', result.error);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    console.warn('[Video] token fetch failed', message);
    return { error: message };
  }
}
