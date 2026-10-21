import { describe, expect, it } from 'vitest';
import { BUTTON_3D, CARD_3D, button3DShadow, card3DShadow, washSpot } from './threeD';

describe('Stitch 3D recipes', () => {
  it('keeps gold and dark button lips at 6px rest and 1px pressed', () => {
    expect(BUTTON_3D.gold.lip).toBe('#B58600');
    expect(BUTTON_3D.gold.lipRest).toBe(6);
    expect(BUTTON_3D.gold.lipPressed).toBe(1);
    expect(BUTTON_3D.gold.pressY).toBe(4);
    expect(BUTTON_3D.dark.lip).toBe('#0B0E11');
    expect(BUTTON_3D.dark.lipRest).toBe(6);
    expect(BUTTON_3D.green.lip).toBe('#006028');
    expect(BUTTON_3D.green.lipRest).toBe(5);
  });

  it('prints the Stitch box-shadow strings for rest and press', () => {
    expect(button3DShadow('gold', false)).toBe('0 6px 0 0 #B58600, 0 10px 20px rgba(255, 208, 0, 0.35)');
    expect(button3DShadow('gold', true)).toBe('0 1px 0 0 #B58600');
    expect(button3DShadow('dark', false)).toBe('0 6px 0 0 #0B0E11, 0 10px 20px rgba(0,0,0,0.6)');
    expect(button3DShadow('dark', true)).toBe('0 1px 0 0 #0B0E11');
    expect(button3DShadow('green', false)).toBe('0 5px 0 0 #006028, 0 8px 18px rgba(0, 176, 79, 0.4)');
    expect(button3DShadow('green', true)).toBe('0 1px 0 0 #006028');
  });

  it('prints the Stitch card glow and green lip', () => {
    expect(card3DShadow('gold')).toBe('0 12px 28px rgba(255, 208, 0, 0.35)');
    expect(card3DShadow('green')).toBe('0 5px 0 0 #006028, 0 8px 18px rgba(0, 176, 79, 0.4)');
    expect(CARD_3D.gold.face[0]?.color).toBe('#FFD000');
    expect(CARD_3D.green.face.map((stop) => stop.color)).toEqual(['#0d1f14', '#102419', '#0a1510']);
  });

  it('fades the green wash to zero before the short-axis edges', () => {
    const spot = washSpot(360, 844, 0.5, 0.3, 0.58);
    const edge = 360 / 2;
    expect(spot.r).toBeCloseTo(208.8);
    expect(edge / spot.r).toBeGreaterThan(0.85);
    expect(spot.cx - spot.r).toBeLessThan(0);
    expect(360 - (spot.cx + spot.r * 0.6)).toBeGreaterThan(0);
  });
});
