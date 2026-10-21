// How to press PC keys on a Mac keyboard, which has no Home/End/PgUp/PgDn, keypad or Insert:
// fn+arrows make the navigation keys, and two arrows held together make the keypad corner
// between them (input/chords.ts). Shown next to key names when the visitor is on a Mac.

/** True on a Mac (or an iPad, whose keyboards lack the same keys). */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return /mac|iphone|ipad/i.test(uad?.platform || navigator.platform || '');
}

const HINTS: Record<number, { chord?: string; fn?: string }> = {
  71: { chord: '↑+←', fn: 'fn ←' }, // Home
  73: { chord: '↑+→', fn: 'fn ↑' }, // PgUp
  79: { chord: '↓+←', fn: 'fn →' }, // End
  81: { chord: '↓+→', fn: 'fn ↓' }, // PgDn
  76: { chord: '↑+↓' }, // Pad 5
  83: { fn: 'fn ⌫' }, // Del
  56: { fn: '⌥ option' }, // Alt
};

/** "↑+← or fn ←": how to make a key on a Mac, or undefined when it is on the keyboard as is. */
export function macHint(scan: number, mac = isMac()): string | undefined {
  const h = mac ? HINTS[scan] : undefined;
  return h ? [h.chord, h.fn].filter(Boolean).join(' or ') : undefined;
}

/** The shortest way to make a key on a Mac ("↑+←", "fn ⌫"), for small key cards. */
export function macShort(scan: number, mac = isMac()): string | undefined {
  const h = mac ? HINTS[scan] : undefined;
  return h ? (h.chord ?? h.fn) : undefined;
}

/** "Home / Pad 7" → "Home / Pad 7 (↑+← or fn ←)" on a Mac; unchanged elsewhere. */
export function withMacHint(name: string, scan: number, mac = isMac()): string {
  const hint = macHint(scan, mac);
  return hint ? `${name} (${hint})` : name;
}
