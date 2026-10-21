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
import { TurnCard } from './TurnCard';
import { PlayerStrip, type TurnTimer } from './PlayerStrip';
import { Equalizer } from './Equalizer';
import { ActionDock } from './ActionDock';
import { LeaveConfirm } from './LeaveConfirm';
import { boardChrome, speakingSeat } from './boardChrome';
import type { CallBarProps } from '../video/CallBar';
import type { SeatVideo } from '../video/seatVideo';
import { turnCopy } from './turnCopy';
import { activeDie, canPickDie, diceFaces, moveForToken, type DieIndex } from './diceModel';

export interface BoardScreenProps {
  state: GameState;
  moves: MoveLike[];
  me: Color | null;
  names: Partial<Record<Color, string>>;
  muted?: Partial<Record<Color, boolean>>;
  roomCode: string | null;
  lastRoll: readonly [number, number] | null;
  rollKey: number;
  timer?: TurnTimer | null;
  hop?: HopAnimation | null;
  onHopDone?: () => void;
  onRoll?: () => void;
  onMove?: (move: MoveLike) => void;
  onMenu?: () => void;
  onProfile?: () => void;
  voice?: { on: boolean; onToggle: () => void } | null;
  chat?: { unread: number; onToggle: () => void } | null;
  call?: CallBarProps | null;
  seats?: Partial<Record<Color, SeatVideo>>;
  notice?: string | null;
  insets?: { top: number; bottom: number };
  children?: ReactNode;
  leaveOpen?: boolean;
}

const MAX_COLUMN = 520;

export function BoardScreen(props: BoardScreenProps) {
  const { state, moves, me, names, muted, roomCode, lastRoll, rollKey, hop, onHopDone } = props;
  const { onRoll, onMove, onMenu, onProfile, voice, chat, call, seats, notice, children } = props;
  const fontsReady = useLudiFonts();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const { width, height } = useWindowDimensions();
  const [leaving, setLeaving] = useState(!!props.leaveOpen);

  const columnWidth = Math.min(width, MAX_COLUMN);
  const live = !!call;
  const chrome = boardChrome({
    live,
    roomCode,
    chat: !!chat,
    speaking: speakingSeat(seats, names),
  });
  const dockH = chrome.dock.length > 0 ? layout.dockHeight : 0;
  const bottomPad = Math.max(insets.bottom - 8, 8);
  const chromeH =
    insets.top +
    7 +
    layout.topBarHeight +
    layout.topBarGap +
    layout.boardGap +
    layout.soundHeight +
    layout.stripGap +
    40 +
    layout.stripGap +
    layout.turnCardHeight +
    (dockH ? layout.stripGap + dockH : 0) +
    bottomPad;
  const boardSize = Math.floor(Math.max(240, Math.min(columnWidth - 24, height - chromeH)));

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

  return (
    <View style={styles.screen}>
      <ScreenBackdrop />
      {fontsReady ? (
        <View style={[styles.column, { width: columnWidth, paddingBottom: bottomPad }]}>
          <View style={[styles.top, { paddingTop: insets.top + 7 }]}>
            <TopBar live={live} roomCode={roomCode} onLeave={() => setLeaving(true)} onProfile={onProfile} />
          </View>
          <View style={styles.boardWrap}>
            <BoardView
              size={boardSize}
              model={model}
              labels={{ names, me, muted: muted ?? {}, video: live, seats }}
              onTokenPress={onTokenPress}
              hop={hop}
              onHopDone={onHopDone}
            />
          </View>
          <View style={styles.lower}>
            <Equalizer mode={chrome.sound} />
            <PlayerStrip order={seatedOrder} turn={state.turn} names={names} me={me} />
            <TurnCard
              copy={copy}
              dice={diceFaces(state.dice, lastRoll)}
              rollKey={rollKey}
              idle={awaitingRoll}
              activeDie={activeMoves.length > 0 ? active : null}
              onRoll={canRoll ? onRoll : undefined}
              onPickDie={pickable ? (die) => setPick({ rollKey, die }) : undefined}
            />
            <ActionDock
              keys={chrome.dock}
              voiceOn={call?.micOn ?? voice?.on ?? false}
              cameraOn={call?.cameraOn ?? false}
              unread={chat?.unread ?? 0}
              onVoice={call?.onMic ?? voice?.onToggle}
              onCamera={call?.onCamera}
              onChat={chat?.onToggle}
            />
          </View>
        </View>
      ) : null}
      {leaving ? (
        <LeaveConfirm body={chrome.leaveBody} onLeave={onMenu} onStay={() => setLeaving(false)} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 12,
  },
  boardWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: layout.topBarGap,
  },
  lower: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
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
