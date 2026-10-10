import type { ReactNode } from 'react';

export type LiveKitSessionProps = {
  token?: string;
  url?: string;
  audio?: boolean;
  video?: boolean;
  facingUser?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  children: ReactNode;
};
