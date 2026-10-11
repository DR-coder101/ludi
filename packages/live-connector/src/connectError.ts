import { STATUS_REASON } from './types.js';

export function classifyConnectError(err: unknown): { terminal: boolean; reason: string } {
  const named = err as { name?: string; message?: string };
  const text = `${named.name ?? ''} ${named.message ?? ''}`.toLowerCase();
  if (named.name === 'UserOfflineError' || isOfflineText(text)) {
    return { terminal: true, reason: STATUS_REASON.STREAM_OFFLINE };
  }
  if (isSignText(text)) {
    return { terminal: true, reason: STATUS_REASON.SIGN_REQUIRED };
  }
  return {
    terminal: false,
    reason: named.message?.trim() || STATUS_REASON.CONNECT_FAILED,
  };
}

export function isTerminalReason(reason?: string): boolean {
  if (!reason) return false;
  return (
    reason === STATUS_REASON.STREAM_OFFLINE ||
    reason === STATUS_REASON.SIGN_REQUIRED ||
    isOfflineText(reason.toLowerCase()) ||
    isSignText(reason.toLowerCase())
  );
}

function isOfflineText(text: string): boolean {
  return (
    text.includes('offline') ||
    text.includes('not live') ||
    text.includes('not online') ||
    text.includes("isn't online") ||
    text.includes('isnt online')
  );
}

function isSignText(text: string): boolean {
  return (
    text.includes('business plan') ||
    text.includes('eulerstream.com/pricing') ||
    text.includes('failed to sign') ||
    text.includes('sign a request') ||
    text.includes('api key')
  );
}
