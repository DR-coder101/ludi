/** UTC ISO week id such as 2026-W43, and the Monday–Sunday bounds of that week. */

export function isoWeekId(date: Date): string {
  const utc = utcDay(date);
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const year = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function isoWeekRange(date: Date): { start: Date; end: Date; week: string } {
  const utc = utcDay(date);
  const day = utc.getUTCDay() || 7;
  const start = new Date(utc);
  start.setUTCDate(utc.getUTCDate() - (day - 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end, week: isoWeekId(date) };
}

export function inIsoWeek(at: Date, now: Date): boolean {
  return isoWeekId(at) === isoWeekId(now);
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
