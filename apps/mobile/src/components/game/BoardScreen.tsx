import React, { useState, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Color, GameState } from '@ludi/rules';
import { buildBoardModel, type MoveLike } from '../board/boardModel';
import { BoardView, type HopAnimation } from '../board/BoardView';
import { layout, TURN_ORDER, color, font } from '../../theme/tokens';
import { useLudiFonts } from '../../theme/fonts';
import { ScreenBackdrop } from './ScreenBackdrop';
import { TopBar } from './TopBar';
import { SideRail, type RailItem } from './SideRail';
import { TurnCard } from './TurnCard';
import { PlayerStrip, type TurnTimer } from './PlayerStrip';
import { Equalizer } from './Equalizer';
import { CallBar, type CallBarProps } from '../video/CallBar';
import type { SeatVideo } from '../video/seatVideo';
import { turnCopy } from './turnCopy';
import { activeDie, canPickDie, diceFaces, moveForToken, type DieIndex } from './diceModel';

export interface BoardScreenProps {
  state: GameState;
  /** Legal moves this device may make now; empty while someone else acts. */
  moves: MoveLike[];
  /** Colour played on this device; null for pass-and-play, where every turn is local. */
  me: Color | null;
  names: Partial<Record<Color, string>>;
  muted?: Partial<Record<Color, boolean>>;
  roomCode: string | null;
  /** Last throw, kept after the engine clears `dice` on an auto-pass. */
  lastRoll: readonly [number, number] | null;
  rollKey: number;
  timer?: TurnTimer | null;
  hop?: HopAnimation | null;
  onHopDone?: () => void;
  onRoll?: () => void;
  /** Plays one die of the current throw. */
  onMove?: (move: MoveLike) => void;
  onMenu?: () => void;
  onProfile?: () => void;
  voice?: { on: boolean; onToggle: () => void } | null;
  chat?: { unread: number; onToggle: () => void } | null;
  call?: CallBarProps | null;
  seats?: Partial<Record<Color, SeatVideo>>;
  notice?: string | null;
  /** Overrides device safe-area insets (the dev preview simulates an iPhone frame on web). */
  insets?: { top: number; bottom: number };
  /** Toasts, banners and sheets drawn above the board. */
  children?: ReactNode;
}

const MAX_COLUMN = 520;

