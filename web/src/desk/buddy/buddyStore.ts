// What the desk buddy keeps between visits, in localStorage `gm-desk-buddy` (the backup's Desk
// section): whether it is quiet, whether it has introduced itself, and the day of its last hello.
// Nothing it keeps can nag: there are no dates to miss and no counts to keep up.

const KEY = 'gm-desk-buddy';

interface BuddySaved {
  quiet?: boolean;
  met?: boolean;
  helloDay?: string;
}

export function loadBuddy(): BuddySaved {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (!o || typeof o !== 'object') return {};
    const { quiet, met, helloDay } = o as Record<string, unknown>;
    return { quiet: quiet === true, met: met === true, helloDay: typeof helloDay === 'string' ? helloDay : undefined };
  } catch {
    return {};
  }
}

export function saveBuddy(s: BuddySaved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: it forgets, which costs nothing */
  }
}
