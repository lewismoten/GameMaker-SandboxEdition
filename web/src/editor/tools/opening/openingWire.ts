// An opening for a game made here: an intro (openingIntros.ts) and a "<name> PRESENTS" card,
// put first in the start scene's title slide show (a .LST) as files the game owns, so DOS and
// every export play them as they play the game's own pictures.
// A title slot holding one picture is wrapped in a new list; a list gets them at its top.
// Which files are the opening is kept in the companion (editor-only), so it can be taken
// out again exactly: the files go, and a list made for it gives the slot back its picture.
import type { Scene } from '../../../formats/game';
import { parseSlideList, serializeSlideList, type SlideEntry } from '../../../formats/graphicScripts';
import type { GameFiles } from '../../../project/files';
import type { OpeningStyle } from './openingIntros';

/** One card of the opening: its file, and the seconds a picture stays (an animation plays through). */
export interface OpeningCard {
  name: string;
  bytes: Uint8Array;
  pause: number;
}

/** The opening as the companion keeps it, under the game's .gam. */
interface OpeningRecord {
  /** The title list the cards were put in. */
  list: string;
  files: string[];
  /** The list was made for the opening; `wrapped` is the title picture it took in. */
  made: boolean;
  wrapped?: string;
  style: OpeningStyle;
  name: string;
}

const OPENING_SECTION = 'opening';

/** The cards' file names (8.3) and how long a still picture of them stays. */
export const STING_STEM = 'madewith';
export const PRESENTS_STEM = 'presents';
export const STILL_SECONDS = 4;

/** The longest name the card takes, in letters. */
export const NAME_MAX = 32;

/** Typographic marks typed names often carry, which the PC font draws plainly. */
const MARKS = '‘’“”–—…';

/** What is wrong with a name for the card, or undefined when it can be drawn ('' is fine: no card). */
export function nameProblem(name: string): string | undefined {
  const t = name.trim();
  if (t.length > NAME_MAX) return `Keep it to ${NAME_MAX} letters or fewer (this is ${t.length}).`;
  const odd = [...t].find((c) => !(c >= ' ' && c <= '~') && !MARKS.includes(c));
  if (odd) return `The PC font has no “${odd}”: use plain letters, digits and punctuation.`;
  return undefined;
}

/** What wiring reads and writes: a Project fits. */
export interface OpeningProject {
  files: GameFiles;
  gam: string;
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
  freeName(base: string, ext: string): string;
}

const ext = (n: string) => (/\.([^.]*)$/.exec(n)?.[1] ?? '').toLowerCase();
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** How long PLAYGAME shows a title picture of this kind (ShowGraphic's defaults), kept when it moves into a list. */
function titlePause(name: string): number | undefined {
  return { gif: 15, bkd: 20, fli: 0, txt: 90 }[ext(name)];
}

/** The opening the game has, from the companion, else recognized by its file names at the top of the title list. */
export function openingOf(p: OpeningProject, start: Scene): OpeningRecord | undefined {
  const rec = p.extras<OpeningRecord | undefined>(p.gam, OPENING_SECTION, undefined);
  if (rec && start.files[0] && same(rec.list, start.files[0])) return rec;
  const list = start.files[0];
  const bytes = list && ext(list) === 'lst' ? p.files.get(list) : undefined;
  if (!bytes) return undefined;
  const ours = parseSlideList(bytes)
    .map((e) => e.name)
    .filter((n) => n.startsWith(STING_STEM) || n.startsWith(PRESENTS_STEM));
  if (!ours.length) return undefined;
  const style: OpeningStyle = ours.some((n) => n.startsWith(STING_STEM)) ? (ours.some((n) => ext(n) === 'gif') ? 'still' : 'animation') : 'none';
  return { list, files: ours, made: false, style, name: '' };
}

/** Puts the cards first in the start scene's title list (making the list when the slot holds no list). */
export function addOpening(p: OpeningProject, start: Scene, cards: OpeningCard[], style: OpeningStyle, name: string): void {
  if (!cards.length) return;
  const named = cards.map((c) => {
    const n = p.freeName(c.name.replace(/\.[^.]*$/, ''), ext(c.name));
    p.files.set(n, c.bytes);
    return { ...c, name: n };
  });
  const entries: SlideEntry[] = named.map((c) => ({ name: c.name, pause: c.pause }));
  const title = start.files[0] ?? '';
  const existing = title && ext(title) === 'lst' ? p.files.get(title) : undefined;
  let rec: OpeningRecord;
  if (existing) {
    p.files.set(title, serializeSlideList([...entries, ...parseSlideList(existing)]));
    rec = { list: title, files: named.map((c) => c.name), made: false, style, name };
  } else {
    const list = p.freeName('title', 'lst');
    const wrapped = title ? [{ name: title.toLowerCase(), pause: titlePause(title) }] : [];
    p.files.set(list, serializeSlideList([...entries, ...wrapped]));
    start.files[0] = list;
    rec = { list, files: named.map((c) => c.name), made: true, wrapped: title || undefined, style, name };
  }
  p.setExtras(p.gam, OPENING_SECTION, rec);
}

/** Every file a scene slot or a slide list names, but the lists given. */
function namedElsewhere(p: OpeningProject, scenes: Scene[], skipList: string): Set<string> {
  const out = new Set<string>();
  for (const s of scenes) for (const f of s.files) if (f) out.add(f.toLowerCase());
  for (const l of p.files.byExtension('lst')) {
    if (same(l, skipList)) continue;
    for (const e of parseSlideList(p.files.get(l)!)) out.add(e.name);
  }
  return out;
}

/** Takes the opening out of the title list and deletes its files (any used elsewhere stay). Returns whether there was one. */
export function removeOpening(p: OpeningProject, start: Scene, scenes: Scene[] = [start]): boolean {
  const rec = openingOf(p, start);
  if (!rec) return false;
  const listBytes = p.files.get(rec.list);
  const left = listBytes ? parseSlideList(listBytes).filter((e) => !rec.files.some((f) => same(f, e.name))) : [];
  const unwrap = rec.made && (!left.length || (left.length === 1 && !!rec.wrapped && same(left[0].name, rec.wrapped)));
  if (unwrap) {
    start.files[0] = rec.wrapped ?? '';
    p.files.delete(rec.list);
  } else if (listBytes) p.files.set(rec.list, serializeSlideList(left));
  const used = namedElsewhere(p, scenes, unwrap ? rec.list : '');
  for (const f of rec.files) if (!used.has(f.toLowerCase())) p.files.delete(f);
  p.setExtras(p.gam, OPENING_SECTION, undefined);
  return true;
}