export function BoardScreen(props: BoardScreenProps) {
  const { state, moves, me, names, muted, roomCode, lastRoll, rollKey, timer, hop, onHopDone } = props;
  const { onRoll, onMove, onMenu, onProfile, voice, chat, call, seats, notice, children } = props;
  const fontsReady = useLudiFonts();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const { width, height } = useWindowDimensions();

  const columnWidth = Math.min(width, MAX_COLUMN);
  const topBarTop = insets.top + 7;
  const boardTop = topBarTop + layout.topBarHeight + layout.topBarGap;
  const bottomPad = Math.max(insets.bottom - 10, 8);
  const roomForBoard = height - boardTop - layout.boardGap - layout.lowerHeight - bottomPad;
  const boardSize = Math.floor(Math.max(240, Math.min(columnWidth - layout.boardInset * 2, roomForBoard)));
  const lowerTop = boardTop + boardSize + layout.boardGap;

  const isMine = me === null || state.turn === me;
  const awaitingRoll = state.phase === 'awaiting_roll';
  const canRoll = isMine && awaitingRoll && !hop && !!onRoll;
  const activeMoves = isMine && !hop ? moves : [];
  const hidden = hop ? [hop.tokenIndex] : [];
  const [pick, setPick] = useState<{ rollKey: number; die: DieIndex } | null>(null);
  const picked = pick?.rollKey === rollKey ? pick.die : null;
  const active = activeDie(activeMoves, picked);
  const pickable = canPickDie(activeMoves);

  const model = buildBoardModel(state, activeMoves, { hidden, focusDie: active });
  const seatedOrder = TURN_ORDER.filter((c) => state.config.playerColors.includes(c));
  const copy = turnCopy({
    phase: state.phase,
    dice: state.dice,
    consecutiveSixes: state.consecutiveSixes,
    turn: state.turn,
    winner: state.winner,
    isMine,
    name: names[state.turn],
    canBringOut: moves.some((m) => state.tokens[m.tokenIndex]?.pos.zone === 'yard'),
    canPickDie: pickable,
  });
  const onTokenPress = onMove
    ? (tokenIndex: number) => {
        const move = moveForToken(activeMoves, tokenIndex, active);
        if (move) onMove(move);
      }
    : undefined;

  const left: RailItem[] = [
    { key: 'players', icon: 'users', label: 'Players', sub: `${seatedOrder.length}/4`, subTone: 'cream' },
    voice
      ? {
          key: 'voice',
          icon: 'mic',
          label: 'Voice',
          sub: voice.on ? 'On' : 'Off',
          subTone: voice.on ? 'green' : 'muted',
          tone: voice.on ? 'voice' : 'dark',
          a11y: voice.on ? 'Mute microphone' : 'Unmute microphone',
          onPress: voice.onToggle,
        }
      : { key: 'voice', icon: 'mic', label: 'Voice', sub: 'Off', subTone: 'muted' },
    { key: 'chat', icon: 'chat', label: 'Chat', badge: chat?.unread || undefined, onPress: chat?.onToggle },
  ];
  const right: RailItem[] = [
    { key: 'emojis', icon: 'smile', label: 'Emojis' },
    { key: 'roll', icon: 'dice', label: 'Roll Dice', tone: canRoll ? 'gold' : 'dark', onPress: canRoll ? onRoll : undefined },
    { key: 'settings', icon: 'gear', label: 'Settings' },
  ];

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      {fontsReady ? (
        <View style={[styles.column, { width: columnWidth }]}>
          <View style={[styles.topBar, { top: topBarTop }]}>
            <TopBar roomCode={roomCode} onMenu={onMenu} onProfile={onProfile} />
          </View>
          <View style={[styles.board, { top: boardTop, left: (columnWidth - boardSize) / 2 }]}>
            <BoardView
              size={boardSize}
              model={model}
              labels={{ names, me, muted: muted ?? {}, video: roomCode !== null, seats }}
              onTokenPress={onTokenPress}
              hop={hop}
              onHopDone={onHopDone}
            />
          </View>
          <View style={[styles.lower, { top: lowerTop }]}>
            <View style={[styles.rail, { left: layout.railInset }]}>
              <SideRail items={left} />
            </View>
            <View style={[styles.rail, { right: layout.railInset }]}>
              <SideRail items={right} />
            </View>
            <View style={styles.centre}>
              <TurnCard
                copy={copy}
                dice={diceFaces(state.dice, lastRoll)}
                rollKey={rollKey}
                idle={awaitingRoll}
                activeDie={activeMoves.length > 0 ? active : null}
                onRoll={canRoll ? onRoll : undefined}
                onPickDie={pickable ? (die) => setPick({ rollKey, die }) : undefined}
              />
              <View style={styles.strip}>
                {call ? (
                  <CallBar {...call} />
                ) : (
                  <PlayerStrip order={seatedOrder} turn={state.turn} names={names} timer={timer} />
                )}
              </View>
              {call ? null : (
                <View style={styles.eq}>
                  <Equalizer width={columnWidth - CENTRE_INSET * 2} />
                </View>
              )}
            </View>
          </View>
        </View>
      ) : null}
      {notice ? (
        <View style={styles.notice} pointerEvents="none">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const CENTRE_INSET = layout.railInset + layout.railWidth + layout.railInset;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  board: {
    position: 'absolute',
  },
  lower: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  rail: {
    position: 'absolute',
    top: 4,
  },
  centre: {
    position: 'absolute',
    top: 4,
    left: CENTRE_INSET,
    right: CENTRE_INSET,
  },
  strip: {
    position: 'absolute',
    top: layout.turnCardHeight + layout.stripGap,
    left: 0,
    right: 0,
  },
  eq: {
    position: 'absolute',
    top: layout.turnCardHeight + layout.stripGap + 70,
    left: 0,
    right: 0,
  },
  notice: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: color.ink,
  },
  noticeText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    color: color.cream,
  },
});
