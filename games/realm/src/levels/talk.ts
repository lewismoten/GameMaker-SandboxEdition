// Talking to people. Walking into someone takes a link to a scene of its own whose intro is
// the conversation (their portrait, then their words); that scene loads PASS.MAP under an
// all-black palette and starts Pip on a link straight back to where he was standing, so the
// talk just ends and the town comes back. The block Pip starts on in PASS.MAP is touched on
// that one tick, so a conversation can also give something: the King's writ, a found dog, a
// reward, kazoo lessons. (Final Curtain's answers and Snowbound's pines work the same way.)
import { newMap, serializeMap } from '../../../../web/src/formats/map';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { serializeBlocks } from '../../../../web/src/formats/blocks';
import { serializePalette } from '../../../../web/src/formats/palette';
import { BlockBook, type Attrs } from '../blocks/book';
import { Canvas } from '../art/rgb';
import { C, SEQ } from '../ids';
import { PEOPLE, person, animalPics } from '../sprites/people';
import { heroPics } from '../sprites/hero';
import { talkPage, THEMES, INK } from '../screens/talk';
import type { SceneSpec } from '../game';
import type { AreaFile } from '../build/world';
import { Pal } from '../art/pal';
import { paintEgg } from '../art/egg';

const COLS = 30;
const LINES = 16;

/** Word-wraps paragraphs (blank-line separated) to 30 columns, 16 lines a page, keeping short paragraphs whole. */
export function pages(text: string): string {
  const out: string[] = [];
  const paras = text.trim().split(/\n\s*\n/);
  for (const para of paras) {
    const lines: string[] = [];
    for (const raw of para.split('\n')) {
      let line = '';
      for (const word of raw.trim().split(/\s+/).filter(Boolean)) {
        if (word.length > COLS) throw new Error(`Word over ${COLS} columns: ${word}`);
        if (line && line.length + 1 + word.length > COLS) {
          lines.push(line);
          line = word;
        } else line = line ? `${line} ${word}` : word;
      }
      lines.push(line);
    }
    const room = LINES - (out.length % LINES);
    if (out.length % LINES !== 0 && lines.length + 1 > room && lines.length <= LINES) while (out.length % LINES) out.push('');
    else if (out.length % LINES !== 0) out.push('');
    out.push(...lines);
  }
  while (out.length % LINES) out.push('');
  for (const l of out) if (l.length > COLS) throw new Error(`Line over ${COLS}: ${l}`);
  return out.join('\n');
}

/** What the start block of a talk gives: the conversation's reward. */
export const GIFTS: Record<string, Attrs> = {
  none: {},
  writ: { effect: C.writ, eamt: 1, score: 100 },
  dog: { effect: C.dogs, eamt: 1, score: 250 },
  chick: { effect: C.chick, eamt: 1, score: 250 },
  kennel: { effect: C.money, eamt: 60, score: 500 },
  library: { effect: C.money, eamt: 100, score: 1000 },
  kazoo: { effect: SEQ.kazoo, eamt: 25, score: 500 },
  heal: { hp: 100 },
  piece: { score: 2500, hp: 100 },
  lore: { score: 1301 },
};
const GIFT_NAMES = Object.keys(GIFTS);
export const giftCell = (gift: string): [number, number] => [10 + GIFT_NAMES.indexOf(gift) * 2, 10];

export interface Talk {
  /** Scene and file name (8 letters at most). */
  id: string;
  /** The portrait: a PEOPLE key, 'pip', or an animal ('teddy', 'gwinn', 'chick'). */
  who: string;
  name: string;
  theme: keyof typeof THEMES;
  place: string;
  text: string;
  gift?: keyof typeof GIFTS;
  /** Shown before the words: a picture of its own (a .GIF name) instead of the portrait page. */
  picture?: string;
  /** Pictures shown first, each waiting for a key. */
  before?: string[];
}

const animals = animalPics();
const hero = heroPics();
export function portrait(who: string): Canvas {
  if (who === 'pip') return hero.get('down0')!;
  if (who === 'egg') {
    const cv = new Canvas(20, 20);
    paintEgg(cv, 10, 10, 18);
    return cv;
  }
  if (PEOPLE[who]) return person(PEOPLE[who])[0];
  const a = animals.get(`${who}0`);
  if (!a) throw new Error(`No portrait for ${who}`);
  return a;
}

/** Files for a talk: its picture, its words and the slide show that plays them. */
export function talkFiles(t: Talk): AreaFile[] {
  if (t.id.length > 8) throw new Error(`Talk id ${t.id} longer than 8`);
  const files: AreaFile[] = [];
  const pic = t.picture ?? `${t.id}.gif`;
  if (!t.picture) files.push({ name: `${t.id}.gif`, bytes: talkPage(t.name, portrait(t.who), THEMES[t.theme], t.place).gif({ text: INK, more: [200, 30, 30], zero: [200, 30, 30] }) });
  files.push({ name: `${t.id}.txt`, bytes: new TextEncoder().encode(pages(t.text).replace(/\n/g, '\r\n')) });
  files.push({ name: `${t.id}.lst`, bytes: serializeSlideList([...(t.before ?? []).map((name) => ({ name })), { name: pic, pause: 0 }, { name: `${t.id}.txt` }]) });
  return files;
}

/** The talk's scene: PASS.MAP in the dark, one link straight back to `back` in `scene`. */
export function talkScene(t: Talk, scene: string, back: [number, number]): SceneSpec {
  const cell = giftCell(t.gift ?? 'none');
  return {
    id: t.id,
    desc: t.name,
    files: { pal: 'dark.pal', map: 'pass.map', bbl: 'pass.bbl', intro: `${t.id}.lst` },
    links: [{ from: cell, to: scene, at: back }],
    still: true,
  };
}

/** PASS.MAP, PASS.BBL and DARK.PAL: black blocks that give the talks' rewards. */
export function passFiles(): AreaFile[] {
  const book = new BlockBook('pass');
  const black = () => new Canvas(20, 20).shade(() => [0, 0, 0]);
  for (const g of GIFT_NAMES) book.add(g, black(), GIFTS[g]);
  const blocks = book.finish(new Pal(new Uint8Array(768)));
  const map = newMap();
  map.blocks.fill(book.n('none'));
  for (const g of GIFT_NAMES) {
    const [x, y] = giftCell(g);
    map.blocks[y * 100 + x] = book.n(g);
  }
  return [
    { name: 'pass.bbl', bytes: serializeBlocks(blocks) },
    { name: 'pass.map', bytes: serializeMap(map) },
    { name: 'dark.pal', bytes: serializePalette(new Uint8Array(768)) },
  ];
}
