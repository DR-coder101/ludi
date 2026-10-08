import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSession, resolveRunDir, writeSession } from '../runDir.js';
import { planGuestAuth, runGuestAuth } from './guest.js';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function listen(
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    void handle(req, res).catch((err: Error) => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('failed to bind guest test server');
  return {
    url: `http://127.0.0.1:${addr.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

describe('planGuestAuth', () => {
  it('plans POST /auth/guest and a session write', () => {
    expect(
      planGuestAuth({
        url: 'http://127.0.0.1:9/',
        runDir: '/tmp/ludi-plan',
        displayName: 'Verifier',
      }),
    ).toEqual([
      {
        action: 'POST',
        url: 'http://127.0.0.1:9/auth/guest',
        body: { displayName: 'Verifier' },
      },
      {
        action: 'write',
        path: '/tmp/ludi-plan/session.json',
        fields: ['auth_user_id', 'access_token'],
      },
    ]);
  });
});

describe('runGuestAuth', () => {
  it('overwrites guest fields and leaves the seat fields', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ludi-guest-'));
    const run = resolveRunDir(root);
    writeSession(run, {
      session_token: 'seat',
      player_id: 'p1',
      display_name: 'Ada',
      auth_user_id: 'old-user',
      access_token: 'old-jwt',
    });
    let calls = 0;
    const server = await listen(async (req, res) => {
      expect(req.method).toBe('POST');
      expect(req.url).toBe('/auth/guest');
      expect(await readBody(req)).toBe('{"displayName":"Verifier"}');
      calls += 1;
      const userId = calls === 1 ? 'user-1' : 'user-2';
      const accessToken = calls === 1 ? 'jwt-1' : 'jwt-2';
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: true, userId, accessToken }));
    });
    try {
      await expect(runGuestAuth({ url: server.url, run, displayName: 'Verifier' })).resolves.toEqual({
        user_id: 'user-1',
        access_token: 'jwt-1',
      });
      expect(readSession(run)).toEqual({
        session_token: 'seat',
        player_id: 'p1',
        display_name: 'Ada',
        auth_user_id: 'user-1',
        access_token: 'jwt-1',
      });
      await expect(runGuestAuth({ url: server.url, run, displayName: 'Verifier' })).resolves.toEqual({
        user_id: 'user-2',
        access_token: 'jwt-2',
      });
      expect(readSession(run)).toEqual({
        session_token: 'seat',
        player_id: 'p1',
        display_name: 'Ada',
        auth_user_id: 'user-2',
        access_token: 'jwt-2',
      });
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not write session.json when the guest HTTP call fails', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ludi-guest-fail-'));
    const run = resolveRunDir(root);
    writeSession(run, {
      session_token: 'seat',
      player_id: 'p1',
      auth_user_id: 'old-user',
      access_token: 'old-jwt',
    });
    const server = await listen(async (req, res) => {
      await readBody(req);
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Auth service not available' }));
    });
    try {
      await expect(runGuestAuth({ url: server.url, run, displayName: 'Verifier' })).rejects.toThrow(
        'POST /auth/guest failed (503): Auth service not available',
      );
      expect(readSession(run)).toEqual({
        session_token: 'seat',
        player_id: 'p1',
        auth_user_id: 'old-user',
        access_token: 'old-jwt',
      });
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not write session.json when the body says success is false', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ludi-guest-body-'));
    const run = resolveRunDir(root);
    writeSession(run, { session_token: 'seat' });
    const server = await listen(async (req, res) => {
      await readBody(req);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'nope' }));
    });
    try {
      await expect(runGuestAuth({ url: server.url, run, displayName: 'Verifier' })).rejects.toThrow(
        'nope',
      );
      expect(readSession(run)).toEqual({ session_token: 'seat' });
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
