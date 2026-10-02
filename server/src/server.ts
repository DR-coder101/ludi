import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { AccessToken } from 'livekit-server-sdk';
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
  VideoTokenResponse,
  AuthResponse,
  ProfileResponse,
  MatchHistoryResponse,
} from '@ludi/protocol';
import { 
  RoomCreatePayloadSchema, 
  RoomJoinPayloadSchema,
  SeatSelectPayloadSchema,
  GameRollPayloadSchema,
  GameMovePayloadSchema,
  VideoTokenPayloadSchema,
  GuestCreatePayloadSchema,
  EmailSignUpPayloadSchema,
  EmailSignInPayloadSchema,
  GuestUpgradePayloadSchema,
  UpdateProfilePayloadSchema,
} from '@ludi/protocol';
import { RoomRegistry } from './RoomRegistry.js';
import { RateLimiter } from './RateLimiter.js';
import { GameManagerRegistry, type GameTimingConfig } from './GameManager.js';
import { getSupabaseClient } from './db/supabase.js';
import { createAuthService } from './services/auth.js';
import { createProfileService } from './services/profile.js';
import { createMatchHistoryService } from './services/matchHistory.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/types.js';

export interface ServerConfig {
  port?: number;
  timingConfig?: GameTimingConfig;
  supabase?: SupabaseClient<Database>;
}

