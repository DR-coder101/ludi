import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludi/protocol';
import { RoomCreatePayloadSchema, RoomJoinPayloadSchema } from '@ludi/protocol';
import { RoomRegistry } from './RoomRegistry.js';
import { RateLimiter } from './RateLimiter.js';

export function createLudiServer(port: number = 3000) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const roomRegistry = new RoomRegistry();
  const rateLimiter = new RateLimiter(10, 1000);
  const socketToRoom = new Map<string, string>();

  const cleanupInterval = setInterval(() => rateLimiter.cleanup(), 10000);

  app.get('/', (req, res) => {
    res.json({
      service: 'Ludi Server',
      version: '0.1.0',
      status: 'running',
      roomCount: roomRegistry.getRoomCount(),
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

  function checkRateLimit(socket: TypedSocket): boolean {
    if (!rateLimiter.isAllowed(socket.id)) {
      socket.emit('error', 'Rate limit exceeded. Please slow down.');
      return false;
    }
    return true;
  }

  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('room:create', (payload, callback) => {
      if (!checkRateLimit(socket)) {
        callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const validationResult = RoomCreatePayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        callback({ success: false, error: 'Invalid payload' });
        return;
      }

      const { displayName, houseRules } = validationResult.data;
      const roomCode = roomRegistry.createRoom(socket.id, displayName, houseRules);
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        socket.emit('room:state', room);
      }

      callback({ success: true, roomCode });
      console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    socket.on('room:join', (payload, callback) => {
      if (!checkRateLimit(socket)) {
        callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const validationResult = RoomJoinPayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        callback({ success: false, error: 'Invalid payload' });
        return;
      }

      const { roomCode, displayName } = validationResult.data;
      const result = roomRegistry.joinRoom(roomCode, socket.id, displayName);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
      }

      callback({ success: true });
      console.log(`Player ${socket.id} joined room ${roomCode}`);
    });

    socket.on('room:leave', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const result = roomRegistry.leaveRoom(roomCode, socket.id);
      
      socket.leave(roomCode);
      socketToRoom.delete(socket.id);

      if (result.shouldCloseRoom) {
        console.log(`Room ${roomCode} closed (empty)`);
        return;
      }

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
        console.log(`Player ${socket.id} left room ${roomCode}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        roomRegistry.updatePlayerConnection(roomCode, socket.id, false);
        
        const room = roomRegistry.getRoom(roomCode);
        if (room) {
          io.to(roomCode).emit('room:state', room);
        }
        
        socketToRoom.delete(socket.id);
      }
    });
  });

  return {
    app,
    httpServer,
    io,
    start: () => {
      return new Promise<void>((resolve) => {
        httpServer.listen(port, () => {
          console.log(`🎲 Ludi server running on http://localhost:${port}`);
          console.log(`🔌 Socket.IO ready for connections`);
          resolve();
        });
      });
    },
    stop: () => {
      return new Promise<void>((resolve, reject) => {
        clearInterval(cleanupInterval);
        io.close();
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
