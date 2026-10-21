import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { boardFont, color } from '../../theme/tokens';
import { Icon } from './Icon';
import type { SoundMode } from './boardChrome';

const HEIGHTS = [6, 10, 16, 22, 14, 26, 18, 30, 20, 12, 24, 28, 16, 10, 22, 26, 14, 8, 18, 12, 6];
const BAR = 4;
const GAP = 3;
const HEIGHT = 30;

export function Equalizer({ mode }: { mode: SoundMode }) {
  const voice = mode.kind === 'voice';
  const tint = voice ? mode.tint : color.gold;
  const label = voice ? `${mode.name.toUpperCase()} SPEAKING` : 'GAME SOUND';
  const total = HEIGHTS.length * BAR + (HEIGHTS.length - 1) * GAP;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.badge, { borderColor: tint, backgroundColor: voice ? 'rgba(230,26,53,0.2)' : 'rgba(255,209,0,0.15)' }]}>
        <Icon name={voice ? 'mic' : 'speaker'} size={12} color={tint} strokeWidth={2} />
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      <Svg width={total} height={HEIGHT}>
        {HEIGHTS.map((h, i) => (
          <Rect
            key={i}
            x={i * (BAR + GAP)}
            y={HEIGHT - h}
            width={BAR}
            height={h}
            rx={2}
            fill={tint}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: boardFont.bodyBlack,
    fontSize: 9,
    letterSpacing: 1,
  },
});
