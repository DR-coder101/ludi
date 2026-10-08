import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY } from '../auth/storageKeys';
import {
  compactHandshakeAuth,
  resolveHandshakeSecretsForConnect,
} from './handshakeAuth';

describe('compactHandshakeAuth', () => {
  it('sends the seat token and the access token', () => {
    expect(compactHandshakeAuth({ seatToken: 'seat', accessToken: 'jwt' })).toEqual({
      token: 'seat',
      accessToken: 'jwt',
    });
  });

  it('omits every key when both secrets are missing', () => {
    expect(compactHandshakeAuth({})).toEqual({});
  });

  it('omits empty and null secrets', () => {
    expect(compactHandshakeAuth({ seatToken: '', accessToken: null })).toEqual({});
  });

  it('sends an access token when the first guest connect has no seat token', () => {
    expect(compactHandshakeAuth({ accessToken: 'jwt' })).toEqual({ accessToken: 'jwt' });
  });

  it('does not send an empty access token', () => {
    expect(compactHandshakeAuth({ accessToken: '' })).toEqual({});
  });

  it('does not trim whitespace', () => {
    expect(compactHandshakeAuth({ seatToken: ' seat ', accessToken: ' jwt ' })).toEqual({
      token: ' seat ',
      accessToken: ' jwt ',
    });
  });
});

describe('resolveHandshakeSecretsForConnect', () => {
  it('reads the current access token and keeps the in-memory seat token', async () => {
    const secrets = await resolveHandshakeSecretsForConnect('seat', {
      getItem: async (key) => (key === AUTH_TOKEN_KEY ? 'jwt' : null),
    });
    expect(compactHandshakeAuth(secrets)).toEqual({ token: 'seat', accessToken: 'jwt' });
  });

  it('still sends the access token when the seat token is null', async () => {
    const secrets = await resolveHandshakeSecretsForConnect(null, {
      getItem: async (key) => (key === AUTH_TOKEN_KEY ? 'jwt' : null),
    });
    expect(compactHandshakeAuth(secrets)).toEqual({ accessToken: 'jwt' });
  });
});
