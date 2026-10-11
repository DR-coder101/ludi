export type TikFinityChat = {
  kind: 'chat';
  userId: string;
  displayName: string;
  text: string;
  platformTimestamp?: number;
};

export type TikFinityGift = {
  kind: 'gift';
  userId: string;
  displayName: string;
  giftName: string;
  repeatCount: number;
};

export type TikFinityParsed =
  | TikFinityChat
  | TikFinityGift
  | { kind: 'live' }
  | { kind: 'ended' }
  | { kind: 'ignore' };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asTimeMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
  }
  return undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return undefined;
}

function eventName(row: Record<string, unknown>): string {
  return firstString(row.event, row.type, row.eventName, row.eventType)?.toLowerCase() ?? '';
}

function payloadOf(row: Record<string, unknown>): Record<string, unknown> {
  return asRecord(row.data) ?? asRecord(row.payload) ?? asRecord(row.eventData) ?? row;
}

function userFields(data: Record<string, unknown>): { userId: string; displayName: string } {
  const nested = asRecord(data.user);
  const userId =
    firstString(data.userId, data.user_id, nested?.userId, nested?.user_id, data.uniqueId, nested?.uniqueId) ??
    'unknown';
  const displayName =
    firstString(
      data.nickname,
      data.displayName,
      nested?.nickname,
      nested?.displayName,
      data.uniqueId,
      nested?.uniqueId,
      userId,
    ) ?? userId;
  return { userId, displayName };
}

function parseOne(row: Record<string, unknown>): TikFinityParsed {
  const name = eventName(row);
  const data = payloadOf(row);
  const users = userFields(data);

  switch (name) {
    case 'chat':
    case 'comment':
    case 'comments': {
      const text = firstString(data.comment, data.commentText, data.text, data.message);
      if (!text) return { kind: 'ignore' };
      return {
        kind: 'chat',
        userId: users.userId,
        displayName: users.displayName,
        text: text.trim().replace(/\s+/g, ' '),
        platformTimestamp: asTimeMs(data.createTime) ?? asTimeMs(data.timestamp) ?? asTimeMs(data.timestampMs),
      };
    }
    case 'gift':
    case 'gifts': {
      if (data.repeatEnd === false) return { kind: 'ignore' };
      const gift = asRecord(data.gift) ?? asRecord(data.giftDetails) ?? asRecord(data.extendedGiftInfo);
      const giftName =
        firstString(data.giftName, data.gift_name, gift?.giftName, gift?.name, data.giftId, gift?.giftId) ?? 'gift';
      const repeatCount = Number(firstString(data.repeatCount, data.repeat_count) ?? data.repeatCount ?? 1);
      return {
        kind: 'gift',
        userId: users.userId,
        displayName: users.displayName,
        giftName,
        repeatCount: Number.isFinite(repeatCount) && repeatCount > 0 ? repeatCount : 1,
      };
    }
    case 'like':
    case 'likes':
    case 'follow':
    case 'follower':
    case 'share':
    case 'subscribe':
    case 'subscription':
    case 'sub':
    case 'join':
    case 'member':
    case 'viewer':
    case 'viewer_update':
    case 'roomuser':
      return { kind: 'live' };
    case 'streamend':
    case 'stream_end':
    case 'liveend':
    case 'live_end':
      return { kind: 'ended' };
    default:
      return { kind: 'ignore' };
  }
}

export function parseTikFinityMessage(raw: string): TikFinityParsed[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return [{ kind: 'ignore' }];
  }
  const rows = Array.isArray(decoded) ? decoded : [decoded];
  return rows.map((row) => {
    const record = asRecord(row);
    if (!record) return { kind: 'ignore' };
    return parseOne(record);
  });
}
