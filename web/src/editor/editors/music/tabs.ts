// The music editor's tabs, remembered per browser.
export type MusTab = 'song' | 'inst' | 'set';

export const MUS_TABS: [MusTab, string, string][] = [
  ['song', 'Song', 'Tracks and the piano roll'],
  ['inst', 'Instruments', "The song's FM instruments: pick one, shape its sound, try it"],
  ['set', 'Settings', 'Drum kit, speed, where the song repeats, loudness'],
];

const KEY = 'gm-mus-tab';

export function loadTab(): MusTab {
  try {
    const t = localStorage.getItem(KEY);
    if (MUS_TABS.some(([k]) => k === t)) return t as MusTab;
  } catch {
    /* private mode */
  }
  return 'song';
}

export function saveTab(t: MusTab): void {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
}

/** The tab a key moves to from tab t (arrows wrap, Home and End), or null for other keys. */
export function stepTab(t: MusTab, key: string): MusTab | null {
  const i = MUS_TABS.findIndex(([k]) => k === t);
  const n = MUS_TABS.length;
  const j = key === 'ArrowRight' ? (i + 1) % n : key === 'ArrowLeft' ? (i + n - 1) % n : key === 'Home' ? 0 : key === 'End' ? n - 1 : -1;
  return j < 0 ? null : MUS_TABS[j][0];
}
