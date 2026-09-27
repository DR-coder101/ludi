/**
 * Piece Chips Component  
 * Four glossy radial-gradient game pieces
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  LinearGradient,
} from 'react-native-svg';
import { colors } from '../../theme/tokens';

export const PieceChips: React.FC = () => {
  const pieceRadius = 13;
  const spacing = 46;
  const startX = 26;
  const centerY = 17;

  const pieces = [
    { color: 'gold', x: startX, gradient: colors.pieceGradients.gold },
    { color: 'green', x: startX + spacing, gradient: colors.pieceGradients.green },
    { color: 'black', x: startX + spacing * 2, gradient: colors.pieceGradients.black },
    { color: 'red', x: startX + spacing * 3, gradient: colors.pieceGradients.red },
  ];

  return (
    <View style={styles.container}>
      <Svg width={190} height={40} viewBox="0 0 190 40">
        <Defs>
          {/* Radial gradients for each piece color */}
          {pieces.map(({ color, gradient }) => (
            <RadialGradient
              key={`grad-${color}`}
              id={`pg-${color}`}
              cx="38%"
              cy="32%"
              r="75%"
            >
              <Stop offset="0" stopColor={gradient.colors[0]} />
              <Stop offset="0.45" stopColor={gradient.colors[1]} />
              <Stop offset="1" stopColor={gradient.colors[2]} />
            </RadialGradient>
          ))}

          {/* Specular highlight gradient */}
          <LinearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {pieces.map(({ color, x, gradient }) => {
          const r = pieceRadius;
          const cx = x;
          const cy = centerY;

          return (
            <React.Fragment key={color}>
              {/* Drop shadow (ellipse below) */}
              <Ellipse
                cx={cx}
                cy={cy + r * 0.62}
                rx={r * 1.02}
                ry={r * 0.5}
                fill="#000"
                opacity={0.55}
              />

              {/* Stacked base (creates thickness) */}
              <Circle
                cx={cx}
                cy={cy + r * 0.28}
                r={r}
                fill={gradient.colors[2]}
              />

              {/* Main piece with gradient */}
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                fill={`url(#pg-${color})`}
                stroke={gradient.rim}
                strokeOpacity={0.9}
                strokeWidth={Math.max(0.8, r * 0.1)}
              />

              {/* Inner groove ring */}
              <Circle
                cx={cx}
                cy={cy}
                r={r * 0.62}
                fill="none"
                stroke={gradient.colors[2]}
                strokeOpacity={0.55}
                strokeWidth={r * 0.12}
              />

              {/* Inner highlight ring */}
              <Circle
                cx={cx}
                cy={cy}
                r={r * 0.52}
                fill="none"
                stroke="#fff"
                strokeOpacity={0.28}
                strokeWidth={r * 0.06}
              />

              {/* Specular highlight ellipse */}
              <Ellipse
                cx={cx - r * 0.18}
                cy={cy - r * 0.42}
                rx={r * 0.55}
                ry={r * 0.3}
                fill="url(#spec)"
                opacity={0.8}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
