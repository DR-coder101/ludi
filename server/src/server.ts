import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  Color,
  GameState,
  TokenMovedPayload,
  DiceRolledPayload,
  TurnChangedPayload,
  GameOverPayload,
  PlayerStatusChangedPayload,
} from '@ludi/protocol';
import { 
  RoomCreatePayloadSchema, 
  RoomJoinPayloadSchema,
  GameRollPayloadSchema,
  GameMovePayloadSchema,
} from '@ludi/protocol';
import { RoomRegistry } from './RoomRegistry.js';
import { RateLimiter } from './RateLimiter.js';
import { GameManagerRegistry } from './GameManager.js';

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
  const gameRegistry = new GameManagerRegistry();
  const rateLimiter = new RateLimiter(10, 1000);
  const socketToRoom = new Map<string, string>();
  const socketToColor = new Map<string, Color>();

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

  function handleAITurn(roomCode: string): void {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;

    const currentColor = game.state.turn;
    if (!gameRegistry.isAISubstitute(roomCode, currentColor)) return;

    if (game.state.phase === 'awaiting_roll') {
      const result = gameRegistry.rollDice(roomCode);
      if (!result.success) return;

      const room = roomRegistry.getRoom(roomCode);
      if (!room) return;

      const currentPlayerSocket = room.players.find(p => p.color === currentColor)?.id;

      io.to(roomCode).emit('game:state', game.state);

      const moves = gameRegistry.getLegalMoves(roomCode);
      if (currentPlayerSocket) {
        const dicePayload: DiceRolledPayload = {
          playerId: currentPlayerSocket,
          value: result.value!,
          legalMoves: moves,
        };
        io.to(roomCode).emit('game:diceRolled', dicePayload);
      }

      if (result.autoPass) {
        gameRegistry.setAutoPassTimer(roomCode, () => {
          handleAutoPass(roomCode);
        });
      } else {
        setTimeout(() => {
          handleAIMove(roomCode);
        }, 1000);
      }
    }
  }

  function handleAIMove(roomCode: string): void {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;

    const currentColor = game.state.turn;
    if (!gameRegistry.isAISubstitute(roomCode, currentColor)) return;

    if (game.state.phase !== 'awaiting_move') return;

    const moves = gameRegistry.getLegalMoves(roomCode);
    if (moves.length === 0) return;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    
    const room = roomRegistry.getRoom(roomCode);
    if (!room) return;

    const currentPlayerSocket = room.players.find(p => p.color === currentColor)?.id;

    const result = gameRegistry.applyMove(roomCode, randomMove.tokenIndex);

    if (!result.success) return;

    if (currentPlayerSocket) {
      const tokenMovedPayload: TokenMovedPayload = {
        playerId: currentPlayerSocket,
        tokenIndex: randomMove.tokenIndex,
        from: result.from!,
        to: result.to!,
        captured: result.captured,
      };
      io.to(roomCode).emit('game:tokenMoved', tokenMovedPayload);
    }

    const updatedGame = gameRegistry.getGame(roomCode);
    if (!updatedGame) return;

    io.to(roomCode).emit('game:state', updatedGame.state);

    if (updatedGame.state.phase === 'finished') {
      const placements = updatedGame.state.placements.map((color, idx) => {
        const player = room.players.find(p => p.color === color);
        return {
          playerId: player?.id || '',
          color,
          placement: idx + 1,
        };
      });
      
      const gameOverPayload: GameOverPayload = {
        winnerId: room.players.find(p => p.color === updatedGame.state.winner)?.id || '',
        placements,
      };
      io.to(roomCode).emit('game:over', gameOverPayload);
    } else if (updatedGame.state.phase === 'awaiting_roll') {
      const nextPlayerSocket = room.players.find(p => p.color === updatedGame.state.turn)?.id;
      
      if (nextPlayerSocket) {
        const turnPayload: TurnChangedPayload = {
          playerId: nextPlayerSocket,
          deadlineTs: Date.now() + 30000,
        };
        io.to(roomCode).emit('game:turnChanged', turnPayload);
      }

      if (gameRegistry.isAISubstitute(roomCode, updatedGame.state.turn)) {
        setTimeout(() => {
          handleAITurn(roomCode);
        }, 1000);
      }
    }
  }

  function handleAutoPass(roomCode: string): void {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;
    
    if (game.state.phase === 'awaiting_move') {
      const currentIndex = game.state.config.playerColors.indexOf(game.state.turn);
      const nextIndex = (currentIndex + 1) % game.state.config.playerColors.length;
      
      let nextColor = game.state.config.playerColors[nextIndex];
      let attempts = 0;
      while (game.state.placements.includes(nextColor) && attempts < game.state.config.playerColors.length) {
        const nextNextIndex = (game.state.config.playerColors.indexOf(nextColor) + 1) % game.state.config.playerColors.length;
        nextColor = game.state.config.playerColors[nextNextIndex];
        attempts++;
      }

      game.state = {
        ...game.state,
        turn: nextColor,
        phase: 'awaiting_roll',
        dice: null,
        consecutiveSixes: 0,
      };

      io.to(roomCode).emit('game:state', game.state);

      const currentPlayerSocket = Array.from(socketToColor.entries())
        .find(([_, color]) => color === game.state.turn)?.[0];
      
      if (currentPlayerSocket) {
        const turnPayload: TurnChangedPayload = {
          playerId: currentPlayerSocket,
          deadlineTs: Date.now() + 30000,
        };
        io.to(roomCode).emit('game:turnChanged', turnPayload);
      }

      if (gameRegistry.isAISubstitute(roomCode, game.state.turn)) {
        setTimeout(() => {
          handleAITurn(roomCode);
        }, 1000);
      }
    }
  }

  function handleMoveTimeout(roomCode: string): void {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;
    
    if (game.state.phase !== 'awaiting_move') return;

    const moves = gameRegistry.getLegalMoves(roomCode);
    if (moves.length === 0) return;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    
    const currentPlayerSocket = Array.from(socketToColor.entries())
      .find(([_, color]) => color === game.state.turn)?.[0];

    const result = gameRegistry.applyMove(roomCode, randomMove.tokenIndex);

    if (!result.success) return;

    const room = roomRegistry.getRoom(roomCode);
    if (!room) return;

    if (currentPlayerSocket) {
      const tokenMovedPayload: TokenMovedPayload = {
        playerId: currentPlayerSocket,
        tokenIndex: randomMove.tokenIndex,
        from: result.from!,
        to: result.to!,
        captured: result.captured,
      };
      io.to(roomCode).emit('game:tokenMoved', tokenMovedPayload);
    }

    const updatedGame = gameRegistry.getGame(roomCode);
    if (!updatedGame) return;

    io.to(roomCode).emit('game:state', updatedGame.state);

    if (updatedGame.state.phase === 'finished') {
      const placements = updatedGame.state.placements.map((color, idx) => {
        const player = room.players.find(p => p.color === color);
        return {
          playerId: player?.id || '',
          color,
          placement: idx + 1,
        };
      });
      
      const gameOverPayload: GameOverPayload = {
        winnerId: room.players.find(p => p.color === updatedGame.state.winner)?.id || '',
        placements,
      };
      io.to(roomCode).emit('game:over', gameOverPayload);
    } else if (updatedGame.state.phase === 'awaiting_roll') {
      const nextPlayerSocket = Array.from(socketToColor.entries())
        .find(([_, color]) => color === updatedGame.state.turn)?.[0];
      
      if (nextPlayerSocket) {
        const turnPayload: TurnChangedPayload = {
          playerId: nextPlayerSocket,
          deadlineTs: Date.now() + 30000,
        };
        io.to(roomCode).emit('game:turnChanged', turnPayload);
      }

      if (gameRegistry.isAISubstitute(roomCode, updatedGame.state.turn)) {
        setTimeout(() => {
          handleAITurn(roomCode);
        }, 1000);
      }
    }
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
      const sessionToken = roomRegistry.generateSessionToken();
      const roomCode = roomRegistry.createRoom(socket.id, displayName, houseRules, sessionToken);
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        socketToColor.set(socket.id, room.players[0].color);
        socket.emit('room:state', room);
      }

      callback({ success: true, roomCode, sessionToken });
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

      const { roomCode, displayName, sessionToken } = validationResult.data;

      if (sessionToken) {
        const reconnectResult = roomRegistry.reconnectPlayer(sessionToken, socket.id);
        
        if (reconnectResult.success && reconnectResult.roomCode === roomCode) {
          socket.join(roomCode);
          socketToRoom.set(socket.id, roomCode);
          socketToColor.set(socket.id, reconnectResult.color!);

          const game = gameRegistry.getGame(roomCode);
          const room = roomRegistry.getRoom(roomCode);
          
          if (room) {
            const cancelResult = gameRegistry.cancelDisconnectGrace(roomCode, reconnectResult.color!);
            
            roomRegistry.updatePlayerStatus(roomCode, socket.id, 'connected');
            
            io.to(roomCode).emit('room:state', room);
            
            if (game) {
              socket.emit('game:state', game.state);

              if (cancelResult.wasPaused && game.state.turn === reconnectResult.color && game.state.phase === 'awaiting_move') {
                gameRegistry.setMoveTimer(roomCode, () => {
                  handleMoveTimeout(roomCode);
                });
              }
            }

            const statusPayload: PlayerStatusChangedPayload = {
              playerId: socket.id,
              status: 'connected',
            };
            io.to(roomCode).emit('player:statusChanged', statusPayload);
          }

          callback({ success: true, sessionToken, isReconnect: true });
          console.log(`Player ${socket.id} reconnected to room ${roomCode}`);
          return;
        }
      }

      const sessionTokenNew = roomRegistry.generateSessionToken();
      const result = roomRegistry.joinRoom(roomCode, socket.id, displayName, sessionTokenNew);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);
      if (result.color) {
        socketToColor.set(socket.id, result.color);
      }

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
      }

      callback({ success: true, sessionToken: sessionTokenNew });
      console.log(`Player ${socket.id} joined room ${roomCode}`);
    });

    socket.on('room:leave', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const result = roomRegistry.leaveRoom(roomCode, socket.id);
      
      socket.leave(roomCode);
      socketToRoom.delete(socket.id);
      socketToColor.delete(socket.id);

      if (result.shouldCloseRoom) {
        gameRegistry.deleteGame(roomCode);
        console.log(`Room ${roomCode} closed (empty)`);
        return;
      }

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
        console.log(`Player ${socket.id} left room ${roomCode}`);
      }
    });

    socket.on('room:ready', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = roomRegistry.getRoom(roomCode);
      if (!room || room.players.length < 2) {
        return;
      }

      const playerColors = room.players.map(p => p.color);
      const gameState = gameRegistry.createGame(roomCode, {
        playerColors,
        houseRules: room.houseRules,
      });

      io.to(roomCode).emit('game:state', gameState);
      
      const currentPlayerSocket = Array.from(socketToColor.entries())
        .find(([_, color]) => color === gameState.turn)?.[0];
      
      if (currentPlayerSocket) {
        const turnPayload: TurnChangedPayload = {
          playerId: currentPlayerSocket,
          deadlineTs: Date.now() + 30000,
        };
        io.to(roomCode).emit('game:turnChanged', turnPayload);
      }

      console.log(`Game started in room ${roomCode}`);
    });

    socket.on('game:roll', (payload, callback) => {
      if (!checkRateLimit(socket)) {
        callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const validationResult = GameRollPayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        callback({ success: false, error: 'Invalid payload' });
        return;
      }

      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const game = gameRegistry.getGame(roomCode);
      if (!game) {
        callback({ success: false, error: 'Game not started' });
        return;
      }

      const playerColor = socketToColor.get(socket.id);
      if (!playerColor || game.state.turn !== playerColor) {
        callback({ success: false, error: 'Not your turn' });
        return;
      }

      const result = gameRegistry.rollDice(roomCode);
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      callback({ success: true });

      io.to(roomCode).emit('game:state', game.state);

      const moves = gameRegistry.getLegalMoves(roomCode);
      const dicePayload: DiceRolledPayload = {
        playerId: socket.id,
        value: result.value!,
        legalMoves: moves,
      };
      io.to(roomCode).emit('game:diceRolled', dicePayload);

      if (result.autoPass) {
        gameRegistry.setAutoPassTimer(roomCode, () => {
          handleAutoPass(roomCode);
        });
      } else {
        gameRegistry.setMoveTimer(roomCode, () => {
          handleMoveTimeout(roomCode);
        });
      }
    });

    socket.on('game:move', (payload, callback) => {
      if (!checkRateLimit(socket)) {
        callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const validationResult = GameMovePayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        callback({ success: false, error: 'Invalid payload' });
        return;
      }

      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const game = gameRegistry.getGame(roomCode);
      if (!game) {
        callback({ success: false, error: 'Game not started' });
        return;
      }

      const playerColor = socketToColor.get(socket.id);
      if (!playerColor || game.state.turn !== playerColor) {
        callback({ success: false, error: 'Not your turn' });
        return;
      }

      const { tokenIndex } = validationResult.data;
      const result = gameRegistry.applyMove(roomCode, tokenIndex);

      if (!result.success) {
        callback({ success: false, error: result.error, hint: result.hint });
        return;
      }

      callback({ success: true });

      const tokenMovedPayload: TokenMovedPayload = {
        playerId: socket.id,
        tokenIndex,
        from: result.from!,
        to: result.to!,
        captured: result.captured,
      };
      io.to(roomCode).emit('game:tokenMoved', tokenMovedPayload);
      
      const updatedGame = gameRegistry.getGame(roomCode);
      if (!updatedGame) return;
      
      io.to(roomCode).emit('game:state', updatedGame.state);

      if (updatedGame.state.phase === 'finished') {
        const room = roomRegistry.getRoom(roomCode);
        if (room) {
          const placements = updatedGame.state.placements.map((color, idx) => {
            const player = room.players.find(p => p.color === color);
            return {
              playerId: player?.id || '',
              color,
              placement: idx + 1,
            };
          });
          
          const gameOverPayload: GameOverPayload = {
            winnerId: room.players.find(p => p.color === updatedGame.state.winner)?.id || '',
            placements,
          };
          io.to(roomCode).emit('game:over', gameOverPayload);
        }
      } else if (updatedGame.state.phase === 'awaiting_roll') {
        const currentPlayerSocket = Array.from(socketToColor.entries())
          .find(([_, color]) => color === updatedGame.state.turn)?.[0];
        
        if (currentPlayerSocket) {
          const turnPayload: TurnChangedPayload = {
            playerId: currentPlayerSocket,
            deadlineTs: Date.now() + 30000,
          };
          io.to(roomCode).emit('game:turnChanged', turnPayload);
        }

        if (gameRegistry.isAISubstitute(roomCode, updatedGame.state.turn)) {
          setTimeout(() => {
            handleAITurn(roomCode);
          }, 1000);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = roomRegistry.getRoom(roomCode);
      const playerColor = socketToColor.get(socket.id);
      const game = gameRegistry.getGame(roomCode);

      if (room && playerColor && game && game.state.phase !== 'finished') {
        roomRegistry.updatePlayerStatus(roomCode, socket.id, 'reconnecting');
        
        io.to(roomCode).emit('room:state', room);
        
        const statusPayload: PlayerStatusChangedPayload = {
          playerId: socket.id,
          status: 'reconnecting',
        };
        io.to(roomCode).emit('player:statusChanged', statusPayload);

        gameRegistry.startDisconnectGrace(roomCode, playerColor, () => {
          console.log(`Grace period expired for ${playerColor} in room ${roomCode}`);
          
          const currentRoom = roomRegistry.getRoom(roomCode);
          if (!currentRoom) return;

          const player = currentRoom.players.find(p => p.color === playerColor);
          if (!player) return;

          if (player.status === 'reconnecting') {
            roomRegistry.updatePlayerStatus(roomCode, player.id, 'ai-substitute');
            gameRegistry.markAsAISubstitute(roomCode, playerColor);

            io.to(roomCode).emit('room:state', currentRoom);
            
            const aiStatusPayload: PlayerStatusChangedPayload = {
              playerId: player.id,
              status: 'ai-substitute',
            };
            io.to(roomCode).emit('player:statusChanged', aiStatusPayload);

            const currentGame = gameRegistry.getGame(roomCode);
            if (currentGame && currentGame.state.turn === playerColor) {
              if (currentGame.state.phase === 'awaiting_roll') {
                setTimeout(() => {
                  handleAITurn(roomCode);
                }, 1000);
              } else if (currentGame.state.phase === 'awaiting_move') {
                setTimeout(() => {
                  handleAIMove(roomCode);
                }, 1000);
              }
            }
          }
        });

        console.log(`Player ${socket.id} (${playerColor}) disconnected from room ${roomCode}, starting grace period`);
      } else {
        roomRegistry.updatePlayerConnection(roomCode, socket.id, false);
        
        if (room) {
          io.to(roomCode).emit('room:state', room);
        }
        
        socketToRoom.delete(socket.id);
        if (playerColor) {
          socketToColor.delete(socket.id);
        }
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
