import { OVERLAY_FALLBACK_PORT, OVERLAY_PORT } from '../view/types.js';

export type ListenFn = (port: number) => Promise<void>;

export type BindResult =
  | { status: 'bound'; port: number; fellBack: boolean }
  | { status: 'port-in-use'; wanted: number; fallback: number };

export function isAddrInUse(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === 'EADDRINUSE';
}

export async function bindPreferredPort(listen: ListenFn): Promise<BindResult> {
  try {
    await listen(OVERLAY_PORT);
    return { status: 'bound', port: OVERLAY_PORT, fellBack: false };
  } catch (err) {
    if (!isAddrInUse(err)) throw err;
    return { status: 'port-in-use', wanted: OVERLAY_PORT, fallback: OVERLAY_FALLBACK_PORT };
  }
}

export async function bindFallbackPort(listen: ListenFn): Promise<BindResult> {
  try {
    await listen(OVERLAY_FALLBACK_PORT);
    return { status: 'bound', port: OVERLAY_FALLBACK_PORT, fellBack: true };
  } catch (err) {
    if (!isAddrInUse(err)) throw err;
    return { status: 'port-in-use', wanted: OVERLAY_PORT, fallback: OVERLAY_FALLBACK_PORT };
  }
}
