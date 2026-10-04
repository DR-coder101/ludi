/** Fallback when EXPO_PUBLIC_SOCKET_URL is unset at bundle time. */
export const DEFAULT_SOCKET_SERVER_URL = 'http://localhost:3000';

export function resolveSocketServerUrl(
  socketUrl: string | undefined = process.env.EXPO_PUBLIC_SOCKET_URL,
): string {
  return socketUrl || DEFAULT_SOCKET_SERVER_URL;
}
