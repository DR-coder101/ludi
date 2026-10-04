/**
 * Detached session bridge entry for `ludi session open`.
 * Args: runDir serverUrl
 */
import { resolveRunDir, writeBridge } from '../runDir.js';
import { startBridgeHttp } from './rpc.js';

const runRoot = process.argv[2];
const url = process.argv[3] ?? 'http://127.0.0.1:3000';
if (!runRoot) {
  console.error('usage: bridge entry <runDir> <url>');
  process.exit(2);
}

const run = resolveRunDir(runRoot);
const bridge = await startBridgeHttp(run, url);
writeBridge(run, { port: bridge.port, pid: process.pid });
console.log(`bridge listening on 127.0.0.1:${bridge.port} -> ${url}`);

const shutdown = async () => {
  try {
    await bridge.close();
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
