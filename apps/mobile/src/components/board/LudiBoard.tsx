import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { GameState } from '@ludi/rules';
import { AnimatedPiece } from './AnimatedPiece';
import { BoardArt } from './BoardArt';
import { HighlightLayer, TurnGlow } from './HighlightLayer';
import {
  layoutPieces,
  planBoardMotions,
  planHighlights,
  type LegalMoveLike,
  type PieceLayout,
  type PieceMotion,
} from './boardModel';
import { boardGeometry, elevation, motion as M, palette } from '../../theme/tokens';
import { gameAudio } from '../../utils/gameAudio';
import type { Seats } from '../game/types';

type BoardState = Pick<GameState, 'tokens' | 'turn' | 'phase' | 'dice'>;

export interface LudiBoardProps {
  /** Outer size including the 4 pt bevel frame. */
  size: number;
  state: BoardState;
  /** Moves to highlight; pass [] when it is not this device's turn. */
  legalMoves: readonly LegalMoveLike[];
  onTokenPress?: (tokenIndex: number) => void;
  seats: Seats;
  live?: boolean;
}

interface Snapshot {
  tokens: BoardState['tokens'];
  layouts: PieceLayout[];
  motions: (PieceMotion | null)[];
}

function useMotions(tokens: BoardState['tokens'], layouts: PieceLayout[]): (PieceMotion | null)[] {
  const last = useRef<Snapshot | null>(null);
  const prev = last.current;
  if (!prev || prev.tokens !== tokens) {
    const motions = prev
      ? planBoardMotions(prev.tokens, prev.layouts, tokens, layouts, M.hopMsPerCell)
      : tokens.map(() => null);
    last.current = { tokens, layouts, motions };
  }
  return last.current!.motions;
}

export function LudiBoard({ size, state, legalMoves, onTokenPress, seats, live = false }: LudiBoardProps) {
  const reducedMotion = useReducedMotion();
  const inner = size - boardGeometry.frameBevel * 2;
  const k = inner / boardGeometry.viewBox;

  const layouts = useMemo(() => layoutPieces(state.tokens), [state.tokens]);
  const motions = useMotions(state.tokens, layouts);

  useEffect(() => {
    if (motions.some((m) => m?.kind === 'capture')) gameAudio.play('capture');
    else if (motions.some((m) => m?.kind === 'hop' || m?.kind === 'enter')) gameAudio.play('hop');
  }, [motions]);

  const highlights = useMemo(
    () => planHighlights(state.tokens, legalMoves, state.dice, layouts),
    [state.tokens, legalMoves, state.dice, layouts],
  );
  const highlightColors = useMemo(
    () => highlights.map((h) => state.tokens[h.tokenIndex].color),
    [highlights, state.tokens],
  );
  const legal = useMemo(() => new Set(legalMoves.map((m) => m.tokenIndex)), [legalMoves]);

  const handlePress = useCallback(
    (tokenIndex: number) => {
      const stack = layouts[tokenIndex]?.stack ?? [tokenIndex];
      const pick = stack.find((i) => legal.has(i));
      if (pick !== undefined) onTokenPress?.(pick);
    },
    [layouts, legal, onTokenPress],
  );

  const activeColor = state.phase === 'finished' ? null : state.turn;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bevel" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2A2A2E" />
            <Stop offset="0.6" stopColor="#050506" />
            <Stop offset="1" stopColor="#1C1C1F" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0.5}
          y={0.5}
          width={size - 1}
          height={size - 1}
          rx={boardGeometry.frameRadius}
          fill="url(#bevel)"
          stroke={palette.gold}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      </Svg>
      <View style={[styles.inner, { width: inner, height: inner }]}>
        <BoardArt size={inner} activeColor={activeColor} seats={seats} live={live} />
        {activeColor ? <TurnGlow color={activeColor} k={k} reducedMotion={reducedMotion} /> : null}
        <HighlightLayer highlights={highlights} colors={highlightColors} k={k} reducedMotion={reducedMotion} />
        {layouts.map((layout) => (
          <AnimatedPiece
            key={layout.tokenIndex}
            layout={layout}
            motion={motions[layout.tokenIndex] ?? null}
            k={k}
            reducedMotion={reducedMotion}
            legal={layout.stack.some((i) => legal.has(i))}
            onPress={onTokenPress ? handlePress : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: boardGeometry.frameRadius,
    backgroundColor: palette.bg,
    ...elevation.board,
  },
  inner: {
    position: 'absolute',
    left: boardGeometry.frameBevel,
    top: boardGeometry.frameBevel,
    borderRadius: boardGeometry.innerRadius,
    overflow: 'hidden',
  },
});
