import React, { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../../theme/tokens';
import { washSpot } from '../../theme/threeD';

const GRAIN = require('../../../assets/board/grain.png');

export function LobbyWash() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }

  const green = size ? washSpot(size.width, size.height, 0.5, 0.3, 0.58) : null;
  const gold = size ? washSpot(size.width, size.height, 0.8, 0.8, 0.42) : null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size && green && gold ? (
        <>
          <Svg width={size.width} height={size.height}>
            <Defs>
              <RadialGradient id="homeGreen" cx={green.cx} cy={green.cy} r={green.r} gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor={color.emerald} stopOpacity={0.2} />
                <Stop offset="60%" stopColor={color.emerald} stopOpacity={0} />
                <Stop offset="100%" stopColor={color.emerald} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="homeGold" cx={gold.cx} cy={gold.cy} r={gold.r} gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor={color.goldArcade} stopOpacity={0.08} />
                <Stop offset="100%" stopColor={color.goldArcade} stopOpacity={0} />
              </RadialGradient>
              <Pattern id="homeDots" width={24} height={24} patternUnits="userSpaceOnUse">
                <Circle cx={1} cy={1} r={1} fill={color.white} fillOpacity={0.045} />
              </Pattern>
            </Defs>
            <Rect width={size.width} height={size.height} fill={color.homeWash} />
            <Rect width={size.width} height={size.height} fill="url(#homeGreen)" />
            <Rect width={size.width} height={size.height} fill="url(#homeGold)" />
            <Rect width={size.width} height={size.height} fill="url(#homeDots)" />
          </Svg>
          <Image source={GRAIN} style={[styles.grain, { width: size.width, height: size.height }]} resizeMode="repeat" />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.12,
  },
});
