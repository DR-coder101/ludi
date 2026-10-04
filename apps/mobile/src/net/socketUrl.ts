export const DEFAULT_SOCKET_SERVER_URL =
  'https://server-production-3749.up.railway.app';

export function resolveSocketServerUrl(
  socketUrl: string | undefined = process.env.EXPO_PUBLIC_SOCKET_URL,
): string {
  return socketUrl || DEFAULT_SOCKET_SERVER_URL;
}
