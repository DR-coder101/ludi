import { describe, expect, it } from 'vitest';
import { handshakeAuthFromSession } from './handshakeAuth.js';

describe('handshakeAuthFromSession', () => {
  it('sends the seat token and the access token', () => {
    expect(handshakeAuthFromSession({ session_token: 's', access_token: 'j' })).toEqual({
      token: 's',
      accessToken: 'j',
    });
  });

  it('sends only the seat token when no access token is stored', () => {
    expect(handshakeAuthFromSession({ session_token: 's' })).toEqual({ token: 's' });
  });

  it('sends only the access token when the guest has no seat yet', () => {
    expect(handshakeAuthFromSession({ access_token: 'j' })).toEqual({ accessToken: 'j' });
  });

  it('omits every key when the session is empty', () => {
    expect(handshakeAuthFromSession({})).toEqual({});
  });

  it('omits an empty access token', () => {
    expect(handshakeAuthFromSession({ session_token: 's', access_token: '' })).toEqual({
      token: 's',
    });
  });

  it('does not trim whitespace', () => {
    expect(handshakeAuthFromSession({ session_token: ' s ', access_token: ' j ' })).toEqual({
      token: ' s ',
      accessToken: ' j ',
    });
  });
});
