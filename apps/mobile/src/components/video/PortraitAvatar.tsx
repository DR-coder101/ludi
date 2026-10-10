import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { PieceColor } from '../../theme/tokens';

const SHIRT: Record<PieceColor, string> = {
  gold: '#C9A200',
  green: '#0B7A34',
  red: '#B3121F',
  black: '#2a2b2f',
};

const HAIR: Record<PieceColor, string> = {
  gold: '#3B2414',
  green: '#1A120C',
  red: '#2B1A10',
  black: '#111114',
};

const SKIN: Record<PieceColor, string> = {
  gold: '#C68642',
  green: '#8D5524',
  red: '#D4A574',
  black: '#A36B3E',
};

/** Illustrated yard portrait. Not a silhouette and not a photo. */
export function PortraitAvatar({ piece }: { piece: PieceColor }) {
  const shirt = SHIRT[piece];
  const hair = HAIR[piece];
  const skin = SKIN[piece];
  const longHair = piece === 'green';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 57 70">
      <Rect width={57} height={70} fill="#3a2f28" />
      <Ellipse cx={28.5} cy={78} rx={28} ry={22} fill={shirt} />
      <Rect x={23} y={42} width={11} height={8} rx={3} fill={skin} />
      {longHair ? <Ellipse cx={28.5} cy={36} rx={20} ry={22} fill={hair} /> : null}
      <Circle cx={28.5} cy={30} r={14} fill={skin} />
      {longHair ? (
        <Path d="M14 28c1-12 9-18 14.5-18S42 16 43 28c-2 3-5 4-8 4-3-6-13-6-16 0-3 0-6-1-5-4z" fill={hair} />
      ) : (
        <Path d="M15 28c1-11 8-16 13.5-16S42 17 43 28c-3 2-7 3-14.5 3S18 30 15 28z" fill={hair} />
      )}
      <Circle cx={23.5} cy={29} r={1.4} fill="#1a120c" />
      <Circle cx={33.5} cy={29} r={1.4} fill="#1a120c" />
      <Path d="M25 35c1.4 1.6 5.6 1.6 7 0" stroke="#6B3F22" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
