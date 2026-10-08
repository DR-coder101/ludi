import type { MatchHistory } from '@ludi/protocol';

export function historyWinnerBadge(
  match: Pick<MatchHistory, 'winnerId' | 'winnerIsBot'>,
  currentUserId: string,
): string | null {
  if (match.winnerId === currentUserId) {
    return '🏆 Won';
  }
  if (match.winnerIsBot) {
    return 'Bot won';
  }
  return null;
}
