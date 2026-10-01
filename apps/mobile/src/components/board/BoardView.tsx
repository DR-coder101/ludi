import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Color, GameState, TokenPos } from '@ludi/rules';
import { YARDS, type CellPosition } from './boardLayout';
import { cellOf, hopCells, type BoardModel } from './boardModel';
import { BoardArt, C, pieceCentre, TRACK_PIECE_R, UNITS, yardSlot, type YardLabels } from './BoardArt';
import { PieceDefs, PieceGlyph } from './PieceGlyph';
import { accent, color, layout, motion, PLACES, type PieceColor } from '../../theme/tokens';
import { gameAudio, triggerHaptic } from '../../utils/gameAudio';

export interface HopAnimation {
  tokenIndex: number;
  color: Color;
  /** Board-unit start point (cell centre or yard slot). */
  from: { x: number; y: number };
  cells: CellPosition[];
}

/** Hop for one engine move, starting from wherever the token is drawn now. */
export function makeHop(state: GameState, tokenIndex: number, to: TokenPos): HopAnimation | null {
  const token = state.tokens[tokenIndex];
  if (!token) return null;
  const cells = hopCells(token.pos, to, token.color);
  if (cells.length === 0) return null;
  let from: { x: number; y: number };
  if (token.pos.zone === 'yard') {
    const waiting = state.tokens
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.color === token.color && t.pos.zone === 'yard');
    const slot = yardSlot(token.color, Math.max(0, waiting.findIndex(({ i }) => i === tokenIndex)));
    from = { x: slot.x, y: slot.y - 1 };
  } else {
    const cell = cellOf(token.pos, token.color);
    if (!cell) return null;
    from = pieceCentre(cell.row, cell.col);
  }
  return { tokenIndex, color: token.color, from, cells };
}

interface BoardViewProps {
  /** Outer size including the bevel frame. */
  size: number;
  model: BoardModel;
  labels: YardLabels;
  onTokenPress?: (tokenIndex: number) => void;
  hop?: HopAnimation | null;
  onHopDone?: () => void;
}

function Ripple({ x, y, r, tint }: { x: number; y: number; r: number; tint: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: motion.pulseMs, easing: Easing.out(Easing.quad) }), -1, false);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * 0.6,
    transform: [{ scale: 1 + t.value * 0.15 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ripple, { left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, borderColor: tint }, style]}
    />
  );
}

function Breathe({ engine, s }: { engine: Color; s: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: motion.breatheMs / 2, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.15 + t.value * 0.55 }));
  const tl = YARDS[engine].topLeft;
  const tint = accent[PLACES[engine].piece];
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.breathe,
        {
          left: (tl.col * C + 5) * s,
          top: (tl.row * C + 5) * s,
          width: 150 * s,
          height: 150 * s,
          borderRadius: 9 * s,
          borderColor: tint,
          shadowColor: tint,
        },
        style,
      ]}
    />
  );
}

