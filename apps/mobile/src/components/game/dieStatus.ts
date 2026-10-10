export type DieStatusLabel = 'ACTIVE' | 'PLAYED';

/** Visible tag under a die on the turn card. Unused idle dice stay unlabeled. */
export function dieStatusLabel(used: boolean, active: boolean): DieStatusLabel | null {
  if (used) return 'PLAYED';
  if (active) return 'ACTIVE';
  return null;
}
