import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { applyMove, legalMoves, rollDice, type GameState } from '@ludi/rules';
import { BoardScreen } from '../../src/components/game/BoardScreen';
import { makeHop, type HopAnimation } from '../../src/components/board/BoardView';
import { boardFixture, MID_ROLL, MOCKUP_NAMES, type FixtureName } from '../../src/dev/boardFixtures';

/** Ring fill in the mockups: dash 140 (start) and 110 (mid) of a 150.8 circumference. */
const MOCKUP_TIMER: Record<FixtureName, number> = { start: 140 / 150.8, mid: 110 / 150.8 };
/** iPhone 14 safe area, so web screenshots line up with the 390×844 mockups. */
const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';

/** Visual QA for the board screen: /dev/board?state=start|mid. Pieces and dice stay playable. */
export default function BoardPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const fixture: FixtureName = params.state === 'mid' ? 'mid' : 'start';
  const [state, setState] = useState<GameState>(() => boardFixture(fixture));
  const [lastRoll, setLastRoll] = useState<[number, number] | null>(fixture === 'mid' ? MID_ROLL : null);
  const [rollKey, setRollKey] = useState(0);
  const [hop, setHop] = useState<{ anim: HopAnimation; next: GameState } | null>(null);

  useEffect(() => {
    setState(boardFixture(fixture));
    setLastRoll(fixture === 'mid' ? MID_ROLL : null);
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
        hop={hop?.anim ?? null}
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
          const anim = makeHop(state, move.tokenIndex, move.resulting);
          const next = applyMove(state, move.tokenIndex, move.dieIndex).state;
          if (anim) setHop({ anim, next });
          else setState(next);
        }}
        onMenu={() => router.back()}
        voice={{ on: true, onToggle: () => {} }}
        chat={{ unread: 3, onToggle: () => {} }}
        insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
      />
    </>
  );
}
