import { describe, it, expect } from 'vitest';
import { hello } from './index';

describe('rules package', () => {
  it('should export hello function', () => {
    expect(hello()).toBe('Hello from @ludi/rules');
  });
});
