import { describe, expect, it } from 'vitest';
import { installWeakRefPolyfill } from './weakref';

describe('installWeakRefPolyfill', () => {
  it('installs WeakRef and FinalizationRegistry when they are absent', () => {
    const target = { id: 1 };
    const host: {
      WeakRef?: typeof WeakRef;
      FinalizationRegistry?: typeof FinalizationRegistry;
    } = {};

    installWeakRefPolyfill(host);

    expect(host.WeakRef).toBeTypeOf('function');
    expect(host.FinalizationRegistry).toBeTypeOf('function');

    const ref = new host.WeakRef!(target);
    expect(ref.deref()).toBe(target);

    const registry = new host.FinalizationRegistry!(() => {
      throw new Error('polyfill registry must not run the callback');
    });
    expect(() => {
      registry.register(target, 'held');
      registry.unregister(target);
    }).not.toThrow();
  });

  it('leaves a native WeakRef and FinalizationRegistry untouched', () => {
    class NativeWeakRef<T extends object> {
      constructor(readonly target: T) {}
      deref(): T {
        return this.target;
      }
    }
    class NativeFinalizationRegistry<T> {
      constructor(readonly callback: (heldValue: T) => void) {}
      register(): void {}
      unregister(): void {}
    }
    const host = {
      WeakRef: NativeWeakRef as unknown as typeof WeakRef,
      FinalizationRegistry: NativeFinalizationRegistry as unknown as typeof FinalizationRegistry,
    };

    installWeakRefPolyfill(host);

    expect(host.WeakRef).toBe(NativeWeakRef);
    expect(host.FinalizationRegistry).toBe(NativeFinalizationRegistry);
  });
});
