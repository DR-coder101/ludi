export type LiveKitRoomInput = {
  token: string;
  url: string;
  audio: boolean;
  video: boolean;
  facingUser: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
};

export type LiveKitRoomBind = {
  serverUrl: string;
  token: string;
  connect: true;
  audio: boolean;
  video: false | { facingMode: 'user' | 'environment' };
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
};

const VIDEO_USER = { facingMode: 'user' as const };
const VIDEO_ENVIRONMENT = { facingMode: 'environment' as const };

export function liveKitVideoOption(
  enabled: boolean,
  facingUser: boolean,
): false | { facingMode: 'user' | 'environment' } {
  if (!enabled) return false;
  return facingUser ? VIDEO_USER : VIDEO_ENVIRONMENT;
}

export function liveKitConnectEffectKey(bind: LiveKitRoomBind): {
  connect: true;
  token: string;
  serverUrl: string;
  onError: (error: Error) => void;
} {
  return {
    connect: bind.connect,
    token: bind.token,
    serverUrl: bind.serverUrl,
    onError: bind.onError,
  };
}

export function createLiveKitRoomBind(): (input: LiveKitRoomInput) => LiveKitRoomBind {
  let handlers: Pick<LiveKitRoomInput, 'onConnected' | 'onDisconnected' | 'onError'> = {};
  const onConnected = () => handlers.onConnected?.();
  const onDisconnected = () => handlers.onDisconnected?.();
  const onError = (error: Error) => {
    console.warn('[Video] LiveKit room error', error.message);
    handlers.onError?.(error);
  };

  return (input: LiveKitRoomInput): LiveKitRoomBind => {
    handlers = {
      onConnected: input.onConnected,
      onDisconnected: input.onDisconnected,
      onError: input.onError,
    };
    return {
      serverUrl: input.url,
      token: input.token,
      connect: true,
      audio: input.audio,
      video: liveKitVideoOption(input.video, input.facingUser),
      onConnected,
      onDisconnected,
      onError,
    };
  };
}
