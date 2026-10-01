import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G } from 'react-native-svg';
import type { Color } from '@ludi/rules';
import { accent, color, font, PLACES } from '../../theme/tokens';

export interface TurnTimer {
  /** Remaining share of the turn, 0..1. */
  fraction: number;
  urgent: boolean;
}

interface PlayerStripProps {
  order: Color[];
  turn: Color;
  names: Partial<Record<Color, string>>;
  timer?: TurnTimer | null;
}

const AV = 40;
const RING = 52;
const RING_R = 24;
const RING_LEN = 2 * Math.PI * RING_R;

/** `.order .av` background: head at 26% of the farthest-corner radius, shoulders a 60%×45% ellipse on the bottom edge. */
function Silhouette() {
  return (
    <Svg width={AV - 4} height={AV - 4} viewBox="0 0 36 36">
      <Defs>
        <ClipPath id="av-clip">
          <Circle cx={18} cy={18} r={18} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#av-clip)">
        <Circle cx={18} cy={18} r={18} fill="#35363b" />
        <Circle cx={18} cy={13.68} r={7.45} fill="#8a8c92" />
        <Ellipse cx={18} cy={36} rx={21.2} ry={15.9} fill="#8a8c92" />
      </G>
    </Svg>
  );
}

export function PlayerStrip({ order, turn, names, timer }: PlayerStripProps) {
  return (
    <View style={[styles.strip, order.length < 4 ? styles.stripFew : null]}>
      {order.map((engine) => {
        const place = PLACES[engine];
        const tint = accent[place.piece];
        const on = engine === turn;
        return (
          <View key={engine} style={styles.player} accessibilityLabel={`${names[engine] ?? place.full}, ${place.full}${on ? ', playing' : ''}`}>
            <View style={[styles.avatar, { borderColor: tint }, on ? styles.avatarOn : null]}>
              <Silhouette />
              {on ? <View style={styles.halo} /> : null}
              {on && timer ? (
                <Svg width={RING - 4} height={RING - 4} viewBox="0 0 52 52" style={styles.timer}>
                  <Circle
                    cx={26}
                    cy={26}
                    r={RING_R}
                    fill="none"
                    stroke={timer.urgent ? color.hot : color.gold}
                    strokeWidth={2.4}
                    strokeDasharray={`${Math.max(0, Math.min(1, timer.fraction)) * RING_LEN} 200`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                  />
                </Svg>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {names[engine] ?? place.full}
            </Text>
            <Text style={[styles.place, { color: tint }]}>{place.short}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripFew: {
    justifyContent: 'space-evenly',
  },
  player: {
    width: 52,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: AV,
    height: AV,
    borderRadius: AV / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35363b',
  },
  avatarOn: {
    shadowColor: color.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 9,
    elevation: 8,
  },
  halo: {
    position: 'absolute',
    left: -5,
    top: -5,
    width: AV + 6,
    height: AV + 6,
    borderRadius: (AV + 6) / 2,
    borderWidth: 3,
    borderColor: 'rgba(228,32,46,0.35)',
  },
  timer: {
    position: 'absolute',
    left: -6,
    top: -6,
  },
  name: {
    fontFamily: font.bodyBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
    color: 'rgba(246,239,217,0.85)',
  },
  place: {
    marginTop: -3,
    fontFamily: font.sticker,
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
});
