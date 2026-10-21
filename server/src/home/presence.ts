import { visibleOnlineCount } from '@ludi/protocol';

export function connectedCount(io: { sockets: { sockets: { size: number } } }): number {
  return io.sockets.sockets.size;
}

export function presencePayload(count: number): { success: true; count: number; visible: number | null } {
  return {
    success: true,
    count,
    visible: visibleOnlineCount(count),
  };
}
