import type { InviteEvent, InviteEventKind } from '@ludi/protocol';
import { pseudonymizeInviter } from './pseudonym.js';

export type InviteLog = {
  record(kind: InviteEventKind, code: string, rawInviterId: string): InviteEvent;
  list(code?: string): InviteEvent[];
};

export function createInviteLog(): InviteLog {
  const events: InviteEvent[] = [];

  return {
    record(kind, code, rawInviterId) {
      const event: InviteEvent = {
        kind,
        code,
        inviterId: pseudonymizeInviter(rawInviterId),
        at: new Date().toISOString(),
      };
      events.push(event);
      return event;
    },
    list(code) {
      if (code === undefined) {
        return events.slice();
      }
      return events.filter((event) => event.code === code);
    },
  };
}
