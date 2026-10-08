import { describe, expect, it } from 'vitest';
import { historyWinnerBadge } from './historyWinnerBadge';

const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

describe('historyWinnerBadge', () => {
  it('keeps the current-user win copy', () => {
    expect(historyWinnerBadge({ winnerId: me, winnerIsBot: false }, me)).toBe('🏆 Won');
  });

  it('renders Bot won when the server marks a bot win', () => {
    expect(historyWinnerBadge({ winnerId: null, winnerIsBot: true }, me)).toBe('Bot won');
  });

  it('returns no badge when someone else won', () => {
    expect(historyWinnerBadge({ winnerId: other, winnerIsBot: false }, me)).toBe(null);
  });
});
