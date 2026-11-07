// The Specials' registry, what this browser keeps, the catalog filter and the desk's arrival hooks.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPECIALS, specialById } from './registry';
import { forceSpecial, isListed, keepSpecial, keptHow, resetAllSpecials, resetSpecial } from './state';
import { arrive, deskFloppy, outsideWindow, phoneOffer, waiting, watchShake } from './arrivals';
import { withSpecials, isSpecialGame } from '../project/special';
import { isSandboxGame } from '../project/files';
import { isOpen } from './calendar';

const GAMES = join(__dirname, '../../../games');
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());

describe('registry', () => {
  const specialDirs = readdirSync(GAMES).filter((id) => {
    const p = join(GAMES, id, 'about.json');
    return existsSync(p) && (JSON.parse(readFileSync(p, 'utf8')) as { series?: string }).series === 'special';
  });

  it('lists every Special game, and only games that exist', () => {
    expect([...specialDirs].sort()).toEqual(SPECIALS.map((s) => s.id).sort());
  });

  it('gives each a window that opens within the next two years', () => {
    for (const s of SPECIALS) expect(SPECIALS.filter((x) => x.id === s.id)).toHaveLength(1);
    for (const s of SPECIALS) {
      let open = false;
      for (let d = 0; d < 731 && !open; d++) open = isOpen(s.window, at(2026, 11, 7 + d));
      expect(open, s.id).toBe(true);
    }
  });

  it('has no Special that is secret, boxed or a Sandbox game', () => {
    for (const id of specialDirs) {
      const about = JSON.parse(readFileSync(join(GAMES, id, 'about.json'), 'utf8')) as Record<string, unknown>;
      expect(about.secret, id).toBeUndefined();
      expect(about.box, id).toBeUndefined();
      expect(about.tinHeart, id).toBeUndefined();
      expect(about.easterEgg, id).toBeUndefined();
      const entry = { id, original: {}, series: 'special', company: about.company as string };
      expect(isSpecialGame(entry)).toBe(true);
      expect(isSandboxGame(entry)).toBe(false);
    }
  });

  it('puts the first three where they belong this November', () => {
    expect(isOpen(specialById('thank-you-parade')!.window, at(2026, 11, 11))).toBe(true);
    expect(isOpen(specialById('lucky-cat')!.window, at(2026, 11, 13))).toBe(true);
    expect(isOpen(specialById('pass-the-pie')!.window, at(2026, 11, 29, 20))).toBe(true);
    expect(isOpen(specialById('pass-the-pie')!.window, at(2026, 11, 30))).toBe(false);
  });
});

describe('listing and keeping', () => {
  const catalog = [
    { id: 'thank-you-parade', original: {}, series: 'special' },
    { id: 'pass-the-pie', original: {}, series: 'special' },
    { id: 'snowbound', original: {} },
  ];

  it('lists a Special only in its window', () => {
    expect(withSpecials(catalog, at(2026, 11, 7)).map((g) => g.id)).toEqual(['snowbound']);
    expect(withSpecials(catalog, at(2026, 11, 11)).map((g) => g.id)).toEqual(['thank-you-parade', 'snowbound']);
  });

  it('keeps one played (or opened, copied, picked up) once its window passes', () => {
    keepSpecial('thank-you-parade', 'played', at(2026, 11, 11).getTime());
    keepSpecial('thank-you-parade', 'copied'); // the first way is the one remembered
    expect(keptHow('thank-you-parade')).toBe('played');
    expect(isListed('thank-you-parade', at(2027, 3, 1))).toBe(true);
    expect(isListed('pass-the-pie', at(2027, 3, 1))).toBe(false);
  });

  it('LOCK hides one whatever the date or keeping; UNLOCK shows it; RESET forgets both', () => {
    keepSpecial('pass-the-pie', 'opened');
    forceSpecial('pass-the-pie', 'lock');
    expect(isListed('pass-the-pie', at(2026, 11, 26))).toBe(false);
    forceSpecial('thank-you-parade', 'unlock');
    expect(isListed('thank-you-parade', at(2026, 6, 1))).toBe(true);
    resetSpecial('pass-the-pie');
    expect(keptHow('pass-the-pie')).toBeUndefined();
    expect(isListed('pass-the-pie', at(2026, 6, 1))).toBe(false);
    resetAllSpecials();
    expect(isListed('thank-you-parade', at(2026, 6, 1))).toBe(false);
  });

  it('announces each change, so the catalog is loaded afresh', () => {
    let heard = 0;
    const on = () => heard++;
    window.addEventListener('gm-specials-changed', on);
    keepSpecial('lucky-cat', 'bbs');
    forceSpecial('lucky-cat', 'lock');
    resetSpecial('lucky-cat');
    window.removeEventListener('gm-specials-changed', on);
    expect(heard).toBe(3);
  });

  it('ignores an id that is not a Special', () => {
    keepSpecial('snowbound', 'played');
    expect(keptHow('snowbound')).toBeUndefined();
  });
});

describe('desk arrivals', () => {
  it('leaves the parade floppy on the desk around Veterans Day, once', () => {
    expect(deskFloppy(at(2026, 11, 7))).toBeUndefined();
    expect(deskFloppy(at(2026, 11, 10))?.id).toBe('thank-you-parade');
    expect(arrive('thank-you-parade', 'desk-floppy', at(2026, 11, 10))).toBe(true);
    expect(keptHow('thank-you-parade')).toBe('desk');
    expect(deskFloppy(at(2026, 11, 11))).toBeUndefined();
    expect(arrive('thank-you-parade', 'desk-floppy', at(2026, 11, 11))).toBe(false);
  });

  it('keeps the Friday the 13th file on the BBS three days more', () => {
    expect(waiting('bbs', at(2026, 11, 12)).map((s) => s.id)).toEqual([]);
    expect(waiting('bbs', at(2026, 11, 13)).map((s) => s.id)).toEqual(['lucky-cat']);
    expect(waiting('bbs', at(2026, 11, 16, 22)).map((s) => s.id)).toEqual(['lucky-cat']);
    expect(waiting('bbs', at(2026, 11, 17)).map((s) => s.id)).toEqual([]);
    expect(isListed('lucky-cat', at(2026, 11, 15))).toBe(false); // the Special tab has it on the day only
    expect(arrive('lucky-cat', 'bbs', at(2026, 11, 15))).toBe(true);
    expect(isListed('lucky-cat', at(2026, 12, 25))).toBe(true);
  });

  it('a library-only Special never arrives on the desk; UNLOCK sets one waiting off its date', () => {
    expect(waiting('library', at(2026, 11, 26)).map((s) => s.id)).toEqual(['pass-the-pie']);
    expect(deskFloppy(at(2026, 11, 26))).toBeUndefined();
    forceSpecial('thank-you-parade', 'unlock');
    expect(deskFloppy(at(2026, 6, 1))?.id).toBe('thank-you-parade');
    forceSpecial('thank-you-parade', 'lock');
    expect(deskFloppy(at(2026, 11, 11))).toBeUndefined();
  });

  it('has the watch, window and phone hooks ready, with nothing using them yet', () => {
    for (let d = 0; d < 366; d++) {
      const now = at(2026, 11, 7 + d);
      expect(watchShake(now)).toBeUndefined();
      expect(outsideWindow(now)).toBeUndefined();
      expect(phoneOffer(now)).toBeUndefined();
    }
  });
});
