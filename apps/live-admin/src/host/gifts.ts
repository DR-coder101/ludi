import type { GiftInbound, LiveGame, LiveGameState } from '@ludi/live-game';
import type { GiftEffectRow } from '../view/types.js';

export function applyCosmeticGift(live: LiveGame, gift: GiftInbound) {
  const before: LiveGameState = live.snapshot();
  const events = live.handleGift(gift);
  const after: LiveGameState = live.snapshot();
  return { before, after, events };
}

export function effectForGift(
  rows: readonly GiftEffectRow[],
  giftId: string,
): string | null {
  const hit = rows.find(
    (row) => row.giftId === giftId.toLowerCase() || row.giftName.toLowerCase() === giftId.toLowerCase(),
  );
  return hit?.effect ?? null;
}

export function setGiftEffect(
  rows: GiftEffectRow[],
  giftId: string,
  effect: string,
): GiftEffectRow[] {
  return rows.map((row) =>
    row.giftId === giftId || row.giftName === giftId ? { ...row, effect } : row,
  );
}
