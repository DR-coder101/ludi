/**
 * Detached Ludi server entry for `ludi server start`.
 * Args: port graceMs aiDelayMs
 */
import { createLudiServer } from '../../../../server/src/server.ts';

const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);
const graceMs = Number(process.argv[3] ?? 500);
const aiDelayMs = Number(process.argv[4] ?? 100);

const server = createLudiServer({
  port,
  timingConfig: {
    gracePeriodMs: graceMs,
    aiThinkDelayMs: aiDelayMs,
  },
});

await server.start();

const shutdown = async () => {
  try {
    await server.stop();
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
