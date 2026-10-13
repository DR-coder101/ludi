import { describe, expect, it } from 'vitest';
import { demoFrame } from './fixtures.js';
import { ADMIN_DEMO_IDS, DEFAULT_COMMANDS, overlayUrl, OVERLAY_FALLBACK_PORT, OVERLAY_PORT } from './types.js';

describe('admin demo frames', () => {
  it('lists !stay with the other command words', () => {
    expect(DEFAULT_COMMANDS).toEqual({
      join: '!join',
      roll: '!roll',
      move: '!move',
      stay: '!stay',
      leave: '!leave',
    });
    const settings = demoFrame('settings');
    expect(Object.values(settings.settings.commands)).toEqual([
      '!join',
      '!roll',
      '!move',
      '!stay',
      '!leave',
    ]);
  });

  it('keeps overlay URL on 4747 and port-in-use fallback on 4748', () => {
    expect(demoFrame('setup').setup.overlayUrl).toBe(overlayUrl(OVERLAY_PORT));
    expect(demoFrame('setup').setup.overlayUrl).toBe('http://localhost:4747/overlay');
    expect(demoFrame('error-port-in-use').error).toEqual({
      kind: 'port-in-use',
      wanted: OVERLAY_PORT,
      fallback: OVERLAY_FALLBACK_PORT,
    });
  });

  it('keeps sit-outs on the live dashboard and a confirm on kick', () => {
    const dash = demoFrame('dashboard');
    expect(dash.dashboard.sitOut.map((row) => row.name)).toEqual(['@Andre', '@Keisha', '@Rasheed']);
    expect(demoFrame('kick-confirm').kick?.displayName).toBe('@Sarah');
  });

  it('covers all thirteen approved screens', () => {
    expect(ADMIN_DEMO_IDS).toHaveLength(13);
    for (const id of ADMIN_DEMO_IDS) {
      const frame = demoFrame(id);
      expect(frame.canvas.width).toBe(1024);
      expect(frame.canvas.height).toBeGreaterThan(600);
    }
  });
});
