/** Semantic exit codes for agent retry logic (ACLI-aligned). */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGS: 2,
  NOT_FOUND: 3,
  PERMISSION_DENIED: 4,
  CONFLICT: 5,
  TIMEOUT: 6,
  UPSTREAM_ERROR: 7,
  PRECONDITION_FAILED: 8,
  DRY_RUN: 9,
} as const;

export type ExitCodeName = keyof typeof ExitCode;
export type ExitCodeValue = (typeof ExitCode)[ExitCodeName];
