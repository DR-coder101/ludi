export function describeRouteError(error: unknown): string {
  console.error('[Ludi] route error', error);
  if (error instanceof Error && error.message) return error.message;
  return 'The board hit an unexpected error.';
}

export function homeResetOnRouteError(): false {
  return false;
}
