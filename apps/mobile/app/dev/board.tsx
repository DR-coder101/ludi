import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { applyMove, legalMoves, rollDice, type GameState } from '@ludi/rules';
import { BoardScreen } from '../../src/components/game/BoardScreen';
import { makeMoveHops, type HopAnimation } from '../../src/components/board/BoardView';
import {
  boardFixture,
  CAPTURE_ROLL,
  MID_ROLL,
  MOCKUP_NAMES,
  VIDEO_FIXTURE_CALL,
  VIDEO_FIXTURE_SEATS,
  VIDEO_ROLL,
  type FixtureName,
} from '../../src/dev/boardFixtures';

function parseFixture(state: string | undefined): FixtureName {
  switch (state) {
    case 'mid':
    case 'video':
    case 'leave':
    case 'capture':
    case 'capture-before':
    case 'homes':
      return state;
    default:
      return 'start';
  }
}

function rollFor(name: FixtureName): [number, number] | null {
  switch (name) {
    case 'mid':
      return MID_ROLL;
    case 'video':
    case 'leave':
      return VIDEO_ROLL;
    case 'capture':
    case 'capture-before':
      return CAPTURE_ROLL;
    case 'start':
    case 'homes':
      return null;
    default: {
      const _never: never = name;
      return _never;
    }
  }
}

/** Ring fill in the mockups: dash 140 (start) and 110 (mid) of a 150.8 circumference. */
const MOCKUP_TIMER: Record<FixtureName, number> = {
  start: 140 / 150.8,
  mid: 110 / 150.8,
  video: 140 / 150.8,
  leave: 140 / 150.8,
  capture: 140 / 150.8,
  'capture-before': 140 / 150.8,
  homes: 140 / 150.8,
};
/** iPhone 14 safe area, so web screenshots line up with the 390×844 mockups. */
const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';

/** Visual QA for the board screen: /dev/board?state=start|mid. Pieces and dice stay playable. */
export default function BoardPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const fixture = parseFixture(params.state);
  const [state, setState] = useState<GameState>(() => boardFixture(fixture));
  const [lastRoll, setLastRoll] = useState<[number, number] | null>(rollFor(fixture));
  const [rollKey, setRollKey] = useState(0);
  const [hop, setHop] = useState<{ hops: HopAnimation[]; next: GameState } | null>(null);

  useEffect(() => {
    setState(boardFixture(fixture));
    setLastRoll(rollFor(fixture));
    setHop(null);
  }, [fixture]);

  if (!ENABLED) return <Redirect href="/" />;

  const moves = state.phase === 'awaiting_move' ? legalMoves(state) : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BoardScreen
        state={state}
        moves={moves}
        me="red"
        names={MOCKUP_NAMES}
        muted={{ blue: true }}
        roomCode="7X8K9"
        lastRoll={lastRoll}
        rollKey={rollKey}
        timer={{ fraction: MOCKUP_TIMER[fixture], urgent: false }}
        hop={hop?.hops ?? null}
        onHopDone={() => {
          if (!hop) return;
          setState(hop.next);
          setHop(null);
        }}
        onRoll={() => {
          const result = rollDice(state, Math.random);
          setLastRoll(result.values);
          setRollKey((k) => k + 1);
          setState(result.state);
        }}
        onMove={(move) => {
          const hops = makeMoveHops(state, move);
          const next = applyMove(state, move.tokenIndex, move.dieIndex).state;
          if (hops.length > 0) setHop({ hops, next });
          else setState(next);
        }}
        onMenu={() => router.back()}
        voice={{ on: true, onToggle: () => {} }}
        chat={{ unread: 3, onToggle: () => {} }}
        call={fixture === 'video' || fixture === 'leave' ? VIDEO_FIXTURE_CALL : undefined}
        seats={fixture === 'video' || fixture === 'leave' ? VIDEO_FIXTURE_SEATS : undefined}
        leaveOpen={fixture === 'leave'}
        insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
      />
    </>
  );
}
