import { createHash } from 'crypto';

/** SHA-256 prefix. No email, phone, or contacts. */
export function pseudonymizeInviter(rawId: string): string {
  return createHash('sha256').update(rawId).digest('hex').slice(0, 16);
}
