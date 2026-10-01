# @ludi/protocol

Shared TypeScript types and Socket.IO event definitions for Ludi.

## Purpose

This package defines the contract between client and server:
- Socket.IO event types
- Game state structures
- Player and room models
- Request/response payloads

## Usage

```typescript
import type { ClientToServerEvents, ServerToClientEvents } from '@ludi/protocol';
import { Server } from 'socket.io';

const io = new Server<ClientToServerEvents, ServerToClientEvents>();
```

## Design

- Fully typed Socket.IO events for compile-time safety
- Shared types prevent drift between client and server
- Zod schemas for payload validation; `TokenPosSchema` bounds `track.cell` to
  0–67 and `homeColumn.step` to 1–7 (`BOARD_TRACK_SIZE` / `BOARD_HOME_COLUMN_LENGTH`,
  which must match `@ludi/rules`)