function HopPiece({ hop, s, onDone }: { hop: HopAnimation; s: number; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const piece: PieceColor = PLACES[hop.color].piece;
  const target = hop.cells.map((c) => pieceCentre(c.row, c.col));
  const end = target[target.length - 1] ?? hop.from;
  const x = useSharedValue((reduce ? end.x : hop.from.x) * s);
  const y = useSharedValue((reduce ? end.y : hop.from.y) * s);
  const lift = useSharedValue(1);
  const fade = useSharedValue(reduce ? 0 : 1);

  useEffect(() => {
    const finish = () => onDone?.();
    if (reduce) {
      fade.value = withTiming(1, { duration: 200 }, (ok) => {
        if (ok) runOnJS(finish)();
      });
      return;
    }
    gameAudio.play('hop');
    const ease = { duration: motion.hopMs, easing: Easing.out(Easing.quad) };
    const half = { duration: motion.hopMs / 2 };
    x.value = withSequence(...target.map((p) => withTiming(p.x * s, ease)));
    y.value = withSequence(
      ...target.map((p, i) =>
        withTiming(p.y * s, ease, i === target.length - 1 ? (ok) => { if (ok) runOnJS(finish)(); } : undefined),
      ),
    );
    lift.value = withSequence(...target.flatMap(() => [withTiming(motion.hopScale, half), withTiming(1, half)]));
    const timers = target.map((_, i) => setTimeout(() => triggerHaptic.light(), (i + 1) * motion.hopMs));
    return () => timers.forEach(clearTimeout);
    // A hop runs once per mount; the parent remounts it per move via `key`.
  }, []);

  const box = TRACK_PIECE_R * 3.2;
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateX: x.value - (box * s) / 2 }, { translateY: y.value - (box * s) / 2 }, { scale: lift.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.hop, { width: box * s, height: box * s }, style]}>
      <Svg width={box * s} height={box * s} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}>
        <PieceDefs />
        <PieceGlyph piece={piece} cx={0} cy={0} r={TRACK_PIECE_R} />
      </Svg>
    </Animated.View>
  );
}

function Bevel({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bevel" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2a2a2e" />
          <Stop offset="0.6" stopColor="#050506" />
          <Stop offset="1" stopColor="#1c1c1f" />
        </LinearGradient>
      </Defs>
      <Rect width={size} height={size} rx={10} fill="url(#bevel)" />
      <Rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={9.5} fill="none" stroke={color.gold} strokeOpacity={0.25} strokeWidth={1} />
      <Rect x={8} y={1} width={size - 16} height={1} fill={color.white} opacity={0.12} />
    </Svg>
  );
}

export function BoardView({ size, model, labels, onTokenPress, hop, onHopDone }: BoardViewProps) {
  const reduce = useReducedMotion();
  const inner = size - layout.boardBevel * 2;
  const s = inner / UNITS;
  const hit = C * 1.3 * s;

  const targets: { key: string; tokenIndex: number; x: number; y: number; r: number; label: string }[] = [];
  for (const p of model.pieces) {
    if (!p.legal) continue;
    const c = pieceCentre(p.row, p.col, p.dx);
    targets.push({ key: p.key, tokenIndex: p.tokenIndex, x: c.x, y: c.y, r: 11.5, label: `Move ${PLACES[p.color].full} piece` });
  }
  for (const yard of Object.values(model.yards)) {
    yard.tokens.forEach((tokenIndex, i) => {
      if (!yard.legal.includes(tokenIndex)) return;
      const c = yardSlot(yard.color, i);
      targets.push({ key: `y${tokenIndex}`, tokenIndex, x: c.x, y: c.y, r: 14.8, label: `Bring out ${PLACES[yard.color].full} piece` });
    });
  }
  const active = Object.values(model.yards).find((y) => y.active && y.seated);

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Bevel size={size} />
      <View style={[styles.inner, { width: inner, height: inner }]}>
        <BoardArt size={inner} model={model} labels={labels} />
        {!reduce && active ? <Breathe engine={active.color} s={s} /> : null}
        {!reduce
          ? targets.map((t) => <Ripple key={`r-${t.key}`} x={t.x * s} y={t.y * s} r={t.r * s} tint={color.gold} />)
          : null}
        {targets.map((t) => (
          <Pressable
            key={`p-${t.key}`}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            onPress={() => onTokenPress?.(t.tokenIndex)}
            style={[styles.hit, { left: t.x * s - hit, top: t.y * s - hit, width: hit * 2, height: hit * 2, borderRadius: hit }]}
          />
        ))}
        {hop ? <HopPiece key={`${hop.tokenIndex}-${hop.cells.length}-${hop.from.x}`} hop={hop} s={s} onDone={onHopDone} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 10,
    padding: layout.boardBevel,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
  },
  inner: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.6,
  },
  breathe: {
    position: 'absolute',
    borderWidth: 3,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  hop: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  hit: {
    position: 'absolute',
  },
});
