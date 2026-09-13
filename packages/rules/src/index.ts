/**
 * @ludi/rules - Pure TypeScript game rules engine
 * 
 * Dependency-free, shared by client (prediction) and server (authority).
 * Server is sole source of truth; client uses for validation and prediction.
 */

export function hello(): string {
  return 'Hello from @ludi/rules';
}

// Future exports will include:
// export * from './engine';
// export * from './types';
// export * from './validation';
