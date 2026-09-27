import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameState } from '@ludi/rules';
import { LudiBoard } from '../board/LudiBoard';
import type { LegalMoveLike } from '../board/boardModel';
import { PlayerStrip, VoiceBars } from './PlayerStrip';
import { ScreenBackdrop } from './ScreenBackdrop';
import { SideRail, type RailItem } from './SideRail';
import { TopBar } from './TopBar';
import { TurnCard } from './TurnCard';
import { turnCopy, type LastRoll } from './turnCopy';
import type { Seats } from './types';
import { motion as M, palette, space } from '../../theme/tokens';

const TOP_BAR = 56;
const LOWER_MIN = 292;
const MAX_WIDTH = 480;

export interface BoardScreenProps {
  state: GameState;
  legalMoves: readonly LegalMoveLike[];
  seats: Seats;
  /** This device controls the colour whose turn it is. */
  myTurn: boolean;
  onRoll?: () => void;
  onTokenPress?: (tokenIndex: number) => void;
  lastRoll: LastRoll | null;
  /** Increments on every roll so the dice tumble. */
  rollKey: number;
  roomCode?: string;
  live?: boolean;
  deadline?: number | null;
  onMenu?: () => void;
  onProfile?: () => void;
  voice?: { on: boolean; onToggle: () => void };
  chat?: { unread: number; onOpen: () => void };
  /** Overlays such as the win banner, toasts or the chat panel. */
  children?: ReactNode;
}

/** Holds legal-move highlights back until the dice have landed. */
function useDiceSettled(rollKey: number) {
  const [settledKey, setSettledKey] = useState(rollKey);
  const tumbling = settledKey !== rollKey;
  const settle = useCallback(() => setSettledKey(rollKey), [rollKey]);
  useEffect(() => {
    if (!tumbling) return;
    const id = setTimeout(settle, M.diceTumbleMs + 400);
    return () => clearTimeout(id);
  }, [tumbling, settle]);
  return { tumbling, settle };
}

export function BoardScreen({
  state,
  legalMoves,
  seats,
  myTurn,
  onRoll,
  onTokenPress,
  lastRoll,
  rollKey,
  roomCode,
  live = false,
  deadline = null,
  onMenu,
  onProfile,
  voice,
  chat,
  children,
}: BoardScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const column = Math.min(width, MAX_WIDTH);
  const available = height - insets.top - insets.bottom - 4 - TOP_BAR - 12 - 18 - LOWER_MIN;
  const boardSize = Math.max(240, Math.min(column - 8, available));

  const { tumbling, settle } = useDiceSettled(rollKey);
  const copy = turnCopy({ state, seats, myTurn, lastRoll });
  const canRoll = myTurn && state.phase === 'awaiting_roll' && !!onRoll && !tumbling;
  const shownMoves = tumbling || !myTurn ? NO_MOVES : legalMoves;
  const turnColor = state.phase === 'finished' && state.winner ? state.winner : state.turn;

  const leftRail = useMemo<RailItem[]>(() => {
    const items: RailItem[] = [
      { key: 'players', icon: 'users', label: 'Players', detail: `${state.config.playerColors.length}/4`, detailColor: palette.cream },
    ];
    if (voice) {
      items.push({
        key: 'voice',
        icon: 'mic',
        label: 'Voice',
        detail: voice.on ? 'On' : 'Off',
        detailColor: voice.on ? palette.greenBright : palette.textMuted,
        iconColor: voice.on ? palette.greenBright : palette.cream,
        borderColor: voice.on ? 'rgba(25,196,90,0.6)' : undefined,
        onPress: voice.onToggle,
      });
    }
    if (chat) items.push({ key: 'chat', icon: 'chat', label: 'Chat', badge: chat.unread, onPress: chat.onOpen });
    return items;
  }, [state.config.playerColors.length, voice, chat]);

  const rightRail = useMemo<RailItem[]>(
    () => [
      { key: 'emojis', icon: 'smile', label: 'Emojis' },
      { key: 'roll', icon: 'dice', label: 'Roll Dice', hot: canRoll, onPress: canRoll ? onRoll : undefined },
      { key: 'settings', icon: 'gear', label: 'Settings' },
    ],
    [canRoll, onRoll],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <ScreenBackdrop />
      <View style={[styles.column, { width: column, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
        <TopBar roomCode={roomCode} live={live} onMenu={onMenu} onProfile={onProfile} />
        <View style={styles.boardWrap}>
          <LudiBoard
            size={boardSize}
            state={state}
            legalMoves={shownMoves}
            onTokenPress={myTurn ? onTokenPress : undefined}
            seats={seats}
            live={live}
          />
        </View>
        <View style={styles.lower}>
          <View style={[styles.rail, { left: space.railInset }]}>
            <SideRail items={leftRail} />
          </View>
          <View style={[styles.rail, { right: space.railInset }]}>
            <SideRail items={rightRail} />
          </View>
          <View style={styles.centre}>
            <TurnCard
              color={turnColor}
              copy={copy}
              dice={{ value: lastRoll?.value ?? null, idle: state.phase !== 'awaiting_move', rollKey }}
              onRoll={canRoll ? onRoll : undefined}
              onDiceSettled={settle}
            />
            <View style={styles.strip}>
              <PlayerStrip
                colors={state.config.playerColors}
                seats={seats}
                turn={state.phase === 'finished' ? null : state.turn}
                deadline={state.phase === 'finished' ? null : deadline}
                myTurn={myTurn}
              />
            </View>
            {live ? <VoiceBars /> : null}
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}

const NO_MOVES: readonly LegalMoveLike[] = [];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, alignItems: 'center' },
  column: { flex: 1 },
  boardWrap: { marginTop: 12, alignItems: 'center' },
  lower: { flex: 1, marginTop: 18, minHeight: LOWER_MIN },
  rail: { position: 'absolute', top: 4 },
  centre: { marginHorizontal: space.railInset + space.railWidth + space.railInset, marginTop: 4 },
  strip: { marginTop: 12, marginBottom: 6 },
});
