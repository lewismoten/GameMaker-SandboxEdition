// The day each honors was earned (the graduation game's id to an ISO date), kept in this browser only
// (localStorage `gm-honors-dates`, in the backup under Achievements and in the Reset). Only the first
// finish counts: a replay keeps the first day. The Honors tab prints it on the certificate.
export const HONOR_DATES_KEY = 'gm-honors-dates';

export function loadHonorDates(): Record<string, string> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(HONOR_DATES_KEY) ?? 'null');
    const out: Record<string, string> = {};
    if (raw && typeof raw === 'object')
      for (const [id, d] of Object.entries(raw as Record<string, unknown>)) if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) out[id] = d;
    return out;
  } catch {
    return {};
  }
}

/** Notes today as the day `id` was earned, unless a day is already kept. */
export function noteHonor(id: string, now = new Date()): void {
  const dates = loadHonorDates();
  if (dates[id]) return;
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  try {
    localStorage.setItem(HONOR_DATES_KEY, JSON.stringify({ ...dates, [id]: day }));
  } catch {
    /* storage off: no date is kept */
  }
}

export function clearHonorDates(): void {
  try {
    localStorage.removeItem(HONOR_DATES_KEY);
  } catch {
    /* nothing kept */
  }
}
