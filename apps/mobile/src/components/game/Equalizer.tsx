import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../../theme/tokens';

const BARS = 34;
const BAR_W = 4;
const GAP = 3;
const HEIGHT = 18;
const WIDTH = BARS * BAR_W + (BARS - 1) * GAP;
const heights = Array.from({ length: BARS }, (_, i) => 4 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 14);

/** Static voice equaliser strip under the player order, as drawn in the mockups. */
export function Equalizer() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={WIDTH} height={HEIGHT}>
        <Defs>
          <LinearGradient id="eq" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={color.green} />
            <Stop offset="1" stopColor={color.gold} />
          </LinearGradient>
        </Defs>
        {heights.map((h, i) => (
          <Rect key={i} x={i * (BAR_W + GAP)} y={HEIGHT - h} width={BAR_W} height={h} rx={2} fill="url(#eq)" />
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
    overflow: 'visible',
  },
});
