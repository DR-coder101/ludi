import type { RoomState, Player, HouseRules, Color } from '@ludi/protocol';
import { generateRoomCode } from './roomCode.js';

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

export class RoomRegistry {
  private rooms = new Map<string, RoomState>();

  createRoom(hostId: string, displayName: string, houseRules: HouseRules): string {
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
    };

    const room: RoomState = {
      roomCode,
      players: [host],
      houseRules,
      status: 'lobby',
      hostId,
    };

    this.rooms.set(roomCode, room);
    return roomCode;
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  joinRoom(roomCode: string, playerId: string, displayName: string): { success: boolean; error?: string; color?: Color } {
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
    };

    room.players.push(player);
    return { success: true, color: availableColor };
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
    }
  }

  deleteRoom(roomCode: string): void {
    this.rooms.delete(roomCode);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