export function createLudiServer(portOrConfig: number | ServerConfig = 3000) {
  const config: ServerConfig = typeof portOrConfig === 'number' 
    ? { port: portOrConfig } 
    : portOrConfig;
  const port = config.port ?? 3000;
  const app = express();
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const roomRegistry = new RoomRegistry();
  const gameRegistry = new GameManagerRegistry(config.timingConfig);
  const rateLimiter = new RateLimiter(10, 1000);
  const socketToRoom = new Map<string, string>();
  const socketToPlayer = new Map<string, string>();
  const socketToColor = new Map<string, Color>();

  const cleanupInterval = setInterval(() => rateLimiter.cleanup(), 10000);

  let supabase: SupabaseClient<Database> | null = null;
  let authService: ReturnType<typeof createAuthService> | null = null;
  let profileService: ReturnType<typeof createProfileService> | null = null;
  let matchHistoryService: ReturnType<typeof createMatchHistoryService> | null = null;

  if (config.supabase) {
    supabase = config.supabase;
    authService = createAuthService(supabase);
    profileService = createProfileService(supabase);
    matchHistoryService = createMatchHistoryService(supabase);
  } else {
    try {
      supabase = getSupabaseClient();
      authService = createAuthService(supabase);
      profileService = createProfileService(supabase);
      matchHistoryService = createMatchHistoryService(supabase);
    } catch (err) {
      console.warn('Supabase not configured, M5.1 features disabled');
    }
  }

  app.use(express.json());

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

  app.post('/video-token', async (req, res) => {
    const validationResult = VideoTokenPayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'Invalid request payload',
      };
      res.status(400).json(response);
      return;
    }

    const { roomCode, userId } = validationResult.data;

    const room = roomRegistry.getRoom(roomCode);
    if (!room) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'Room not found',
      };
      res.status(404).json(response);
      return;
    }

    const player = room.players.find(p => p.id === userId);
    if (!player) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'Player not seated in room',
      };
      res.status(403).json(response);
      return;
    }

    const game = gameRegistry.getGame(roomCode);
    if (!game) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'Game has not started yet (must be in READY_CHECK phase or later)',
      };
      res.status(403).json(response);
      return;
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'LiveKit configuration missing',
      };
      res.status(500).json(response);
      return;
    }

    try {
      const token = new AccessToken(apiKey, apiSecret, {
        identity: userId,
      });

      token.addGrant({
        room: roomCode,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });

      const jwt = await token.toJwt();

      const response: VideoTokenResponse = {
        success: true,
        token: jwt,
      };
      res.json(response);
    } catch (error) {
      const response: VideoTokenResponse = {
        success: false,
        error: 'Failed to generate token',
      };
      res.status(500).json(response);
    }
  });

  app.post('/auth/guest', async (req, res) => {
    if (!authService) {
      res.status(503).json({ success: false, error: 'Auth service not available' } as AuthResponse);
      return;
    }

    const validationResult = GuestCreatePayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ success: false, error: 'Invalid payload' } as AuthResponse);
      return;
    }

    try {
      const result = await authService.createGuest(validationResult.data.displayName);
      res.json({ success: true, userId: result.userId, accessToken: result.accessToken } as AuthResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as AuthResponse);
    }
  });

  app.post('/auth/signup', async (req, res) => {
    if (!authService) {
      res.status(503).json({ success: false, error: 'Auth service not available' } as AuthResponse);
      return;
    }

    const validationResult = EmailSignUpPayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ success: false, error: 'Invalid payload' } as AuthResponse);
      return;
    }

    try {
      const { email, password, displayName } = validationResult.data;
      const result = await authService.signUpWithEmail(email, password, displayName);
      res.json({ success: true, userId: result.userId, accessToken: result.accessToken } as AuthResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as AuthResponse);
    }
  });

  app.post('/auth/signin', async (req, res) => {
    if (!authService) {
      res.status(503).json({ success: false, error: 'Auth service not available' } as AuthResponse);
      return;
    }

    const validationResult = EmailSignInPayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ success: false, error: 'Invalid payload' } as AuthResponse);
      return;
    }

    try {
      const { email, password } = validationResult.data;
      const result = await authService.signInWithEmail(email, password);
      res.json({ success: true, userId: result.userId, accessToken: result.accessToken } as AuthResponse);
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message } as AuthResponse);
    }
  });

  app.post('/auth/upgrade', async (req, res) => {
    if (!authService) {
      res.status(503).json({ success: false, error: 'Auth service not available' } as AuthResponse);
      return;
    }

    const validationResult = GuestUpgradePayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ success: false, error: 'Invalid payload' } as AuthResponse);
      return;
    }

    const guestUserId = req.headers.authorization?.replace('Bearer ', '');
    if (!guestUserId) {
      res.status(401).json({ success: false, error: 'Missing authorization' } as AuthResponse);
      return;
    }

    try {
      const { email, password } = validationResult.data;
      const result = await authService.upgradeGuestToEmail(guestUserId, email, password);
      res.json({ success: true, userId: result.userId, accessToken: result.accessToken } as AuthResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as AuthResponse);
    }
  });

  app.get('/profile/:userId', async (req, res) => {
    if (!profileService) {
      res.status(503).json({ success: false, error: 'Profile service not available' } as ProfileResponse);
      return;
    }

    try {
      const profile = await profileService.getProfile(req.params.userId);
      res.json({ success: true, profile } as ProfileResponse);
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message } as ProfileResponse);
    }
  });

  app.put('/profile/:userId', async (req, res) => {
    if (!profileService) {
      res.status(503).json({ success: false, error: 'Profile service not available' } as ProfileResponse);
      return;
    }

    const validationResult = UpdateProfilePayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ success: false, error: 'Invalid payload' } as ProfileResponse);
      return;
    }

    try {
      const profile = await profileService.updateProfile(req.params.userId, validationResult.data);
      res.json({ success: true, profile } as ProfileResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ProfileResponse);
    }
  });

  app.get('/matches/:userId', async (req, res) => {
    if (!matchHistoryService) {
      res.status(503).json({ success: false, error: 'Match history service not available' } as MatchHistoryResponse);
      return;
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const matches = await matchHistoryService.getUserMatches(req.params.userId, limit);
      res.json({ success: true, matches } as MatchHistoryResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as MatchHistoryResponse);
    }
  });

  type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

  function getPlayerIdBySocket(socketId: string): string | undefined {
    return socketToPlayer.get(socketId);
  }

  function getPlayerIdByColor(roomCode: string, color: Color): string | undefined {
    const room = roomRegistry.getRoom(roomCode);
    if (!room) return undefined;
    
    const player = room.players.find(p => p.color === color);
    return player?.id;
  }

  function checkRateLimit(socket: TypedSocket): boolean {
    if (!rateLimiter.isAllowed(socket.id)) {
      socket.emit('error', 'Rate limit exceeded. Please slow down.');
      return false;
    }
    return true;
  }

  async function persistMatchHistory(
    roomCode: string, 
    gameState: GameState, 
    placements: Array<{ playerId: string; color: Color; placement: number }>
  ): Promise<void> {
    if (!matchHistoryService) {
      return;
    }

    const room = roomRegistry.getRoom(roomCode);
    if (!room) {
      return;
    }

    try {
      const game = gameRegistry.getGame(roomCode);
      if (!game) {
        return;
      }

      const winnerId = placements.find(p => p.placement === 1)?.playerId;
      if (!winnerId) {
        return;
      }

      await matchHistoryService.saveMatch({
        roomCode,
        startedAt: new Date(Date.now() - 600000),
        endedAt: new Date(),
        winnerId,
        houseRules: gameState.config.houseRules,
        players: placements.map(p => ({
          userId: p.playerId,
          color: p.color,
          finalPosition: p.placement,
        })),
      });

      console.log(`Match history saved for room ${roomCode}`);
    } catch (err) {
      console.error(`Failed to save match history for room ${roomCode}:`, err);
    }
  }

  function emitTokenMoved(
    roomCode: string,
    playerId: string | undefined,
    move: { tokenIndex: number; dieIndex: 0 | 1; steps: number },
    result: ReturnType<typeof gameRegistry.applyMove>,
  ): void {
    if (!playerId) return;
    const tokenMovedPayload: TokenMovedPayload = {
      playerId,
      tokenIndex: move.tokenIndex,
      dieIndex: move.dieIndex,
      steps: move.steps,
      from: result.from!,
      to: result.to!,
      captured: result.captured,
    };
    io.to(roomCode).emit('game:tokenMoved', tokenMovedPayload);
  }

  function emitDiceRolled(roomCode: string, playerId: string | undefined, values: [number, number]): void {
    if (!playerId) return;
    const dicePayload: DiceRolledPayload = {
      playerId,
      values,
      legalMoves: gameRegistry.getLegalMoves(roomCode),
    };
    io.to(roomCode).emit('game:diceRolled', dicePayload);
  }

  /**
   * Turn loop after a roll or move has settled: game over, the same player
   * still holding a playable die, or a fresh throw (bonus roll or next player).
   */
  async function advanceTurn(roomCode: string): Promise<void> {
    const game = gameRegistry.getGame(roomCode);
    const room = roomRegistry.getRoom(roomCode);
    if (!game || !room) return;
    const state = game.state;

    if (state.phase === 'finished') {
      const placements = state.placements.map((color, idx) => ({
        playerId: room.players.find(p => p.color === color)?.id || '',
        color,
        placement: idx + 1,
      }));
      const gameOverPayload: GameOverPayload = {
        winnerId: room.players.find(p => p.color === state.winner)?.id || '',
        placements,
      };
      io.to(roomCode).emit('game:over', gameOverPayload);
      await persistMatchHistory(roomCode, state, placements);
      return;
    }

    const isAI = gameRegistry.isAISubstitute(roomCode, state.turn);

    if (state.phase === 'awaiting_move') {
      if (isAI) {
        setTimeout(() => {
          handleAIMove(roomCode);
        }, gameRegistry.getAIThinkDelay());
      } else {
        gameRegistry.setMoveTimer(roomCode, () => {
          handleMoveTimeout(roomCode);
        });
      }
      return;
    }

    const nextPlayerId = getPlayerIdByColor(roomCode, state.turn);
    if (nextPlayerId) {
      const turnPayload: TurnChangedPayload = {
        playerId: nextPlayerId,
        deadlineTs: Date.now() + 30000,
      };
      io.to(roomCode).emit('game:turnChanged', turnPayload);
    }

    if (isAI) {
      setTimeout(() => {
        handleAITurn(roomCode);
      }, gameRegistry.getAIThinkDelay());
    }
  }

  function handleAITurn(roomCode: string): void {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;

    const currentColor = game.state.turn;
    if (!gameRegistry.isAISubstitute(roomCode, currentColor)) return;
    if (game.state.phase !== 'awaiting_roll') return;

    const result = gameRegistry.rollDice(roomCode);
    if (!result.success) return;

    io.to(roomCode).emit('game:state', game.state);
    emitDiceRolled(roomCode, getPlayerIdByColor(roomCode, currentColor), result.values!);
    void advanceTurn(roomCode);
  }

  /** AI substitute plays one die; advanceTurn schedules the next die if one is left. */
  async function handleAIMove(roomCode: string): Promise<void> {
    const game = gameRegistry.getGame(roomCode);
    if (!game) return;

    const currentColor = game.state.turn;
    if (!gameRegistry.isAISubstitute(roomCode, currentColor)) return;
    if (game.state.phase !== 'awaiting_move') return;

    const moves = gameRegistry.getLegalMoves(roomCode);
    if (moves.length === 0) return;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    const result = gameRegistry.applyMove(roomCode, randomMove.tokenIndex, randomMove.dieIndex);
    if (!result.success) return;

    emitTokenMoved(roomCode, getPlayerIdByColor(roomCode, currentColor), randomMove, result);
    io.to(roomCode).emit('game:state', game.state);
    await advanceTurn(roomCode);
  }

  /** Turn timer expired: play a random legal move for every die still playable (GAME_RULES §10.12). */
  async function handleMoveTimeout(roomCode: string): Promise<void> {
    const game = gameRegistry.getGame(roomCode);
    if (!game || game.state.phase !== 'awaiting_move') return;

    const color = game.state.turn;
    const playerId = getPlayerIdByColor(roomCode, color);

    while (game.state.phase === 'awaiting_move' && game.state.turn === color) {
      const moves = gameRegistry.getLegalMoves(roomCode);
      if (moves.length === 0) return;

      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const result = gameRegistry.applyMove(roomCode, randomMove.tokenIndex, randomMove.dieIndex);
      if (!result.success) return;

      emitTokenMoved(roomCode, playerId, randomMove, result);
      io.to(roomCode).emit('game:state', game.state);
    }

    await advanceTurn(roomCode);
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
      const { roomCode, playerId } = roomRegistry.createRoom(displayName, houseRules, sessionToken);
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);
      socketToPlayer.set(socket.id, playerId);

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        socketToColor.set(socket.id, room.players[0].color);
        socket.emit('room:state', room);
      }

      callback({ success: true, roomCode, sessionToken, playerId });
      console.log(`Room created: ${roomCode} by player ${playerId} (socket ${socket.id})`);
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
        const reconnectResult = roomRegistry.reconnectPlayer(sessionToken);
        
        if (reconnectResult.success && reconnectResult.roomCode === roomCode) {
          const playerId = reconnectResult.playerId!;
          
          socket.join(roomCode);
          socketToRoom.set(socket.id, roomCode);
          socketToPlayer.set(socket.id, playerId);
          socketToColor.set(socket.id, reconnectResult.color!);

          const game = gameRegistry.getGame(roomCode);
          const room = roomRegistry.getRoom(roomCode);
          
          if (room) {
            const cancelResult = gameRegistry.cancelDisconnectGrace(roomCode, reconnectResult.color!);
            
            roomRegistry.updatePlayerStatus(roomCode, playerId, 'connected');
            
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
              playerId,
              status: 'connected',
            };
            io.to(roomCode).emit('player:statusChanged', statusPayload);
          }

          callback({ success: true, sessionToken, isReconnect: true, playerId });
          console.log(`Player ${playerId} reconnected to room ${roomCode} (socket ${socket.id})`);
          return;
        }
      }

      const sessionTokenNew = roomRegistry.generateSessionToken();
      const result = roomRegistry.joinRoom(roomCode, displayName, sessionTokenNew);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      const playerId = result.playerId!;
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);
      socketToPlayer.set(socket.id, playerId);
      if (result.color) {
        socketToColor.set(socket.id, result.color);
      }

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
      }

      callback({ success: true, sessionToken: sessionTokenNew, playerId });
      console.log(`Player ${playerId} joined room ${roomCode} (socket ${socket.id})`);
    });

    socket.on('room:selectSeat', (payload, callback) => {
      if (!checkRateLimit(socket)) {
        callback({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      const validationResult = SeatSelectPayloadSchema.safeParse(payload);
      if (!validationResult.success) {
        callback({ success: false, error: 'Invalid payload' });
        return;
      }

      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player ID not found' });
        return;
      }

      const { color } = validationResult.data;
      const result = roomRegistry.selectSeat(roomCode, playerId, color);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      socketToColor.set(socket.id, color);

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
      }

      callback({ success: true });
      console.log(`Player ${playerId} selected seat ${color} in room ${roomCode}`);
    });

    socket.on('room:leave', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = roomRegistry.leaveRoom(roomCode, playerId);
      
      socket.leave(roomCode);
      socketToRoom.delete(socket.id);
      socketToPlayer.delete(socket.id);
      socketToColor.delete(socket.id);

      if (result.shouldCloseRoom) {
        gameRegistry.deleteGame(roomCode);
        console.log(`Room ${roomCode} closed (empty)`);
        return;
      }

      const room = roomRegistry.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:state', room);
        console.log(`Player ${playerId} left room ${roomCode}`);
      }
    });

    socket.on('room:ready', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = roomRegistry.getRoom(roomCode);
      if (!room || room.players.length < 2) {
        return;
      }

      room.status = 'in_progress';

      const playerColors = room.players.map(p => p.color);
      const gameState = gameRegistry.createGame(roomCode, {
        playerColors,
        houseRules: room.houseRules,
      });

      io.to(roomCode).emit('game:state', gameState);
      
      const currentPlayerId = getPlayerIdByColor(roomCode, gameState.turn);
      
      if (currentPlayerId) {
        const turnPayload: TurnChangedPayload = {
          playerId: currentPlayerId,
          deadlineTs: Date.now() + 30000,
        };
        io.to(roomCode).emit('game:turnChanged', turnPayload);
      }

      console.log(`Game started in room ${roomCode}`);
    });

    socket.on('game:roll', async (payload, callback) => {
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
      emitDiceRolled(roomCode, socketToPlayer.get(socket.id), result.values!);
      await advanceTurn(roomCode);
    });

    socket.on('game:move', async (payload, callback) => {
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

      const { tokenIndex, dieIndex } = validationResult.data;
      const steps = game.state.dice?.[dieIndex]?.value ?? 0;
      const result = gameRegistry.applyMove(roomCode, tokenIndex, dieIndex);

      if (!result.success) {
        callback({ success: false, error: result.error, hint: result.hint });
        return;
      }

      callback({ success: true });

      emitTokenMoved(roomCode, socketToPlayer.get(socket.id), { tokenIndex, dieIndex, steps }, result);
      io.to(roomCode).emit('game:state', game.state);
      await advanceTurn(roomCode);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const room = roomRegistry.getRoom(roomCode);
      const playerColor = socketToColor.get(socket.id);
      const playerId = socketToPlayer.get(socket.id);
      const game = gameRegistry.getGame(roomCode);

      if (room && playerColor && playerId && game && game.state.phase !== 'finished') {
        roomRegistry.updatePlayerStatus(roomCode, playerId, 'reconnecting');
        
        io.to(roomCode).emit('room:state', room);
        
        const statusPayload: PlayerStatusChangedPayload = {
          playerId,
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
                }, gameRegistry.getAIThinkDelay());
              } else if (currentGame.state.phase === 'awaiting_move') {
                setTimeout(() => {
                  handleAIMove(roomCode);
                }, gameRegistry.getAIThinkDelay());
              }
            }
          }
        });

        socketToRoom.delete(socket.id);
        socketToPlayer.delete(socket.id);
        socketToColor.delete(socket.id);

        console.log(`Player ${playerId} (${playerColor}) disconnected from room ${roomCode} (socket ${socket.id}), starting grace period`);
      } else {
        if (playerId) {
          roomRegistry.updatePlayerConnection(roomCode, playerId, false);
        }
        
        if (room) {
          io.to(roomCode).emit('room:state', room);
        }
        
        socketToRoom.delete(socket.id);
        socketToPlayer.delete(socket.id);
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
