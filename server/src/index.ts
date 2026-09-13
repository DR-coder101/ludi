import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludi/protocol';
import { hello } from '@ludi/rules';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    service: 'Ludi Server',
    version: '0.1.0',
    status: 'running',
    rulesCheck: hello(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('pong', `Welcome! Server says: ${hello()}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎲 Ludi server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
});
