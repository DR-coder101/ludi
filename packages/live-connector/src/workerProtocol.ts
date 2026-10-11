export type ParentToWorker =
  | {
      type: 'connect';
      uniqueId: string;
      signApiKey?: string;
      sessionCookie?: string;
      sessionIdc?: string;
    }
  | { type: 'disconnect' };

export type WorkerToParent =
  | { type: 'status'; phase: 'connecting' | 'connected' | 'disconnected' | 'error'; reason?: string }
  | { type: 'chat'; userId: string; displayName: string; text: string; platformTimestamp?: number }
  | { type: 'gift'; userId: string; displayName: string; giftName: string; repeatCount: number }
  | { type: 'fatal'; message: string };

export function encodeLine(message: ParentToWorker | WorkerToParent): string {
  return `${JSON.stringify(message)}\n`;
}

export function decodeWorkerLine(line: string): WorkerToParent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return null;
  return parsed as WorkerToParent;
}

export function decodeParentLine(line: string): ParentToWorker | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return null;
  return parsed as ParentToWorker;
}
