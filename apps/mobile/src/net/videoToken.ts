import type { VideoTokenResponse } from '@ludi/protocol';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

export async function fetchVideoToken(
  roomCode: string,
  userId: string
): Promise<{ token: string; error?: never } | { error: string; token?: never }> {
  try {
    const response = await fetch(`${SERVER_URL}/video-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        userId,
      }),
    });

    const data: VideoTokenResponse = await response.json();

    if (!data.success || !data.token) {
      return {
        error: data.error || 'Failed to fetch video token',
      };
    }

    return {
      token: data.token,
    };
  } catch (error) {
    console.error('[VideoToken] Fetch error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
