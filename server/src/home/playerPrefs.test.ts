import { describe, expect, it } from 'vitest';
import { createPlayerPrefsStore, EMPTY_PREFS } from './playerPrefs.js';

describe('playerPrefs', () => {
  it('starts empty and stores a hometown pick without inventing a location', () => {
    const store = createPlayerPrefsStore();
    expect(store.get('dean')).toEqual(EMPTY_PREFS);
    expect(store.put('dean', { hometown: 'kingston' })).toEqual({
      hometown: 'kingston',
      tournamentNotify: false,
    });
    expect(store.put('dean', { tournamentNotify: true })).toEqual({
      hometown: 'kingston',
      tournamentNotify: true,
    });
    expect(store.hometownOf('guest')).toBe(null);
  });
});
