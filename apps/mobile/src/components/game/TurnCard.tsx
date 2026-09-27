import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Color } from '@ludi/rules';
import { DicePair } from './DicePair';
import { PressableScale } from './PressableScale';
import type { TurnCopy } from './turnCopy';
import { elevation, fontFamily, palette, places, radius } from '../../theme/tokens';

interface TurnCardProps {
  color: Color;
  copy: TurnCopy;
  dice: { value: number | null; idle: boolean; rollKey: number };
  onRoll?: () => void;
  onDiceSettled?: () => void;
}

function Halftone({ color }: { color: Color }) {
  const tint = places[color].accent;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <Pattern id={`tc-dots-${color}`} width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.1} fill={tint} />
        </Pattern>
        <RadialGradient id="tc-fade" cx="100%" cy="100%" r="90%">
          <Stop offset="0" stopColor={palette.white} stopOpacity={1} />
          <Stop offset="0.7" stopColor={palette.white} stopOpacity={0} />
        </RadialGradient>
        <Mask id="tc-mask">
          <Rect width="100%" height="100%" fill="url(#tc-fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#tc-dots-${color})`} mask="url(#tc-mask)" opacity={0.22} />
    </Svg>
  );
}

export function TurnCard({ color, copy, dice, onRoll, onDiceSettled }: TurnCardProps) {
  const place = places[color];
  const canRoll = copy.cta === 'roll' && !!onRoll;
  return (
    <View style={styles.card}>
      <View style={styles.band}>
        <View style={[styles.bandPart, { backgroundColor: palette.green }]} />
        <View style={[styles.bandPart, { backgroundColor: palette.gold }]} />
        <View style={[styles.bandPart, { backgroundColor: palette.bg }]} />
      </View>
      <View style={styles.halftone} pointerEvents="none">
        <Halftone color={color} />
      </View>
      <View style={styles.content}>
        <View style={styles.kickerRow}>
          <View style={[styles.kickerDot, { backgroundColor: place.homeFill, shadowColor: place.homeFill }]} />
          <Text style={[styles.kicker, { color: place.accent }]} numberOfLines={1}>
            {copy.kicker}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {copy.sub}
        </Text>
        <View style={styles.diceRow}>
          <PressableScale
            onPress={canRoll ? onRoll : undefined}
            disabled={!canRoll}
            accessibilityRole="button"
            accessibilityLabel={canRoll ? 'Roll the dice' : 'Dice'}
          >
            <DicePair value={dice.value} idle={dice.idle} rollKey={dice.rollKey} onSettled={onDiceSettled} />
          </PressableScale>
          {copy.cta ? (
            <PressableScale
              onPress={canRoll ? onRoll : undefined}
              disabled={!canRoll}
              style={styles.pill}
              accessibilityRole="button"
              accessibilityLabel={copy.cta === 'roll' ? 'Tap to roll' : 'Pick a piece on the board'}
            >
              <Text style={styles.pillText}>{copy.cta === 'roll' ? 'TAP TO ROLL' : 'PICK A PIECE'}</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 172,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: palette.ink,
    borderWidth: 1,
    borderColor: palette.surfaceLine,
    ...elevation.card,
  },
  band: { height: 6, flexDirection: 'row' },
  bandPart: { flex: 1 },
  halftone: { position: 'absolute', left: 0, right: 0, top: 6, bottom: 0 },
  content: { paddingTop: 14, paddingHorizontal: 12, alignItems: 'center' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kickerDot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  kicker: { fontFamily: fontFamily.badge, fontSize: 9.5, letterSpacing: 1.6 },
  title: {
    marginTop: 4,
    fontFamily: fontFamily.display,
    fontSize: 29,
    lineHeight: 34,
    letterSpacing: 0.5,
    color: palette.gold,
    textShadowColor: palette.greenDeep,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0.1,
  },
  sub: { marginTop: 1, fontFamily: fontFamily.body, fontSize: 13, color: palette.textSoft },
  diceRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: palette.gold,
    ...elevation.goldCta,
  },
  pillText: { fontFamily: fontFamily.badge, fontSize: 10, letterSpacing: 1, color: palette.bg },
});
