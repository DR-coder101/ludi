/**
 * Authoritative game server base URL for Socket.IO and HTTP auth/profile calls.
 * Override with EXPO_PUBLIC_SOCKET_URL for local or custom hosts.
 */
export const SERVER_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  'https://server-production-3749.up.railway.app';
