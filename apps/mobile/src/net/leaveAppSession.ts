import { useChatStore } from '../stores/chatStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useGameStore } from '../stores/gameStore';
import { useRoomStore } from '../stores/roomStore';
import { useVideoStore } from '../stores/videoStore';
import { leaveOnlineSession } from './onlineSession';
import { socketManager } from './socket';

export function leaveAppOnlineSession(): Promise<void> {
  return leaveOnlineSession({
    socket: socketManager,
    room: { clear: () => useRoomStore.getState().clear() },
    game: { clear: () => useGameStore.getState().clear() },
    video: { reset: () => useVideoStore.getState().reset() },
    chat: { clear: () => useChatStore.getState().clear() },
    connection: {
      setConnected: (connected) => useConnectionStore.getState().setConnected(connected),
      setReconnecting: (reconnecting) =>
        useConnectionStore.getState().setReconnecting(reconnecting),
    },
  });
}
