import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { FaceStop } from '../../theme/threeD';

export function FaceFill({
  id,
  stops,
  axis,
}: {
  id: string;
  stops: readonly FaceStop[];
  axis: 'b' | 'br' | 'r';
}) {
  const x2 = axis === 'b' ? '0' : '1';
  const y2 = axis === 'r' ? '0' : '1';
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
          {stops.map((stop) => (
            <Stop key={`${id}-${stop.offset}`} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
