import type { GameOverPayload, HouseRules } from '@ludi/protocol';
import type { MatchData } from './services/matchHistory.js';

export function buildFinishedMatch(
  roomCode: string,
  houseRules: HouseRules,
  placements: GameOverPayload['placements'],
  endedAt: Date,
  startedAt: Date | undefined,
  historyUserId: (playerId: string) => string | null,
): MatchData | null {
  const winnerPlayerId = placements.find((p) => p.placement === 1)?.playerId;
  if (!winnerPlayerId) {
    return null;
  }

  return {
    roomCode,
    startedAt: startedAt ?? endedAt,
    endedAt,
    winnerId: historyUserId(winnerPlayerId),
    houseRules: { ...houseRules },
    players: placements.map((p) => ({
      userId: historyUserId(p.playerId),
      color: p.color,
      finalPosition: p.placement,
    })),
  };
}
