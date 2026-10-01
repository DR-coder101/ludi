import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../../theme/tokens';

/** `.screen` background: diagonal charcoal gradient with a soft top-left light and a green bottom-right wash. */
export function ScreenBackdrop() {
  const { width: w, height: h } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width={w} height={h} pointerEvents="none">
      <Defs>
        <LinearGradient id="bd-base" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#131315" />
          <Stop offset="0.55" stopColor="#0A0A0B" />
          <Stop offset="1" stopColor="#0E0E0F" />
        </LinearGradient>
        <RadialGradient id="bd-light">
          <Stop offset="0" stopColor={color.white} stopOpacity={0.05} />
          <Stop offset="0.6" stopColor={color.white} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="bd-green">
          <Stop offset="0" stopColor={color.green} stopOpacity={0.1} />
          <Stop offset="0.6" stopColor={color.green} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={w} height={h} fill="url(#bd-base)" />
      <Ellipse cx={w * 0.2} cy={h * 0.1} rx={w * 1.2} ry={h * 0.6} fill="url(#bd-light)" />
      <Ellipse cx={w * 0.9} cy={h * 0.8} rx={w * 0.9} ry={h * 0.5} fill="url(#bd-green)" />
    </Svg>
  );
}
