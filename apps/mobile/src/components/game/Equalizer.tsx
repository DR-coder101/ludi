import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../../theme/tokens';

const BARS = 34;
const BAR_MAX = 4;
const GAP = 3;
const HEIGHT = 18;
const heights = Array.from({ length: BARS }, (_, i) => 4 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 14);

/**
 * Static voice equaliser strip under the player order, as drawn in the mockups.
 * Bars are 4 wide but shrink to fit, like the pack's flex row does in the 222px column.
 */
export function Equalizer({ width }: { width: number }) {
  const bar = Math.min(BAR_MAX, (width - (BARS - 1) * GAP) / BARS);
  const total = BARS * bar + (BARS - 1) * GAP;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={total} height={HEIGHT}>
        <Defs>
          <LinearGradient id="eq" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={color.green} />
            <Stop offset="1" stopColor={color.gold} />
          </LinearGradient>
        </Defs>
        {heights.map((h, i) => (
          <Rect key={i} x={i * (bar + GAP)} y={HEIGHT - h} width={bar} height={h} rx={2} fill="url(#eq)" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: HEIGHT,
    alignItems: 'center',
    opacity: 0.55,
  },
});
