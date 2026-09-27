import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../../theme/tokens';

/** Screen base: dark diagonal gradient with a soft top-left sheen and a green glow low right. */
export function ScreenBackdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id="bd-base" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor={palette.bgTop} />
          <Stop offset="0.55" stopColor="#0A0A0B" />
          <Stop offset="1" stopColor={palette.bgBottom} />
        </LinearGradient>
        <RadialGradient id="bd-sheen" cx="20%" cy="10%" rx="120%" ry="60%" fx="20%" fy="10%">
          <Stop offset="0" stopColor={palette.white} stopOpacity={0.05} />
          <Stop offset="0.6" stopColor={palette.white} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="bd-green" cx="90%" cy="80%" rx="90%" ry="50%" fx="90%" fy="80%">
          <Stop offset="0" stopColor={palette.green} stopOpacity={0.1} />
          <Stop offset="0.6" stopColor={palette.green} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#bd-base)" />
      <Rect width="100%" height="100%" fill="url(#bd-sheen)" />
      <Rect width="100%" height="100%" fill="url(#bd-green)" />
    </Svg>
  );
}
