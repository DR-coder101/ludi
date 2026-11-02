import type { MatchHistoryResponse, MatchHistory } from '@ludi/protocol';
import { authHeaders } from '../net/authHeaders';
import { resolveSocketServerUrl } from '../net/socketUrl';

const SERVER_URL = resolveSocketServerUrl();

export interface HistoryService {
  getUserMatches(userId: string, limit?: number): Promise<MatchHistory[]>;
}

class HistoryServiceImpl implements HistoryService {
  async getUserMatches(userId: string, limit = 50): Promise<MatchHistory[]> {
    const url = new URL(`${SERVER_URL}/matches/${userId}`);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: authHeaders(),
    });

    const data: MatchHistoryResponse = await response.json();

    if (!data.success || !data.matches) {
      throw new Error(data.error || 'Failed to fetch match history');
    }

    return data.matches;
  }
}

export const historyService = new HistoryServiceImpl();
