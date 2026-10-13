export type WeakRefHost = {
  WeakRef?: typeof WeakRef;
  FinalizationRegistry?: typeof FinalizationRegistry;
};

class StrongWeakRef<T extends object> {
  private readonly target: T;

  constructor(target: T) {
    this.target = target;
  }

  deref(): T | undefined {
    return this.target;
  }
}

class NoopFinalizationRegistry<T> {
  constructor(_callback: (heldValue: T) => void) {}

  register(_target: object, _heldValue: T, _unregisterToken?: object): void {}

  unregister(_unregisterToken?: object): void {}
}

export function installWeakRefPolyfill(globals: WeakRefHost = globalThis): void {
  if (typeof globals.WeakRef === 'undefined') {
    globals.WeakRef = StrongWeakRef as unknown as typeof WeakRef;
  }
  if (typeof globals.FinalizationRegistry === 'undefined') {
    globals.FinalizationRegistry = NoopFinalizationRegistry as unknown as typeof FinalizationRegistry;
  }
}

installWeakRefPolyfill();
