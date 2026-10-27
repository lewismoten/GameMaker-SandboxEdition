// Whether the screen is a phone's, and how it is held: a touch screen (its main pointer coarse)
// with a narrow viewport (its shorter side at most PHONE_SIDE pixels), so a tablet or a touch
// laptop isn't one. The achievements (achievements/playedOn.ts) and the documents' default view
// (manual/readView.ts) ask it.

/** How a phone is held: wide (landscape) or tall (portrait); `off` is not a phone. */
export type Hold = 'wide' | 'tall' | 'off';

/** A phone's viewport is at most this many CSS pixels on its shorter side. */
const PHONE_SIDE = 500;

/** How the screen is held now, from its viewport and whether its main pointer is a finger. */
export function holdOf(width: number, height: number, coarse: boolean): Hold {
  if (!coarse || Math.min(width, height) > PHONE_SIDE) return 'off';
  return width > height ? 'wide' : 'tall';
}

/** How this page's screen is held now. */
export function holdNow(): Hold {
  if (typeof window === 'undefined') return 'off';
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return holdOf(innerWidth, innerHeight, coarse);
}
