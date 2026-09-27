import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Color } from '@ludi/rules';
import { fontFamily, motion as M, palette, places } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/gameAudio';
import type { Seats } from './types';

const AV = 40;
const RING = 52;
const RING_R = 24;
const CIRC = 2 * Math.PI * RING_R;

/** Remaining share of the turn (1 = full), ticking 4× a second. */
function useTurnRemaining(deadline: number | null, warnOnMyTurn: boolean): { share: number; warn: boolean } {
  const [now, setNow] = useState(() => Date.now());
  const started = useRef<{ deadline: number; at: number } | null>(null);
  const warned = useRef(false);

  if (deadline != null && started.current?.deadline !== deadline) {
    started.current = { deadline, at: Date.now() };
    warned.current = false;
  }

  useEffect(() => {
    if (deadline == null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  const left = deadline == null ? Infinity : deadline - now;
  const warn = left <= M.timerWarnMs;
  useEffect(() => {
    if (warn && warnOnMyTurn && deadline != null && !warned.current && left > 0) {
      warned.current = true;
      triggerHaptic.light();
    }
  }, [warn, warnOnMyTurn, deadline, left]);

  if (deadline == null || !started.current) return { share: 1, warn: false };
  const total = Math.max(1, started.current.deadline - started.current.at);
  return { share: Math.max(0, Math.min(1, left / total)), warn };
}

function Avatar({ color, active, share, warn }: { color: Color; active: boolean; share: number; warn: boolean }) {
  const accent = places[color].accent;
  return (
    <View style={styles.avatarBox}>
      <View
        style={[
          styles.avatar,
          { borderColor: accent },
          active ? { shadowColor: accent, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 8 } : null,
        ]}
      >
        <Svg width={AV - 4} height={AV - 4} viewBox="0 0 36 36">
          <Circle cx={18} cy={18} r={18} fill="#35363B" />
          <Circle cx={18} cy={13.7} r={5.4} fill="#8A8C92" />
          <Ellipse cx={18} cy={36} rx={11} ry={11.5} fill="#8A8C92" />
        </Svg>
      </View>
      {active ? (
        <Svg width={RING} height={RING} style={styles.ring} viewBox={`0 0 ${RING} ${RING}`}>
          <Circle cx={RING / 2} cy={RING / 2} r={RING_R + 1.4} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={3} />
          <G rotation={-90} origin={`${RING / 2}, ${RING / 2}`}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RING_R}
              fill="none"
              stroke={warn ? palette.hot : palette.gold}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeDasharray={`${CIRC * share} ${CIRC}`}
            />
          </G>
        </Svg>
      ) : null}
    </View>
  );
}

interface PlayerStripProps {
  colors: Color[];
  seats: Seats;
  turn: Color | null;
  deadline: number | null;
  myTurn: boolean;
}

export function PlayerStrip({ colors, seats, turn, deadline, myTurn }: PlayerStripProps) {
  const { share, warn } = useTurnRemaining(deadline, myTurn);
  return (
    <View style={[styles.strip, colors.length < 4 ? styles.stripCompact : null]}>
      {colors.map((color) => {
        const active = color === turn;
        const place = places[color];
        return (
          <View
            key={color}
            style={styles.player}
            accessible
            accessibilityLabel={`${seats[color]?.name ?? place.full}, ${place.full}${active ? ', playing now' : ''}`}
          >
            <Avatar color={color} active={active} share={share} warn={warn} />
            <Text style={styles.name} numberOfLines={1}>
              {seats[color]?.name ?? place.full}
            </Text>
            <Text style={[styles.place, { color: place.accent }]}>{place.short}</Text>
          </View>
        );
      })}
    </View>
  );
}

const BARS = Array.from({ length: 34 }, (_, i) => 4 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 14);
const EQ_W = BARS.length * 7 - 3;
const EQ_H = 18;

/** Voice activity bars under the player strip. */
export function VoiceBars() {
  return (
    <View style={styles.eq} pointerEvents="none">
      <Svg width={EQ_W} height={EQ_H}>
        <Defs>
          <LinearGradient id="eq" x1="0" y1={EQ_H} x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={palette.green} />
            <Stop offset="1" stopColor={palette.gold} />
          </LinearGradient>
        </Defs>
        {BARS.map((h, i) => (
          <Rect key={i} x={i * 7} y={EQ_H - h} width={4} height={h} rx={2} fill="url(#eq)" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  stripCompact: { justifyContent: 'center', gap: 24 },
  player: { width: 52, alignItems: 'center' },
  avatarBox: { width: RING, height: AV + 4, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: AV,
    height: AV,
    borderRadius: AV / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: '#35363B',
  },
  ring: { position: 'absolute', left: 0, top: (AV + 4 - RING) / 2 },
  name: { marginTop: 2, fontFamily: fontFamily.bodyBold, fontSize: 9.5, letterSpacing: 0.3, color: 'rgba(246,239,217,0.85)' },
  place: { fontFamily: fontFamily.badge, fontSize: 7.5, letterSpacing: 0.8 },
  eq: { height: EQ_H, alignItems: 'center', opacity: 0.55 },
});
