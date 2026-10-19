import { describe, expect, it, vi } from 'vitest';
import { describeRouteError, homeResetOnRouteError } from './routeError';

describe('route errors', () => {
  it('logs the error and never asks navigation to reset home', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(describeRouteError(new Error('cell lookup failed'))).toBe('cell lookup failed');
    expect(spy).toHaveBeenCalled();
    expect(homeResetOnRouteError()).toBe(false);
    spy.mockRestore();
  });
});
