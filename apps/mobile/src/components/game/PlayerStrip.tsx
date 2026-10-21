import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Color } from '@ludi/rules';
import { PortraitAvatar } from '../video/PortraitAvatar';
import { accent, boardFont, color, PLACES } from '../../theme/tokens';

export interface TurnTimer {
  fraction: number;
  urgent: boolean;
}

interface PlayerStripProps {
  order: Color[];
  turn: Color;
  names: Partial<Record<Color, string>>;
  me: Color | null;
  timer?: TurnTimer | null;
}

export function PlayerStrip({ order, turn, names, me }: PlayerStripProps) {
  return (
    <View style={styles.strip}>
      {order.map((engine) => {
        const place = PLACES[engine];
        const tint = accent[place.piece];
        const you = me === engine;
        const raw = names[engine] ?? place.full;
        const name = you ? `${raw} (You)` : raw;
        return (
          <View
            key={engine}
            style={styles.player}
            accessibilityLabel={`${name}, ${place.full}${engine === turn ? ', playing' : ''}`}
          >
            <View style={[styles.avatar, { borderColor: tint }]}>
              <View style={styles.face}>
                <PortraitAvatar piece={place.piece} />
              </View>
              <View style={styles.dot} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.place, { color: tint }]}>{place.short === 'KINGSTON' ? 'Kingston' : titleCase(place.short)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function titleCase(value: string): string {
  if (value === 'MOBAY') return 'Mobay';
  if (value === 'OCHI') return 'Ochi';
  if (value === 'NEGRIL') return 'Negril';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121A17',
    borderWidth: 1,
    borderColor: '#23322D',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
  },
  player: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'visible',
  },
  face: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.greenBright,
    borderWidth: 2,
    borderColor: '#121A17',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: boardFont.bodyBlack,
    fontSize: 9,
    color: color.white,
  },
  place: {
    fontFamily: boardFont.bodyBold,
    fontSize: 8,
  },
});
