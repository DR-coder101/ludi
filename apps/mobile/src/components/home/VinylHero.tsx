/**
 * Vinyl Hero Component
 * The vinyl record / speaker cone with rays, halftone, wordmark, stickers
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Path,
  Rect,
  Pattern,
  Mask,
  Ellipse,
} from 'react-native-svg';
import { colors, typography, spacing } from '../../theme/tokens';

interface VinylHeroProps {
  width?: number;
  height?: number;
}

export const VinylHero: React.FC<VinylHeroProps> = ({ 
  width = 390, 
  height = 440 
}) => {
  const coneSize = 374; // Slightly smaller than width for padding
  const coneRadius = 170;
  const center = coneSize / 2;

  // Generate rays (alternating green/gold)
  const rays: JSX.Element[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = i * 20;
    const startAngle = (angle - 5) * (Math.PI / 180);
    const endAngle = (angle + 5) * (Math.PI / 180);
    const radius = 260;
    
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    
    const fillColor = i % 2 ? colors.green : colors.gold;
    
    rays.push(
      <Path
        key={`ray-${i}`}
        d={`M${center},${center} L${x1},${y1} L${x2},${y2}Z`}
        fill={fillColor}
        opacity={0.07}
      />
    );
  }

  // Generate concentric rings
  const rings: JSX.Element[] = [];
  for (let i = 0; i < 9; i++) {
    const r = 92 + i * 10;
    const opacity = 0.05 + (i % 3 === 0 ? 0.05 : 0);
    rings.push(
      <Circle
        key={`ring-${i}`}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#fff"
        strokeOpacity={opacity}
        strokeWidth={1}
      />
    );
  }

  // Speaker bolt positions
  const boltAngles = [45, 135, 225, 315];
  const bolts = boltAngles.map((angle, idx) => {
    const rad = angle * (Math.PI / 180);
    const x = center + 160 * Math.cos(rad);
    const y = center + 160 * Math.sin(rad);
    return (
      <Circle
        key={`bolt-${idx}`}
        cx={x}
        cy={y}
        r={4}
        fill="#3a3a3f"
        stroke="#000"
      />
    );
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {/* SVG Cone */}
      <View style={[styles.coneContainer, { width: coneSize, height: coneSize }]}>
        <Svg width={coneSize} height={coneSize} viewBox={`0 0 ${coneSize} ${coneSize}`}>
          <Defs>
            {/* Main cone gradient */}
            <RadialGradient id="coneGrad" cx="50%" cy="45%" r="55%">
              <Stop offset="0" stopColor="#2b2b30" />
              <Stop offset="0.55" stopColor="#121214" />
              <Stop offset="0.86" stopColor="#050506" />
              <Stop offset="0.9" stopColor="#2d2d31" />
              <Stop offset="0.95" stopColor="#101012" />
              <Stop offset="1" stopColor="#1b1b1e" />
            </RadialGradient>

            {/* Cap gradient */}
            <RadialGradient id="capGrad" cx="40%" cy="35%">
              <Stop offset="0" stopColor="#4a4b50" />
              <Stop offset="1" stopColor="#0c0c0e" />
            </RadialGradient>

            {/* Halftone pattern */}
            <Pattern
              id="halftonePattern"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <Circle cx="3" cy="3" r="1.1" fill={colors.gold} />
            </Pattern>

            {/* Halftone mask */}
            <RadialGradient id="halftoneMask">
              <Stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              <Stop offset="0.8" stopColor="#fff" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#fff" stopOpacity="0" />
            </RadialGradient>
            <Mask id="htMask">
              <Rect width={coneSize} height={coneSize} fill="url(#halftoneMask)" />
            </Mask>
          </Defs>

          {/* Rays */}
          {rays}

          {/* Halftone dots */}
          <Rect
            width={coneSize}
            height={coneSize}
            fill="url(#halftonePattern)"
            mask="url(#htMask)"
            opacity={0.35}
          />

          {/* Outer dashed ring */}
          <Circle
            cx={center}
            cy={center}
            r={178}
            fill="none"
            stroke={colors.gold}
            strokeOpacity={0.25}
            strokeWidth={1.5}
            strokeDasharray="2 5"
          />

          {/* Main vinyl disc */}
          <Circle
            cx={center}
            cy={center}
            r={coneRadius}
            fill="url(#coneGrad)"
          />

          {/* Concentric rings */}
          {rings}

          {/* Black outline */}
          <Circle
            cx={center}
            cy={center}
            r={coneRadius}
            fill="none"
            stroke="#000"
            strokeWidth={3}
          />

          {/* Speaker bolts */}
          {bolts}

          {/* Center cap */}
          <Circle
            cx={center}
            cy={center}
            r={48}
            fill="url(#capGrad)"
            stroke="#000"
            strokeWidth={2}
          />

          {/* Specular highlight on cap */}
          <Ellipse
            cx={176}
            cy={172}
            rx={22}
            ry={12}
            fill="#fff"
            opacity={0.08}
          />
        </Svg>
      </View>

      {/* LUDI Wordmark */}
      <View style={styles.wordmarkContainer}>
        <Text style={styles.wordmark}>LUDI</Text>
      </View>

      {/* Stickers */}
      <View style={[styles.sticker, styles.sticker1]}>
        <Text style={styles.stickerText}>JAMAICAN LUDO</Text>
      </View>
      <View style={[styles.sticker, styles.sticker2]}>
        <Text style={[styles.stickerText, styles.stickerText2]}>NEGRIL TO KINGSTON</Text>
      </View>

      {/* Tag line */}
      <View style={styles.tagContainer}>
        <Text style={styles.tagText}>
          FOUR CORNERS <Text style={styles.tagDot}>·</Text> ONE BOARD
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  coneContainer: {
    position: 'absolute',
    top: 18,
  },
  wordmarkContainer: {
    position: 'absolute',
    top: 118,
    width: '100%',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: typography.fonts.display,
    fontSize: 168,
    lineHeight: 168,
    color: colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
    // Multi-layer shadow: black base, then green, with overall dark shadow
    textShadowColor: colors.green,
    textShadowOffset: { width: 9, height: 9 },
    textShadowRadius: 0,
    // Additional shadows would need multiple Text components or a custom renderer
  },
  sticker: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    // Hard shadow via elevation on Android, shadowOffset on iOS
    shadowColor: '#0B0B0C',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0, // We want hard shadow, not soft
  },
  sticker1: {
    top: 112,
    left: 52,
    backgroundColor: colors.hot,
    transform: [{ rotate: '-7deg' }],
  },
  sticker2: {
    top: 300,
    right: 40,
    backgroundColor: '#0B0B0C',
    borderWidth: 1.5,
    borderColor: colors.gold,
    transform: [{ rotate: '5deg' }],
  },
  stickerText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#fff',
    textTransform: 'uppercase',
  },
  stickerText2: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.gold,
  },
  tagContainer: {
    position: 'absolute',
    top: 350,
    width: '100%',
    alignItems: 'center',
  },
  tagText: {
    fontFamily: typography.fonts.sticker,
    fontSize: 12,
    letterSpacing: 3.2,
    color: colors.cream,
    textTransform: 'uppercase',
  },
  tagDot: {
    color: colors.greenBright,
  },
});
