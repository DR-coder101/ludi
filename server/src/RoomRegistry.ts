import type { RoomState, Player, HouseRules, Color } from '@ludi/protocol';
import { generateRoomCode } from './roomCode.js';
import { randomBytes } from 'crypto';

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

export class RoomRegistry {
  private rooms = new Map<string, RoomState>();
  private sessionToPlayer = new Map<string, { roomCode: string; playerId: string }>();

  generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  registerSession(sessionToken: string, roomCode: string, playerId: string): void {
    this.sessionToPlayer.set(sessionToken, { roomCode, playerId });
  }

  getPlayerBySession(sessionToken: string): { roomCode: string; playerId: string } | undefined {
    return this.sessionToPlayer.get(sessionToken);
  }

  createRoom(hostId: string, displayName: string, houseRules: HouseRules, sessionToken: string): string {
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const host: Player = {
      id: hostId,
      displayName,
      color: COLORS[0],
      connected: true,
      isHost: true,
      status: 'connected',
      sessionToken,
    };

    const room: RoomState = {
      roomCode,
      players: [host],
      houseRules,
      status: 'lobby',
      hostId,
    };

    this.rooms.set(roomCode, room);
    this.registerSession(sessionToken, roomCode, hostId);
    return roomCode;
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  joinRoom(roomCode: string, playerId: string, displayName: string, sessionToken: string): { success: boolean; error?: string; color?: Color } {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'lobby') {
      return { success: false, error: 'Room is not in lobby state' };
    }

    if (room.players.length >= 4) {
      return { success: false, error: 'Room is full' };
    }

    if (room.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Already in room' };
    }

    const usedColors = new Set(room.players.map(p => p.color));
    const availableColor = COLORS.find(c => !usedColors.has(c));
    
    if (!availableColor) {
      return { success: false, error: 'No colors available' };
    }

    const player: Player = {
      id: playerId,
      displayName,
      color: availableColor,
      connected: true,
      isHost: false,
      status: 'connected',
      sessionToken,
    };

    room.players.push(player);
    this.registerSession(sessionToken, roomCode, playerId);
    return { success: true, color: availableColor };
  }

  reconnectPlayer(sessionToken: string, newSocketId: string): { success: boolean; roomCode?: string; playerId?: string; color?: Color; error?: string } {
    const session = this.sessionToPlayer.get(sessionToken);
    if (!session) {
      return { success: false, error: 'Invalid session token' };
    }

    const { roomCode, playerId: oldPlayerId } = session;
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, error: 'Player not found in room' };
    }

    player.id = newSocketId;
    player.connected = true;
    player.status = 'connected';

    this.sessionToPlayer.set(sessionToken, { roomCode, playerId: newSocketId });

    return { 
      success: true, 
      roomCode, 
      playerId: newSocketId,
      color: player.color,
    };
  }

  leaveRoom(roomCode: string, playerId: string): { shouldCloseRoom: boolean; newHostId?: string } {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return { shouldCloseRoom: false };
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { shouldCloseRoom: false };
    }

    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return { shouldCloseRoom: true };
    }

    if (room.hostId === playerId && room.players.length > 0) {
      const newHost = room.players[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      return { shouldCloseRoom: false, newHostId: newHost.id };
    }

    return { shouldCloseRoom: false };
  }

  updatePlayerConnection(roomCode: string, playerId: string, connected: boolean): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = connected;
      if (!connected && player.status === 'connected') {
        player.status = 'disconnected';
      }
    }
  }

  updatePlayerStatus(roomCode: string, playerId: string, status: 'connected' | 'disconnected' | 'reconnecting' | 'ai-substitute'): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.status = status;
      player.connected = status === 'connected';
    }
  }

  getPlayerBySessionToken(sessionToken: string): { roomCode: string; player: Player } | undefined {
    const session = this.sessionToPlayer.get(sessionToken);
    if (!session) return undefined;

    const room = this.rooms.get(session.roomCode);
    if (!room) return undefined;

    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (!player) return undefined;

    return { roomCode: session.roomCode, player };
  }

  deleteRoom(roomCode: string): void {
    this.rooms.delete(roomCode);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
