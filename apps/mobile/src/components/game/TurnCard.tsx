import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color, font, layout } from '../../theme/tokens';
import type { Die } from '@ludi/rules';
import type { TurnCopy } from './turnCopy';
import { DiceFace } from './DiceFace';
import type { DieIndex } from './diceModel';

interface TurnCardProps {
  copy: TurnCopy;
  dice: readonly Die[];
  rollKey: number;
  /** Awaiting a roll: tilted dice, roll on press. */
  idle: boolean;
  /** Die a piece tap plays, ringed in gold; null when none is in play. */
  activeDie: DieIndex | null;
  onRoll?: () => void;
  /** Set while the player may choose which die to play. */
  onPickDie?: (dieIndex: DieIndex) => void;
}

const DIE_SIZE = 40;

/** Card face: dark gradient, flag band, red halftone fading in from the bottom-right corner. */
function CardFace() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="tc-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a1a1d" />
          <Stop offset="1" stopColor={color.yard} />
        </LinearGradient>
        <Pattern id="tc-dots" width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.2} fill={color.red} fillOpacity={0.22} />
        </Pattern>
        <RadialGradient id="tc-fade" cx="100%" cy="100%" r="105%" fx="100%" fy="100%">
          <Stop offset="0" stopColor="#fff" stopOpacity={1} />
          <Stop offset="0.7" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="tc-mask">
          <Rect width="100%" height="100%" fill="url(#tc-fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#tc-bg)" />
      <Rect y={6} width="100%" height="100%" fill="url(#tc-dots)" mask="url(#tc-mask)" />
      <Rect width="33.3%" height={6} fill={color.green} />
      <Rect x="33.3%" width="33.3%" height={6} fill={color.gold} />
      <Rect x="66.6%" width="33.4%" height={6} fill={color.bg} />
    </Svg>
  );
}

export function TurnCard({ copy, dice, rollKey, idle, activeDie, onRoll, onPickDie }: TurnCardProps) {
  const canRoll = idle && !!onRoll;
  const buzzOn = dice.some((d) => d.value === 6);
  const faces = dice.map((d) => d.value).join(' and ');
  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <CardFace />
        <View style={styles.content}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker} numberOfLines={1}>
              {copy.kicker}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {copy.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {copy.sub}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={canRoll ? 'Roll the dice' : `Dice show ${faces}`}
            accessibilityState={{ disabled: !canRoll }}
            disabled={!canRoll}
            onPress={onRoll}
            style={styles.diceRow}
          >
            <View style={styles.pair}>
              {dice.map((die, i) => {
                const index = i as DieIndex;
                const pickable = !idle && !die.used && !!onPickDie;
                const isActive = activeDie === index;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Die ${i + 1} shows ${die.value}${die.used ? ', played' : ''}`}
                    accessibilityState={{ disabled: !pickable, selected: isActive }}
                    disabled={!pickable}
                    onPress={() => onPickDie?.(index)}
                    style={[styles.dieSlot, isActive && styles.dieActive]}
                  >
                    <View style={die.used && styles.dieUsed}>
                      <DiceFace
                        value={die.value}
                        size={DIE_SIZE}
                        rollKey={rollKey}
                        idle={idle}
                        spin={i === 0 ? 1 : -1}
                        buzz={i === 0 && buzzOn}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {copy.cta ? (
              <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {copy.cta}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    height: layout.turnCardHeight,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 13,
    elevation: 10,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.red,
    shadowColor: color.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  kicker: {
    fontFamily: font.sticker,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: color.redText,
  },
  title: {
    // Stretch so adjustsFontSizeToFit can shrink long titles inside the centred column.
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: font.display,
    fontSize: 29,
    lineHeight: 30,
    letterSpacing: 0.5,
    color: color.gold,
    textShadowColor: color.greenDeep,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0.1,
  },
  sub: {
    marginTop: 3,
    fontFamily: font.body,
    fontSize: 13,
    color: color.creamSoft,
  },
  diceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pair: {
    flexDirection: 'row',
    gap: 2,
  },
  dieSlot: {
    padding: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dieActive: {
    borderColor: color.gold,
  },
  dieUsed: {
    opacity: 0.3,
  },
  pill: {
    flexShrink: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: color.gold,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  pillText: {
    fontFamily: font.sticker,
    fontSize: 10,
    letterSpacing: 1,
    color: color.bg,
  },
});
