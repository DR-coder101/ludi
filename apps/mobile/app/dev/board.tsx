import { useMemo, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { applyMove, legalMoves, rollDice, type GameState } from '@ludi/rules';
import { BoardScreen } from '../../src/components/game/BoardScreen';
import type { LastRoll } from '../../src/components/game/turnCopy';
import { boardFixture } from '../../src/dev/boardFixtures';

/**
 * Dev-only board preview: /dev/board?state=start|mid.
 * The fixture is live, so rolling and moving work from there.
 */
export default function DevBoardScreen() {
  const { state: which } = useLocalSearchParams<{ state?: string }>();
  const fixture = useMemo(() => boardFixture(which), [which]);
  const [game, setGame] = useState<GameState>(fixture.state);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(fixture.lastRoll);
  const [rollKey, setRollKey] = useState(0);

  const moves = useMemo(() => (game.phase === 'awaiting_move' ? legalMoves(game) : []), [game]);

  if (!__DEV__) return <Redirect href="/" />;

  const roll = () => {
    if (game.phase !== 'awaiting_roll') return;
    const result = rollDice(game, Math.random);
    setLastRoll({ value: result.value, color: game.turn, passed: result.state.phase !== 'awaiting_move' });
    setRollKey((k) => k + 1);
    setGame(result.state);
  };

  const move = (tokenIndex: number) => {
    if (!moves.some((m) => m.tokenIndex === tokenIndex)) return;
    setGame(applyMove(game, tokenIndex).state);
  };

  return (
    <BoardScreen
      state={game}
      legalMoves={moves}
      seats={fixture.seats}
      myTurn
      onRoll={roll}
      onTokenPress={move}
      lastRoll={lastRoll}
      rollKey={rollKey}
      roomCode="7X8K9"
      live
    />
  );
}
