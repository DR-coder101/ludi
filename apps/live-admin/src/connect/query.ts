import { isAdminDemoId, type AdminDemoId } from '../view/types.js';

export type AdminQuery = {
  demo: AdminDemoId | null;
  settle: boolean;
};

export function parseQuery(search: string): AdminQuery {
  const q = new URLSearchParams(search);
  const raw = q.get('demo');
  return {
    demo: isAdminDemoId(raw) ? raw : null,
    settle: q.get('settle') === '1',
  };
}
