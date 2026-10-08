import { resolveRunDir, writeSession, type RunDir } from '../runDir.js';

export type GuestAuthResult = {
  user_id: string;
  access_token: string;
};

function guestEndpoint(url: string): string {
  return `${url.replace(/\/$/, '')}/auth/guest`;
}

function guestRequestBody(displayName: string | undefined): { displayName?: string } {
  if (displayName === undefined) return {};
  return { displayName };
}

export function planGuestAuth(args: {
  url: string;
  runDir: string;
  displayName?: string;
}): unknown[] {
  const run = resolveRunDir(args.runDir);
  return [
    {
      action: 'POST',
      url: guestEndpoint(args.url),
      body: guestRequestBody(args.displayName),
    },
    {
      action: 'write',
      path: run.sessionPath,
      fields: ['auth_user_id', 'access_token'],
    },
  ];
}

function guestFailure(message: string): Error {
  return Object.assign(new Error(message), {
    code: 'UPSTREAM_ERROR',
    hint: 'ludi auth guest --help',
  });
}

function errorText(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const error = (payload as Record<string, unknown>).error;
  if (typeof error === 'string' && error.length > 0) return error;
  return null;
}

function parseGuestSuccess(
  payload: unknown,
): { ok: true; userId: string; accessToken: string } | { ok: false; message: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, message: 'POST /auth/guest returned a non-object body' };
  }
  const record = payload as Record<string, unknown>;
  if (record.success !== true) {
    return { ok: false, message: errorText(payload) ?? 'POST /auth/guest failed' };
  }
  if (typeof record.userId !== 'string' || record.userId.length === 0) {
    return { ok: false, message: 'POST /auth/guest omitted userId' };
  }
  if (typeof record.accessToken !== 'string' || record.accessToken.length === 0) {
    return { ok: false, message: 'POST /auth/guest omitted accessToken' };
  }
  return { ok: true, userId: record.userId, accessToken: record.accessToken };
}

export async function runGuestAuth(args: {
  url: string;
  run: RunDir;
  displayName?: string;
}): Promise<GuestAuthResult> {
  const target = guestEndpoint(args.url);
  let res: Response;
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(guestRequestBody(args.displayName)),
    });
  } catch (e) {
    throw guestFailure((e as Error).message);
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw guestFailure(`POST /auth/guest returned HTTP ${res.status} with a non-JSON body`);
  }

  if (!res.ok) {
    const detail = errorText(payload);
    throw guestFailure(
      detail === null
        ? `POST /auth/guest failed (${res.status})`
        : `POST /auth/guest failed (${res.status}): ${detail}`,
    );
  }

  const parsed = parseGuestSuccess(payload);
  if (!parsed.ok) throw guestFailure(parsed.message);

  writeSession(args.run, {
    auth_user_id: parsed.userId,
    access_token: parsed.accessToken,
  });

  return { user_id: parsed.userId, access_token: parsed.accessToken };
}
