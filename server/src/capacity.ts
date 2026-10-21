import { SERVERS_BUSY } from '@ludi/protocol';

export type CapacityState = {
  busy: boolean;
  maxRooms?: number;
};

export type CapacityGate = {
  state: CapacityState;
  isBusy(roomCount: number): boolean;
  busyError(): typeof SERVERS_BUSY;
};

export function parseMaxRooms(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    return undefined;
  }
  return n;
}

export function createCapacityGate(initial: CapacityState = { busy: false }): CapacityGate {
  const state: CapacityState = { ...initial };

  return {
    state,
    isBusy(roomCount) {
      if (state.busy) {
        return true;
      }
      if (state.maxRooms === undefined) {
        return false;
      }
      return roomCount >= state.maxRooms;
    },
    busyError() {
      return SERVERS_BUSY;
    },
  };
}
