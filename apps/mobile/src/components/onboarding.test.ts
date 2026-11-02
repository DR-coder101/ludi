import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_KEY,
  RULES_HELP_ICON,
  RULES_HELP_LABEL,
  RULES_HELP_SIZE,
  createOnboardingController,
  onboardingModalProps,
  rulesModalFrame,
  type OnboardingSession,
  type OnboardingStorage,
} from './onboarding';

function memoryStorage(initial: Record<string, string | null> = {}): OnboardingStorage & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();
  for (const [key, value] of Object.entries(initial)) {
    if (value != null) data.set(key, value);
  }
  return {
    data,
    async getItem(key: string) {
      return data.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('first-run rules modal', () => {
  it('shows after a first-run hydrate, then stays hidden after dismiss, remount, and resume', async () => {
    const storage = memoryStorage();
    const session: OnboardingSession = { seen: false };
    const first = createOnboardingController(storage, session);
    expect(first.snapshot().visible).toBe(false);

    await first.hydrate();
    expect(first.snapshot().visible).toBe(true);

    first.dismiss();
    expect(first.snapshot().visible).toBe(false);

    const remount = createOnboardingController(storage, session);
    await remount.hydrate();
    expect(remount.snapshot().visible).toBe(false);

    const resume = createOnboardingController(memoryStorage({ [ONBOARDING_KEY]: 'true' }));
    await resume.hydrate();
    expect(resume.snapshot().visible).toBe(false);
  });

  it('hides on dismiss even when persist throws, and a remount does not bring it back', async () => {
    const get = deferred<string | null>();
    const storage: OnboardingStorage = {
      getItem: async () => get.promise,
      setItem: async () => {
        throw new Error('AsyncStorage setItem failed');
      },
    };
    const session: OnboardingSession = { seen: false };
    const controller = createOnboardingController(storage, session);
    const hydrating = controller.hydrate();
    get.resolve(null);
    await hydrating;
    expect(controller.snapshot().visible).toBe(true);

    controller.dismiss();
    expect(controller.snapshot().visible).toBe(false);

    const remount = createOnboardingController(storage, session);
    await remount.hydrate();
    expect(remount.snapshot().visible).toBe(false);
  });

  it('does not reopen when a late first-run read finishes after dismiss', async () => {
    const get = deferred<string | null>();
    const storage: OnboardingStorage = {
      getItem: async () => get.promise,
      setItem: async () => undefined,
    };
    const controller = createOnboardingController(storage);
    const hydrating = controller.hydrate();
    controller.dismiss();
    get.resolve(null);
    await hydrating;
    expect(controller.snapshot().visible).toBe(false);
  });

  it('close button and Android back both dismiss', async () => {
    const storage = memoryStorage();
    const controller = createOnboardingController(storage);
    await controller.hydrate();
    expect(controller.snapshot().visible).toBe(true);

    const close = onboardingModalProps(controller.snapshot().visible, () => {
      controller.dismiss();
    });
    expect(close.visible).toBe(true);
    close.onRequestClose();
    expect(controller.snapshot().visible).toBe(false);

    controller.open();
    const back = onboardingModalProps(controller.snapshot().visible, () => {
      controller.dismiss();
    });
    expect(back.visible).toBe(true);
    back.onRequestClose();
    expect(controller.snapshot().visible).toBe(false);
  });

  it('tapping Game rules opens the modal and closing returns to play', async () => {
    expect(RULES_HELP_SIZE).toBeGreaterThanOrEqual(44);
    expect(RULES_HELP_LABEL).toBe('Game rules');
    expect(RULES_HELP_ICON).toBe('dice');

    const storage = memoryStorage({ [ONBOARDING_KEY]: 'true' });
    const controller = createOnboardingController(storage);
    await controller.hydrate();
    expect(controller.snapshot().visible).toBe(false);

    const help = onboardingModalProps(controller.snapshot().visible, () => {
      controller.dismiss();
    });
    expect(help.visible).toBe(false);
    controller.open();
    expect(controller.snapshot().visible).toBe(true);

    const open = onboardingModalProps(controller.snapshot().visible, () => {
      controller.dismiss();
    });
    expect(open.visible).toBe(true);
    open.onRequestClose();
    expect(controller.snapshot().visible).toBe(false);
  });

  it('opening it manually still works after a persisted first-run dismiss', async () => {
    const storage = memoryStorage({ [ONBOARDING_KEY]: 'true' });
    const controller = createOnboardingController(storage);
    await controller.hydrate();
    expect(controller.snapshot().visible).toBe(false);

    controller.open();
    expect(controller.snapshot().visible).toBe(true);
    expect(onboardingModalProps(true, controller.dismiss).visible).toBe(true);

    controller.dismiss();
    expect(controller.snapshot().visible).toBe(false);
  });

  it('keeps the card inside a small Android screen with a nav bar', () => {
    const frame = rulesModalFrame({ width: 360, height: 640 }, { top: 24, bottom: 48 });
    expect(frame.padTop).toBe(24);
    expect(frame.padBottom).toBe(48);
    expect(frame.maxCardHeight).toBe(568);
    expect(frame.maxCardWidth).toBe(320);
  });
});
