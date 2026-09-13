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
- Pure type definitions, no runtime code
