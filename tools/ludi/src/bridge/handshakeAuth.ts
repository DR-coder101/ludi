import type { SessionMeta } from '../runDir.js';

export type HandshakeSecrets = {
  seatToken?: string | null;
  accessToken?: string | null;
};

export type SocketHandshakeAuth = {
  token?: string;
  accessToken?: string;
};

export function compactHandshakeAuth(secrets: HandshakeSecrets): SocketHandshakeAuth {
  const auth: SocketHandshakeAuth = {};
  if (typeof secrets.seatToken === 'string' && secrets.seatToken.length > 0) {
    auth.token = secrets.seatToken;
  }
  if (typeof secrets.accessToken === 'string' && secrets.accessToken.length > 0) {
    auth.accessToken = secrets.accessToken;
  }
  return auth;
}

export function handshakeAuthFromSession(session: SessionMeta): SocketHandshakeAuth {
  return compactHandshakeAuth({
    seatToken: session.session_token,
    accessToken: session.access_token,
  });
}
