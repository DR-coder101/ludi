export const ONBOARDING_KEY = '@ludi_onboarding_shown';
export const ONBOARDING_SEEN_VALUE = 'true';

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

/**
 * Current board hook semantics (3f11ffe): hide only after setItem resolves,
 * and each controller instance hydrates independently.
 */
export function createOnboardingController(
  storage: OnboardingStorage,
  _session: OnboardingSession = { seen: false },
) {
  let shouldShow = false;
  let hasChecked = false;

  function snapshot(): OnboardingSnapshot {
    return { visible: hasChecked && shouldShow, ready: hasChecked };
  }

  async function hydrate(): Promise<OnboardingSnapshot> {
    try {
      const shown = await storage.getItem(ONBOARDING_KEY);
      if (!shown) {
        shouldShow = true;
      }
    } catch {
      // match useOnboarding: swallow
    } finally {
      hasChecked = true;
    }
    return snapshot();
  }

  async function dismiss(): Promise<OnboardingSnapshot> {
    try {
      await storage.setItem(ONBOARDING_KEY, ONBOARDING_SEEN_VALUE);
      shouldShow = false;
    } catch {
      // match useOnboarding: hide never runs
    }
    return snapshot();
  }

  function open(): OnboardingSnapshot {
    hasChecked = true;
    shouldShow = true;
    return snapshot();
  }

  function subscribe(_listener: (snap: OnboardingSnapshot) => void): () => void {
    return () => undefined;
  }

  return { snapshot, hydrate, dismiss, open, subscribe };
}
