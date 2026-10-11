import { createLiveServer } from '@ludi/live-game';

const port = Number(process.argv[2] ?? process.env.LUDI_LIVE_PORT ?? 3200);
const adminToken = process.env.LUDI_LIVE_ADMIN_TOKEN ?? '';
if (!adminToken) {
  process.stderr.write('LUDI_LIVE_ADMIN_TOKEN is required\n');
  process.exit(2);
}

const server = createLiveServer({ port, adminToken, stdin: true });
const url = await server.start();
process.stdout.write(JSON.stringify({ ok: true, url, port }) + '\n');

const shutdown = async () => {
  await server.stop();
  process.exit(0);
};
process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
