import type { Server } from 'socket.io';

export const REDIS_ADAPTER_FLAG = 'LUDI_REDIS_ADAPTER';

export function redisAdapterEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[REDIS_ADAPTER_FLAG] === '1';
}

export async function maybeAttachRedisAdapter(
  io: Server,
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  if (!redisAdapterEnabled(env)) {
    return false;
  }

  const url = env.LUDI_REDIS_URL;
  if (!url) {
    console.warn('LUDI_REDIS_ADAPTER=1 but LUDI_REDIS_URL is unset. Staying in-process.');
    return false;
  }

  try {
    const load = new Function('s', 'return import(s)') as (s: string) => Promise<{
      createClient?: (opts: { url: string }) => {
        duplicate: () => { connect: () => Promise<unknown> };
        connect: () => Promise<unknown>;
      };
      createAdapter?: (pub: unknown, sub: unknown) => unknown;
    }>;
    const redisMod = await load('redis');
    const adapterMod = await load('@socket.io/redis-adapter');
    if (!redisMod.createClient || !adapterMod.createAdapter) {
      throw new Error('redis adapter exports missing');
    }
    const pubClient = redisMod.createClient({ url });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(adapterMod.createAdapter(pubClient, subClient) as never);
    console.log('Socket.IO Redis adapter attached');
    return true;
  } catch (err) {
    console.warn(
      'Redis adapter not attached. Install redis and @socket.io/redis-adapter, then set LUDI_REDIS_URL.',
      err,
    );
    return false;
  }
}
