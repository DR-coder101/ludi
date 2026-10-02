import React, { type ReactNode } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { color, font } from '../../theme/tokens';
import { useLudiFonts } from '../../theme/fonts';
import { ScreenBackdrop } from '../game/ScreenBackdrop';
import { CodeCard } from './CodeCard';
import { SeatCard } from './SeatCard';
import { LobbyHeader, OptionToggle, RoomModeTabs, StartButton } from './LobbyControls';
import type { LobbySeat, RoomNote, StartCta } from './lobbyModel';

interface Toggle {
  on: boolean;
  onToggle?: () => void;
}

export interface LobbyRoomProps {
  code: string;
  /** You created the room: CREATE ROOM tab, START GAME. */
  host: boolean;
  /** Grid order TL, TR, BL, BR (see SEAT_ORDER). */
  seats: LobbySeat[];
  note: RoomNote;
  start: StartCta;
  starting?: boolean;
  voice: Toggle;
  video: Toggle;
  onBack: () => void;
  onCopy: () => void;
  onShare: () => void;
  onStart?: () => void;
  /** Overrides device safe-area insets (the dev preview simulates an iPhone frame on web). */
  insets?: { top: number; bottom: number };
  children?: ReactNode;
}

const MAX_COLUMN = 440;
const SIDE = 16;
const GAP = 10;
/** Mockup offsets: header 7pt under the status bar, START GAME ends 12pt above the home indicator inset. */
const TOP_GAP = 7;
const BOTTOM_GAP = 12;

export function LobbyRoom(props: LobbyRoomProps) {
  const { code, host, seats, note, start, starting, voice, video, onBack, onCopy, onShare, onStart, children } = props;
  const fontsReady = useLudiFonts();
  const device = useSafeAreaInsets();
  const insets = props.insets ?? device;
  const { width } = useWindowDimensions();

  const column = Math.min(width, MAX_COLUMN);
  const inner = column - SIDE * 2;
  const seatWidth = (inner - GAP) / 2;
  const players = seats.filter((s) => s.name != null).length;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScreenBackdrop />
      {fontsReady ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
        >
          <View style={[styles.column, { width: column, paddingTop: insets.top + TOP_GAP, paddingBottom: insets.bottom + BOTTOM_GAP }]}>
            <LobbyHeader onBack={onBack} />
            <View style={styles.gap12}>
              <RoomModeTabs host={host} />
            </View>
            <View style={styles.gap12}>
              <CodeCard code={code} width={inner} players={players} note={note} onCopy={onCopy} onShare={onShare} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                PICK YOUR CORNER
              </Text>
              <Text style={styles.sectionNote}>Laid out like the island</Text>
            </View>
            <View style={styles.grid}>
              {seats.map((seat) => (
                <SeatCard key={seat.color} seat={seat} width={seatWidth} onInvite={onShare} />
              ))}
            </View>
            <View style={styles.spring} />
            <View style={styles.options}>
              <OptionToggle icon="mic" label="Voice" on={voice.on} onToggle={voice.onToggle} />
              <OptionToggle icon="video" label="Video" on={video.on} onToggle={video.onToggle} />
              <OptionToggle icon="lock" label="Private" on hint="Rooms are always private: only people with the code can join" />
            </View>
            <View style={styles.gap16}>
              <StartButton cta={start} width={inner} busy={starting} onPress={onStart} />
            </View>
          </View>
        </ScrollView>
      ) : null}
      {children}
    </View>
  );
}

/** Before the first `room:state` arrives. */
export function LobbyLoading({ children }: { children?: ReactNode }) {
  return (
    <View style={[styles.screen, styles.loading]}>
      <StatusBar style="light" />
      <ScreenBackdrop />
      <ActivityIndicator size="large" color={color.gold} />
      <Text style={styles.loadingText}>Opening the room…</Text>
      {children}
    </View>
  );
}

/**
 * Lobby line heights are Chrome's `normal` for each font and size, with ascent and
 * descent rounded separately (Inter 12 → 15, Archivo Black 10 → 11, Anton 20 → 31).
 * A smaller fractional value floors the half-leading and lifts web glyphs by 1px.
 */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    flexGrow: 1,
    paddingHorizontal: SIDE,
  },
  gap12: {
    marginTop: 12,
  },
  gap16: {
    marginTop: 16,
  },
  section: {
    marginTop: 14,
    height: 30,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: font.display,
    // Faux bold, as the mockup's <h2> gets in the browser. Web only, like the header title.
    ...Platform.select({ web: { fontWeight: '700' as const } }),
    fontSize: 20,
    lineHeight: 31,
    letterSpacing: 0.8,
    color: color.cream,
  },
  sectionNote: {
    fontFamily: font.bodySemi,
    fontSize: 11.5,
    lineHeight: 14,
    color: 'rgba(246,239,217,0.6)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  /** Holds the toggles and START GAME at the bottom on tall screens; 12pt at 390×844. */
  spring: {
    flexGrow: 1,
    minHeight: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: 'rgba(246,239,217,0.6)',
  },
});
