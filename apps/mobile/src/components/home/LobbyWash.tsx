import React, { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../../theme/tokens';

const GRAIN = require('../../../assets/board/grain.png');

export function LobbyWash() {
  const [size, setSize] = useState({ width: 390, height: 844 });

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Svg width={size.width} height={size.height}>
        <Defs>
          <RadialGradient id="homeGreen" cx="50%" cy="18%" r="62%">
            <Stop offset="0%" stopColor={color.emerald} stopOpacity={0.32} />
            <Stop offset="55%" stopColor={color.emerald} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={color.emerald} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="homeGold" cx="82%" cy="78%" r="42%">
            <Stop offset="0%" stopColor={color.goldArcade} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={color.goldArcade} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="homeMagenta" cx="12%" cy="70%" r="38%">
            <Stop offset="0%" stopColor={color.magenta} stopOpacity={0.07} />
            <Stop offset="100%" stopColor={color.magenta} stopOpacity={0} />
          </RadialGradient>
          <Pattern id="homeDots" width={24} height={24} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={1} fill={color.white} fillOpacity={0.045} />
          </Pattern>
        </Defs>
        <Rect width={size.width} height={size.height} fill={color.homeWash} />
        <Rect width={size.width} height={size.height} fill="url(#homeGreen)" />
        <Rect width={size.width} height={size.height} fill="url(#homeGold)" />
        <Rect width={size.width} height={size.height} fill="url(#homeMagenta)" />
        <Rect width={size.width} height={size.height} fill="url(#homeDots)" />
      </Svg>
      <Image source={GRAIN} style={styles.grain} resizeMode="repeat" />
    </View>
  );
}

const styles = StyleSheet.create({
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
});
