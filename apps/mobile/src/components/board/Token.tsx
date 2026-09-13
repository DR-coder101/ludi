import React from 'react';
import { Circle } from 'react-native-svg';
import type { Color } from './boardLayout';
import { COLORS } from './boardLayout';

interface TokenProps {
  color: Color;
  x: number;
  y: number;
  cellSize: number;
}

export const Token: React.FC<TokenProps> = ({ color, x, y, cellSize }) => {
  const radius = cellSize * 0.35;
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;

  return (
    <>
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={COLORS[color]}
        stroke="#000"
        strokeWidth={cellSize * 0.03}
      />
      <Circle
        cx={centerX}
        cy={centerY}
        r={radius * 0.4}
        fill="rgba(255, 255, 255, 0.3)"
      />
    </>
  );
};
