import { createHash } from 'crypto';

export function pseudonymizeInviter(rawId: string): string {
  return createHash('sha256').update(rawId).digest('hex').slice(0, 16);
}
