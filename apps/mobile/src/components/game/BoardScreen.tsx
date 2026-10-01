import React, { type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Color, GameState } from '@ludi/rules';
import { buildBoardModel, type MoveLike } from '../board/boardModel';
import { BoardView, type HopAnimation } from '../board/BoardView';
import { layout, TURN_ORDER, color } from '../../theme/tokens';
import { useLudiFonts } from '../../theme/fonts';
import { ScreenBackdrop } from './ScreenBackdrop';
import { TopBar } from './TopBar';
import { SideRail, type RailItem } from './SideRail';
import { TurnCard } from './TurnCard';
import { PlayerStrip, type TurnTimer } from './PlayerStrip';
import { Equalizer } from './Equalizer';
import { turnCopy } from './turnCopy';

export interface BoardScreenProps {
  state: GameState;
  /** Legal moves this device may make now; empty while someone else acts. */
  moves: MoveLike[];
  /** Colour played on this device; null for pass-and-play, where every turn is local. */
  me: Color | null;
  names: Partial<Record<Color, string>>;
  muted?: Partial<Record<Color, boolean>>;
  roomCode: string | null;
  /** Last value thrown, kept after the engine clears `dice` on an auto-pass. */
  lastRoll: number | null;
  rollKey: number;
  timer?: TurnTimer | null;
  hop?: HopAnimation | null;
  onHopDone?: () => void;
  onRoll?: () => void;
  onTokenPress?: (tokenIndex: number) => void;
  onMenu?: () => void;
  onProfile?: () => void;
  voice?: { on: boolean; onToggle: () => void } | null;
  chat?: { unread: number; onToggle: () => void } | null;
  /** Overrides device safe-area insets (the dev preview simulates an iPhone frame on web). */
  insets?: { top: number; bottom: number };
  /** Toasts, banners and sheets drawn above the board. */
  children?: ReactNode;
}

const MAX_COLUMN = 520;

export function BoardScreen(props: BoardScreenProps) {
  const { state, moves, me, names, muted, roomCode, lastRoll, rollKey, timer, hop, onHopDone } = props;
  const { onRoll, onTokenPress, onMenu, onProfile, voice, chat, children } = props;
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

  const model = buildBoardModel(state, activeMoves, { hidden });
  const seatedOrder = TURN_ORDER.filter((c) => state.config.playerColors.includes(c));
  const copy = turnCopy({
    phase: state.phase,
    dice: state.dice,
    turn: state.turn,
    winner: state.winner,
    isMine,
    name: names[state.turn],
    canBringOut: activeMoves.some((m) => state.tokens[m.tokenIndex]?.pos.zone === 'yard'),
  });

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
              labels={{ names, me, muted: muted ?? {} }}
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
                dice={lastRoll ?? state.dice ?? 5}
                rollKey={rollKey}
                idle={awaitingRoll}
                onRoll={canRoll ? onRoll : undefined}
              />
              <View style={styles.strip}>
                <PlayerStrip order={seatedOrder} turn={state.turn} names={names} timer={timer} />
              </View>
              <View style={styles.eq}>
                <Equalizer />
              </View>
            </View>
          </View>
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
});
