import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface VideoStoreState {
  livekitUrl: string | null;
  roomCode: string | null;
  token: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isVideoCollapsed: boolean;
  error: string | null;

  setLivekitUrl: (url: string) => void;
  setConnection: (roomCode: string, token: string) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleVideoCollapsed: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  livekitUrl: null,
  roomCode: null,
  token: null,
  isConnected: false,
  isConnecting: false,
  micEnabled: true,
  cameraEnabled: true,
  isVideoCollapsed: false,
  error: null,
};

export const useVideoStore = create<VideoStoreState>()(
  immer((set) => ({
    ...initialState,

    setLivekitUrl: (url) =>
      set((state) => {
        state.livekitUrl = url;
      }),

    setConnection: (roomCode, token) =>
      set((state) => {
        state.roomCode = roomCode;
        state.token = token;
        state.error = null;
      }),

    setConnected: (connected) =>
      set((state) => {
        state.isConnected = connected;
        if (connected) {
          state.isConnecting = false;
          state.error = null;
        }
      }),

    setConnecting: (connecting) =>
      set((state) => {
        state.isConnecting = connecting;
      }),

    toggleMic: () =>
      set((state) => {
        state.micEnabled = !state.micEnabled;
      }),

    toggleCamera: () =>
      set((state) => {
        state.cameraEnabled = !state.cameraEnabled;
      }),

    toggleVideoCollapsed: () =>
      set((state) => {
        state.isVideoCollapsed = !state.isVideoCollapsed;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
        if (error) {
          state.isConnecting = false;
        }
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);
