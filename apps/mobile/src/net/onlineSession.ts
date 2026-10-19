export type OnlineSessionPorts = {
  socket: {
    getSocket(): { emit: (event: 'room:leave') => void } | null;
    disconnect(): void;
    clearSession(): Promise<void>;
  };
  room: { clear: () => void };
  game: { clear: () => void };
  video: { reset: () => void };
  chat: { clear: () => void };
  connection: {
    setConnected: (connected: boolean) => void;
    setReconnecting: (reconnecting: boolean) => void;
  };
};

export async function leaveOnlineSession(ports: OnlineSessionPorts): Promise<void> {
  const socket = ports.socket.getSocket();
  if (socket) {
    socket.emit('room:leave');
  }
  ports.socket.disconnect();
  await ports.socket.clearSession();
  ports.room.clear();
  ports.game.clear();
  ports.video.reset();
  ports.chat.clear();
  ports.connection.setConnected(false);
  ports.connection.setReconnecting(false);
}

type SocketHandler = (...args: never[]) => void;

export type SocketLike = {
  on: (event: string, handler: SocketHandler) => void;
  off: (event: string, handler?: SocketHandler) => void;
  io: {
    on: (event: string, handler: SocketHandler) => void;
    off: (event: string, handler?: SocketHandler) => void;
  };
};

export type LobbySocketHandlers = {
  onRoomState: (state: { players: { id: string }[] }) => void;
  onGameState: (state: unknown) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnectAttempt: () => void;
  onReconnect: () => void;
  onPlayerConnection: (playerId: string, connected: boolean) => void;
  onError: (message: unknown) => void;
};

export function bindLobbySocket(socket: SocketLike, handlers: LobbySocketHandlers): () => void {
  const onRoomState = handlers.onRoomState as SocketHandler;
  const onGameState = handlers.onGameState as SocketHandler;
  const onConnect = handlers.onConnect as SocketHandler;
  const onDisconnect = handlers.onDisconnect as SocketHandler;
  const onReconnectAttempt = handlers.onReconnectAttempt as SocketHandler;
  const onReconnect = handlers.onReconnect as SocketHandler;
  const onPlayerConnection = handlers.onPlayerConnection as SocketHandler;
  const onError = handlers.onError as SocketHandler;
  socket.on('room:state', onRoomState);
  socket.on('game:state', onGameState);
  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.io.on('reconnect_attempt', onReconnectAttempt);
  socket.io.on('reconnect', onReconnect);
  socket.on('player:connectionChanged', onPlayerConnection);
  socket.on('error', onError);
  return () => {
    socket.off('room:state', onRoomState);
    socket.off('game:state', onGameState);
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.io.off('reconnect_attempt', onReconnectAttempt);
    socket.io.off('reconnect', onReconnect);
    socket.off('player:connectionChanged', onPlayerConnection);
    socket.off('error', onError);
  };
}
