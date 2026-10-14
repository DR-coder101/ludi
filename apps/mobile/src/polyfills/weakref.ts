export type WeakRefHost = {
  WeakRef?: typeof WeakRef;
  FinalizationRegistry?: typeof FinalizationRegistry;
};

class StrongWeakRef<T extends WeakKey> implements WeakRef<T> {
  readonly [Symbol.toStringTag] = 'WeakRef' as const;
  private readonly target: T;

  constructor(target: T) {
    this.target = target;
  }

  deref(): T | undefined {
    return this.target;
  }
}

class NoopFinalizationRegistry<T> implements FinalizationRegistry<T> {
  readonly [Symbol.toStringTag] = 'FinalizationRegistry' as const;

  constructor(_callback: (heldValue: T) => void) {}

  register(_target: WeakKey, _heldValue: T, _unregisterToken?: WeakKey): void {}

  unregister(_unregisterToken: WeakKey): boolean {
    return false;
  }
}

export function installWeakRefPolyfill(globals: WeakRefHost = globalThis): void {
  if (typeof globals.WeakRef === 'undefined') {
    globals.WeakRef = StrongWeakRef;
  }
  if (typeof globals.FinalizationRegistry === 'undefined') {
    globals.FinalizationRegistry = NoopFinalizationRegistry;
  }
}

installWeakRefPolyfill();
