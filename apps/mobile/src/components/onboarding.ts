export const ONBOARDING_KEY = '@ludi_onboarding_shown';
export const ONBOARDING_SEEN_VALUE = 'true';
export const RULES_OVERLAY_PAD = 20;
export const RULES_CARD_MAX_WIDTH = 400;

export type OnboardingStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type OnboardingSession = {
  seen: boolean;
};

export type OnboardingSnapshot = {
  visible: boolean;
  ready: boolean;
};

export type RulesInsets = {
  top: number;
  bottom: number;
};

export function parseOnboardingSeen(raw: string | null): boolean {
  return raw === ONBOARDING_SEEN_VALUE;
}

export function onboardingModalProps(visible: boolean, onDismiss: () => void) {
  return {
    transparent: true as const,
    animationType: 'fade' as const,
    visible,
    onRequestClose: onDismiss,
  };
}

export function rulesModalFrame(
  viewport: { width: number; height: number },
  insets: RulesInsets,
) {
  const padTop = Math.max(insets.top, RULES_OVERLAY_PAD);
  const padBottom = Math.max(insets.bottom, RULES_OVERLAY_PAD);
  return {
    padTop,
    padBottom,
    maxCardHeight: Math.max(0, viewport.height - padTop - padBottom),
    maxCardWidth: Math.min(
      RULES_CARD_MAX_WIDTH,
      Math.max(0, viewport.width - RULES_OVERLAY_PAD * 2),
    ),
  };
}

export function createOnboardingController(
  storage: OnboardingStorage,
  session: OnboardingSession = { seen: false },
) {
  let visible = false;
  let ready = session.seen;
  let hydrateGen = 0;
  const listeners = new Set<(snap: OnboardingSnapshot) => void>();

  function snapshot(): OnboardingSnapshot {
    return { visible, ready };
  }

  function emit() {
    const snap = snapshot();
    for (const listener of listeners) listener(snap);
  }

  async function hydrate(): Promise<OnboardingSnapshot> {
    if (session.seen) {
      ready = true;
      emit();
      return snapshot();
    }
    const gen = ++hydrateGen;
    try {
      const raw = await storage.getItem(ONBOARDING_KEY);
      if (gen !== hydrateGen || session.seen) return snapshot();
      const seen = parseOnboardingSeen(raw);
      session.seen = seen;
      visible = !seen;
      ready = true;
      emit();
    } catch {
      if (gen !== hydrateGen || session.seen) return snapshot();
      ready = true;
      visible = false;
      emit();
    }
    return snapshot();
  }

  function dismiss(): OnboardingSnapshot {
    hydrateGen += 1;
    session.seen = true;
    visible = false;
    ready = true;
    emit();
    void storage.setItem(ONBOARDING_KEY, ONBOARDING_SEEN_VALUE).catch(() => undefined);
    return snapshot();
  }

  function open(): OnboardingSnapshot {
    visible = true;
    ready = true;
    emit();
    return snapshot();
  }

  function subscribe(listener: (snap: OnboardingSnapshot) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { snapshot, hydrate, dismiss, open, subscribe };
}

const processSession: OnboardingSession = { seen: false };
let processController: ReturnType<typeof createOnboardingController> | null = null;

export function getOnboardingController(storage: OnboardingStorage) {
  if (!processController) {
    processController = createOnboardingController(storage, processSession);
  }
  return processController;
}
