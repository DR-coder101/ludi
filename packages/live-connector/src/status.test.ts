import { describe, expect, it } from 'vitest';
import { initialStatus, reduceStatus } from './status.js';
import { STATUS_REASON } from './types.js';

describe('status machine', () => {
  it('starts disconnected', () => {
    expect(initialStatus(10)).toEqual({ phase: 'disconnected', at: 10 });
  });

  it('moves disconnected to connecting to connected', () => {
    let status = initialStatus(0);
    status = reduceStatus(status, { type: 'connect_requested' }, 1);
    expect(status).toEqual({ phase: 'connecting', at: 1 });
    status = reduceStatus(status, { type: 'connected' }, 2);
    expect(status).toEqual({ phase: 'connected', at: 2 });
  });

  it('records stream offline as error and does not reconnect from that event', () => {
    let status = reduceStatus(initialStatus(0), { type: 'connect_requested' }, 1);
    status = reduceStatus(
      status,
      { type: 'offline', reason: STATUS_REASON.STREAM_OFFLINE },
      2,
    );
    expect(status).toEqual({
      phase: 'error',
      reason: STATUS_REASON.STREAM_OFFLINE,
      at: 2,
    });
  });

  it('moves a dropped live socket to reconnecting', () => {
    let status = reduceStatus(initialStatus(0), { type: 'connect_requested' }, 1);
    status = reduceStatus(status, { type: 'connected' }, 2);
    status = reduceStatus(status, { type: 'dropped', reason: STATUS_REASON.DROPPED }, 3);
    expect(status).toEqual({ phase: 'reconnecting', reason: STATUS_REASON.DROPPED, at: 3 });
  });

  it('moves a failed connect to reconnecting', () => {
    let status = reduceStatus(initialStatus(0), { type: 'connect_requested' }, 1);
    status = reduceStatus(
      status,
      { type: 'connect_failed', reason: STATUS_REASON.CONNECT_FAILED },
      2,
    );
    expect(status).toEqual({
      phase: 'reconnecting',
      reason: STATUS_REASON.CONNECT_FAILED,
      at: 2,
    });
  });

  it('honours disconnect from any phase', () => {
    let status = reduceStatus(initialStatus(0), { type: 'connect_requested' }, 1);
    status = reduceStatus(status, { type: 'connected' }, 2);
    status = reduceStatus(
      status,
      { type: 'disconnect_requested', reason: STATUS_REASON.DISCONNECT },
      3,
    );
    expect(status).toEqual({
      phase: 'disconnected',
      reason: STATUS_REASON.DISCONNECT,
      at: 3,
    });
  });

  it('keeps the same object when the phase does not change', () => {
    const connected = reduceStatus(
      reduceStatus(initialStatus(0), { type: 'connect_requested' }, 1),
      { type: 'connected' },
      2,
    );
    const again = reduceStatus(connected, { type: 'connected' }, 9);
    expect(again).toBe(connected);
  });
});
