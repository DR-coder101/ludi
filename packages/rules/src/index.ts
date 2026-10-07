/**
 * @ludi/rules - Pure TypeScript game rules engine
 * 
 * Dependency-free, shared by client (prediction) and server (authority).
 * Server is sole source of truth; client uses for validation and prediction.
 */

export * from "./types.js";
export * from "./topology.js";
export * from "./game.js";
export * from "./legalMoves.js";
export * from "./rollDice.js";
export * from "./applyMove.js";
