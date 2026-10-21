import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { boardFont, color, layout } from '../../theme/tokens';
import type { Die } from '@ludi/rules';
import type { TurnCopy } from './turnCopy';
import { DiceFace } from './DiceFace';
import type { DieIndex } from './diceModel';
import { dieStatusLabel } from './dieStatus';
import { turnTitleLineHeight, turnTitleSize, TURN_TITLE_MAX } from './turnTitle';
import { Button3D } from '../ui/Button3D';
import { Card3D } from '../ui/Card3D';

interface TurnCardProps {
  copy: TurnCopy;
  dice: readonly Die[];
  rollKey: number;
  idle: boolean;
  activeDie: DieIndex | null;
  onRoll?: () => void;
  onPickDie?: (dieIndex: DieIndex) => void;
}

const DIE_SIZE = 40;

export function TurnCard({ copy, dice, rollKey, idle, activeDie, onRoll, onPickDie }: TurnCardProps) {
  const canRoll = idle && !!onRoll;
  const buzzOn = dice.some((d) => d.value === 6);
  const faces = dice.map((d) => d.value).join(' and ');
  const [titleWidth, setTitleWidth] = useState(0);
  const titleSize = titleWidth > 0 ? turnTitleSize(copy.title, titleWidth) : TURN_TITLE_MAX;
  return (
    <Card3D tone="carbon" style={styles.card}>
      <View style={styles.flag}>
        <View style={[styles.flagSeg, { backgroundColor: color.green, flex: 35 }]} />
        <View style={[styles.flagSeg, { backgroundColor: color.gold, flex: 45 }]} />
        <View style={[styles.flagSeg, { backgroundColor: color.red, flex: 20 }]} />
      </View>
      <View style={styles.kickerRow}>
        <View style={styles.kickerDot} />
        <Text style={styles.kicker} numberOfLines={1}>
          {copy.kicker}
        </Text>
      </View>
      <View
        style={styles.titleBox}
        onLayout={(e) => {
          const next = e.nativeEvent.layout.width;
          setTitleWidth((prev) => (prev === next ? prev : next));
        }}
      >
        <Text
          style={[styles.title, { fontSize: titleSize, lineHeight: turnTitleLineHeight(titleSize) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        >
          {copy.title}
        </Text>
      </View>
      <Text style={styles.sub} numberOfLines={1}>
        {copy.sub}
      </Text>
      <View style={styles.diceRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canRoll ? 'Dice' : `Dice show ${faces}`}
          accessibilityState={{ disabled: !canRoll }}
          disabled={!canRoll}
          onPress={onRoll}
          style={styles.pair}
        >
          {dice.map((die, i) => {
            const index = i as DieIndex;
            const pickable = !idle && !die.used && !!onPickDie;
            const isActive = activeDie === index;
            const tag = dieStatusLabel(die.used, isActive);
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Die ${i + 1} shows ${die.value}${die.used ? ', played' : ''}`}
                accessibilityState={{ disabled: !pickable, selected: isActive }}
                disabled={!pickable}
                onPress={() => onPickDie?.(index)}
                style={[styles.dieSlot, isActive ? styles.dieActive : null]}
              >
                <View style={die.used ? styles.dieUsed : null}>
                  <DiceFace
                    value={die.value}
                    size={DIE_SIZE}
                    rollKey={rollKey}
                    idle={idle}
                    spin={i === 0 ? 1 : -1}
                    buzz={i === 0 && buzzOn}
                  />
                </View>
                {tag ? <Text style={styles.dieTag}>{tag}</Text> : null}
              </Pressable>
            );
          })}
        </Pressable>
        {copy.cta ? (
          <Button3D
            tone="gold"
            compact
            label={canRoll ? 'Roll the dice' : copy.cta}
            onPress={canRoll ? onRoll : undefined}
            style={styles.cta}
          >
            <Text style={styles.ctaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {copy.cta}
            </Text>
          </Button3D>
        ) : null}
      </View>
    </Card3D>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: layout.turnCardHeight - 20,
  },
  flag: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    height: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  flagSeg: {
    height: 6,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.red,
  },
  kicker: {
    fontFamily: boardFont.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.6,
    color: color.redText,
    textTransform: 'uppercase',
  },
  titleBox: {
    alignSelf: 'stretch',
    marginTop: 2,
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontFamily: boardFont.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 0.8,
    color: color.gold,
  },
  sub: {
    marginTop: 4,
    fontFamily: boardFont.body,
    fontSize: 11,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  diceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
  dieTag: {
    marginTop: 1,
    fontFamily: boardFont.bodyBold,
    fontSize: 6,
    letterSpacing: 0.6,
    color: color.creamMuted,
    textAlign: 'center',
  },
  cta: {
    flexShrink: 1,
    minWidth: 120,
  },
  ctaText: {
    fontFamily: boardFont.display,
    fontSize: 20,
    letterSpacing: 1,
    color: color.bg,
  },
});
