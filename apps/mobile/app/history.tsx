import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { historyService } from '../src/services/historyService';
import type { MatchHistory, Color } from '@ludi/protocol';

const COLOR_DISPLAY: Record<Color, { name: string; hex: string }> = {
  red: { name: 'Red', hex: '#E53935' },
  green: { name: 'Green', hex: '#43A047' },
  yellow: { name: 'Yellow', hex: '#FDD835' },
  blue: { name: 'Blue', hex: '#1E88E5' },
};

function MatchCard({ match, currentUserId }: { match: MatchHistory; currentUserId: string }) {
  const startDate = new Date(match.startedAt);
  const endDate = match.endedAt ? new Date(match.endedAt) : null;
  const winner = match.players.find((p) => p.userId === match.winnerId);
  const currentPlayer = match.players.find((p) => p.userId === currentUserId);
  const isWinner = match.winnerId === currentUserId;

  const sortedPlayers = [...match.players].sort((a, b) => {
    const posA = a.finalPosition ?? 999;
    const posB = b.finalPosition ?? 999;
    return posA - posB;
  });

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchDate}>
          {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {isWinner && (
          <View style={styles.winBadge}>
            <Text style={styles.winBadgeText}>🏆 Won</Text>
          </View>
        )}
      </View>

      <View style={styles.playersContainer}>
        {sortedPlayers.map((player, idx) => {
          const isCurrentPlayer = player.userId === currentUserId;
          const isPlayerWinner = player.userId === match.winnerId;
          
          return (
            <View key={`${player.userId}-${idx}`} style={styles.playerRow}>
              <View style={styles.playerInfo}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: COLOR_DISPLAY[player.color].hex },
                  ]}
                />
                <Text style={[
                  styles.playerName,
                  isCurrentPlayer && styles.playerNameHighlight,
                ]}>
                  {player.displayName}{isCurrentPlayer ? ' (You)' : ''}
                </Text>
              </View>
              <View style={styles.playerResult}>
                {isPlayerWinner && <Text style={styles.winnerIcon}>🏆</Text>}
                {player.finalPosition && (
                  <Text style={styles.placement}>#{player.finalPosition}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {match.houseRules && (
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>House Rules:</Text>
          <Text style={styles.rulesText}>
            • {match.houseRules.maxConsecutiveSixes === 'unlimited' 
              ? 'Unlimited' 
              : `Max ${match.houseRules.maxConsecutiveSixes}`} consecutive sixes
          </Text>
          {match.houseRules.extraRollOnCapture && (
            <Text style={styles.rulesText}>• Extra roll on capture</Text>
          )}
          {match.houseRules.playForPlacements && (
            <Text style={styles.rulesText}>• Play for placements</Text>
          )}
        </View>
      )}

      {endDate && (
        <Text style={styles.duration}>
          Duration: {Math.round((endDate.getTime() - startDate.getTime()) / 60000)} min
        </Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();

  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadHistory();
    } else {
      router.replace('/');
    }
  }, [userId]);

  const loadHistory = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await historyService.getUserMatches(userId);
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load match history');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📜 Match History</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎲</Text>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            Play some games to see your match history here!
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>
            <Text style={styles.primaryButtonText}>Play Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard match={item} currentUserId={userId || ''} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  matchCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchDate: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  winBadge: {
    backgroundColor: '#2a4a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#43A047',
  },
  winBadgeText: {
    color: '#43A047',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playersContainer: {
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  playerName: {
    fontSize: 16,
    color: '#fff',
  },
  playerNameHighlight: {
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  playerResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerIcon: {
    fontSize: 16,
  },
  placement: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  rulesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  rulesTitle: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
