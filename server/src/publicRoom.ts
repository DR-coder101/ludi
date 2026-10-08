import type { Player, RoomState } from '@ludi/protocol';

function publicPlayer(player: Player): Player {
  const rest: Player = { ...player };
  delete rest.sessionToken;
  return rest;
}

export function publicRoom(room: RoomState): RoomState {
  return {
    ...room,
    players: room.players.map(publicPlayer),
  };
}
