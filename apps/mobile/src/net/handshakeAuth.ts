import { AUTH_TOKEN_KEY } from '../auth/storageKeys';

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

export async function resolveHandshakeSecretsForConnect(
  seatToken: string | null,
  store: { getItem(key: string): Promise<string | null> },
): Promise<HandshakeSecrets> {
  const accessToken = await store.getItem(AUTH_TOKEN_KEY);
  return { seatToken, accessToken };
}
