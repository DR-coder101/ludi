import { describe, expect, it, vi } from 'vitest';
import { createLiveKitRoomBind, liveKitConnectEffectKey } from './liveKitRoomBind';

function countConnectInvocations(
  renders: ReturnType<ReturnType<typeof createLiveKitRoomBind>>[],
): number {
  let n = 0;
  let prev: (typeof renders)[number] | undefined;
  for (const next of renders) {
    const prevKey = prev ? liveKitConnectEffectKey(prev) : null;
    const nextKey = liveKitConnectEffectKey(next);
    if (
      !prevKey ||
      prevKey.connect !== nextKey.connect ||
      prevKey.token !== nextKey.token ||
      prevKey.serverUrl !== nextKey.serverUrl ||
      prevKey.onError !== nextKey.onError
    ) {
      n += 1;
    }
    prev = next;
  }
  return n;
}

describe('createLiveKitRoomBind', () => {
  it('does not re-invoke connect across re-renders with the same token', () => {
    const bind = createLiveKitRoomBind();
    const renders = [0, 1, 2].map((i) =>
      bind({
        token: 'lk-jwt',
        url: 'wss://livekit.example',
        audio: true,
        video: true,
        facingUser: true,
        onConnected: () => {
          void i;
        },
        onDisconnected: () => {
          void i;
        },
        onError: () => {
          void i;
        },
      }),
    );

    expect(countConnectInvocations(renders)).toBe(1);
    expect(renders[0].onError).toBe(renders[1].onError);
    expect(renders[0].onConnected).toBe(renders[1].onConnected);
    expect(renders[0].video).toBe(renders[1].video);
  });

  it('re-invokes connect when the token changes', () => {
    const bind = createLiveKitRoomBind();
    const first = bind({
      token: 'jwt-a',
      url: 'wss://livekit.example',
      audio: true,
      video: false,
      facingUser: true,
    });
    const second = bind({
      token: 'jwt-b',
      url: 'wss://livekit.example',
      audio: true,
      video: false,
      facingUser: true,
    });

    expect(countConnectInvocations([first, second])).toBe(2);
  });

  it('warns LiveKit errors without logging the token', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bind = createLiveKitRoomBind();
    const room = bind({
      token: 'secret-jwt',
      url: 'wss://livekit.example',
      audio: true,
      video: false,
      facingUser: true,
    });

    room.onError(new Error('already connected to room ABCD'));

    expect(warn).toHaveBeenCalledWith('[Video] LiveKit room error', 'already connected to room ABCD');
    expect(warn.mock.calls.flat().join(' ')).not.toContain('secret-jwt');
    warn.mockRestore();
  });
});
