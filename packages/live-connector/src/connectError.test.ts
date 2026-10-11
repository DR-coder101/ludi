import { describe, expect, it } from 'vitest';
import { classifyConnectError, isTerminalReason } from './connectError.js';
import { STATUS_REASON } from './types.js';

describe('classifyConnectError', () => {
  it('maps UserOfflineError and offline wording to stream offline', () => {
    expect(classifyConnectError({ name: 'UserOfflineError', message: 'nope' })).toEqual({
      terminal: true,
      reason: STATUS_REASON.STREAM_OFFLINE,
    });
    expect(classifyConnectError(new Error("The requested user isn't online :("))).toEqual({
      terminal: true,
      reason: STATUS_REASON.STREAM_OFFLINE,
    });
  });

  it('maps Euler sign-plan failures to a sign-key hint', () => {
    expect(
      classifyConnectError(
        new Error(
          '[Empty Payload] [fetchWebcastSignatureFromEulerRoute] Failed to sign a request: This endpoint requires a Business plan. Purchase one at https://www.eulerstream.com/pricing.',
        ),
      ),
    ).toEqual({
      terminal: true,
      reason: STATUS_REASON.SIGN_REQUIRED,
    });
  });

  it('leaves other failures retryable', () => {
    expect(classifyConnectError(new Error('socket hang up'))).toEqual({
      terminal: false,
      reason: 'socket hang up',
    });
  });

  it('treats both terminal reasons as stop-the-loop', () => {
    expect(isTerminalReason(STATUS_REASON.STREAM_OFFLINE)).toBe(true);
    expect(isTerminalReason(STATUS_REASON.SIGN_REQUIRED)).toBe(true);
    expect(isTerminalReason(STATUS_REASON.DROPPED)).toBe(false);
  });
});
