import { once } from 'node:events';
import { WebSocket, WebSocketServer } from 'ws';

export type FakeTikfinityServer = {
  url: string;
  port: number;
  send(payload: unknown): void;
  dropClients(): void;
  stop(): Promise<void>;
};

export async function startFakeTikfinity(port = 0): Promise<FakeTikfinityServer> {
  const wss = new WebSocketServer({ host: '127.0.0.1', port });
  await once(wss, 'listening');
  const address = wss.address();
  if (!address || typeof address === 'string') {
    throw new Error('fake TikFinity server did not bind a TCP port');
  }
  const clients = new Set<WebSocket>();
  wss.on('connection', (client) => {
    clients.add(client);
    client.on('close', () => clients.delete(client));
  });
  return {
    url: `ws://127.0.0.1:${address.port}/`,
    port: address.port,
    send(payload) {
      const text = JSON.stringify(payload);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) client.send(text);
      }
    },
    dropClients() {
      for (const client of clients) client.close();
    },
    async stop() {
      for (const client of clients) client.close();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    },
  };
}
