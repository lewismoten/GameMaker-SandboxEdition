// "Generate…": scenes made from a game's own files, in the style of the new games' cartoons
// (games/kit/reel.ts and the cast and intro reels): each picture fades in from black and out
// again, outlined 8x8 lettering, sprites drawn big with their pixels kept square.
//   Intro: the title over the first level, as the player arrives there, with the hero
//          walking across.
//   Cast:  each hero and the monsters the levels place, in turn, close up, with a name card
//          (the .chr's name, the monster's name kept in the companion, else "MONSTER 3").
//   Story: the game's story text, a page at a time, typed over its levels' pictures.
// Each gives an ordinary scene, so everything it made can be changed afterwards.
import { BLEN } from '../../../../formats/blocks';
import { parseMap } from '../../../../formats/map';
import { parseMonsters } from '../../../../formats/monster';
import { textLines } from '../../../../formats/graphicScripts';
import { matchColor, type Palette } from '../../../../formats/palette';
import { firstLevels } from '../../../../gfx/levelPicture';
import { splitTitle } from '../../../../project/gameTitle';
import { SCENE_H, SCENE_W, emptyScene, newId, textItem, type ActorItem, type Background, type Scene, type TextItem } from './sceneModel';
import { fitText, linesOf, textSize, wrapText } from './sceneText';
import { backgroundOf, gamePalette, type SceneSource } from './sceneAssets';

export type Generator = 'intro' | 'cast' | 'story';

/** What a generator may read beyond the files: the game's name and the editor-only extras. */
export interface GenerateSource extends SceneSource {
  name?: string;
  extras?<T>(file: string, section: string, fallback: T): T;
}

/** Where monster names are kept in the companion, under the .mon: an array by monster number. */
export const MONSTER_NAMES = 'names';

const COLS = SCENE_W / BLEN;
const ROWS = SCENE_H / BLEN;

/** Light, dark and gold in a palette, for lettering. */
function inks(pal: Palette): { light: number; dark: number; gold: number } {
  return { light: matchColor(pal, 63, 63, 63), dark: matchColor(pal, 0, 0, 0), gold: matchColor(pal, 63, 52, 8) };
}

interface Level {
  scene: number;
  files: string[];
  at: { x: number; y: number };
}

function levels(src: SceneSource): Level[] {
  const game = src.game();
  return [...firstLevels(game, 64)].map(([scene, at]) => ({ scene, files: game.scenes[scene].files, at }));
}

/** The map window that shows the block the hero arrives on, kept on the map. */
function mapView(l: Level, start = 0): Background {
  const x = Math.max(0, Math.min(100 - COLS, l.at.x - Math.floor(COLS / 2)));
  const y = Math.max(0, Math.min(100 - ROWS, l.at.y - Math.floor(ROWS / 2)));
  return { start, kind: 'map', map: l.files[1], x, y };
}

/** The game's title, as the title screen's scene names it. */
function titleOf(src: GenerateSource): string {
  const t = src.game().scenes[0]?.desc?.trim();
  return (t || src.name || 'MY GAME').toUpperCase();
}

/** A text fitted inside the frame. */
const fitted = (text: string, over: Partial<TextItem>): TextItem => fitText(textItem(text, over));

/** A character from a level: its .chr and .cbl, walking. */
function hero(l: Level, over: Partial<ActorItem>): ActorItem | undefined {
  const [chr, cbl] = [l.files[5], l.files[6]];
  if (!chr || !cbl) return undefined;
  return {
    id: newId(),
    kind: 'actor',
    start: 0,
    end: 60,
    source: { type: 'chr', chr, cbl, seq: -1 },
    path: [{ f: 0, x: 0, y: 0 }],
    scale: 1,
    faces: 'right',
    mirror: true,
    ...over,
  };
}

function intro(src: GenerateSource): Scene {
  const s = emptyScene();
  s.frames = 110;
  s.fadeIn = 10;
  s.fadeOut = 10;
  const first = levels(src).find((l) => l.files[1]);
  if (first) s.backgrounds = [mapView(first)];
  const pal = backgroundOf(s.backgrounds[0], src).palette;
  const ink = inks(pal);
  const [main, sub] = splitTitle(titleOf(src));
  const title = fitted(main, { start: 0, end: s.frames, y: 24, scale: 3, color: ink.gold, outline: ink.dark, motion: 'slide-down', rate: 18 });
  const texts: TextItem[] = [title];
  if (sub)
    texts.push(
      fitted(sub, { start: 14, end: s.frames, y: title.y + textSize(title).h + 6, scale: 2, color: ink.light, outline: ink.dark, motion: 'type', rate: 2 }),
    );
  texts.push(fitted('PRESS A KEY', { start: 60, end: s.frames, y: 176, scale: 1, color: ink.light, outline: ink.dark, motion: 'type', rate: 1 }));
  s.tracks.push({ name: 'Title', items: texts });
  if (first && s.backgrounds[0].kind === 'map') {
    const bg = s.backgrounds[0];
    // as the level shows the hero arriving: the top block on the arrival row
    const y = (first.at.y - bg.y) * BLEN;
    const walker = hero(first, {
      end: s.frames,
      path: [
        { f: 0, x: -BLEN },
        { f: s.frames - 1, x: SCENE_W },
      ].map((k) => ({ ...k, y })),
    });
    if (walker) s.tracks.push({ name: 'Hero', items: [walker] });
  }
  return s;
}

/** Monster names kept in the companion (`MONSTER_NAMES`), if any. */
function monsterName(src: GenerateSource, mon: string, i: number): string {
  const names = src.extras?.<unknown>(mon, MONSTER_NAMES, undefined);
  const n = Array.isArray(names) && typeof names[i] === 'string' ? names[i].trim() : '';
  return (n || `MONSTER ${i}`).toUpperCase();
}

const stem = (file: string) => file.replace(/\.[^.]*$/, '').toUpperCase();

function cast(src: GenerateSource, max = 10): Scene {
  const s = emptyScene();
  s.fadeIn = 4;
  s.fadeOut = 4;
  const pal = gamePalette(src);
  const ink = inks(pal);
  s.backgrounds = [{ start: 0, kind: 'color', palette: '', color: ink.dark }];
  const cards: { actor: ActorItem; name: string }[] = [];
  const seen = new Set<string>();
  const CARD = 40;
  for (const l of levels(src)) {
    const chr = hero(l, { scale: 3, path: [{ f: 0, x: SCENE_W / 2 - 30, y: 26 }] });
    if (chr && chr.source.type === 'chr' && !seen.has(chr.source.chr)) {
      seen.add(chr.source.chr);
      cards.push({ actor: chr, name: stem(chr.source.chr) });
    }
    const [mapF, monF, mblF] = [l.files[1], l.files[3], l.files[4]];
    const mapB = mapF ? src.files.get(mapF) : undefined;
    const monB = monF ? src.files.get(monF) : undefined;
    if (!mapB || !monB || !mblF) continue;
    try {
      const mons = parseMonsters(monB);
      for (const placed of parseMap(mapB).monsters) {
        const i = placed.monnum;
        const key = `${monF}#${i}`;
        if (i >= mons.length || seen.has(key) || !(mons[i].pic[0][0] >= 0 && mons[i].pic[0][0] < 100)) continue;
        seen.add(key);
        cards.push({
          actor: {
            id: newId(),
            kind: 'actor',
            start: 0,
            end: 1,
            source: { type: 'mon', mon: monF, mbl: mblF, index: i },
            path: [{ f: 0, x: SCENE_W / 2 - 40, y: 50 }],
            scale: 4,
            faces: 'right',
            mirror: true,
          },
          name: monsterName(src, monF, i),
        });
      }
    } catch {
      /* a level that cannot be read adds no one */
    }
  }
  const shown = cards.slice(0, max);
  const opening = 30;
  s.frames = opening + Math.max(1, shown.length) * CARD;
  const actors: ActorItem[] = [];
  const names: TextItem[] = [fitted('STARRING', { start: 0, end: opening, y: 84, scale: 3, color: ink.gold, outline: -1, motion: 'type', rate: 2 })];
  shown.forEach((c, k) => {
    const start = opening + k * CARD;
    actors.push({ ...c.actor, start, end: start + CARD });
    names.push(fitted(c.name, { start: start + 4, end: start + CARD, y: 162, scale: 2, color: ink.light, outline: -1, motion: 'type', rate: 2 }));
  });
  if (!shown.length) names.push(fitted('NO ONE YET', { start: opening, end: s.frames, y: 90, scale: 2, color: ink.light, outline: -1 }));
  // a picture change between cards fades each of them in and out
  s.backgrounds = [
    { start: 0, kind: 'color', palette: '', color: ink.dark },
    ...shown.map((_, k): Background => ({ start: opening + k * CARD, kind: 'color', palette: '', color: ink.dark })),
  ];
  s.tracks.push({ name: 'Cast', items: actors }, { name: 'Names', items: names });
  return s;
}

/** The story's text: the title screen's storyline .txt, else a .txt named like a story, else none. */
export function storyText(src: SceneSource): string | undefined {
  const slot = src.game().scenes[0]?.files[4];
  const txts = src.files.byExtension('txt');
  const name = (slot && slot.toLowerCase().endsWith('.txt') && slot) || txts.find((t) => /stor|intro|tale/i.test(t));
  const bytes = name ? src.files.get(name) : undefined;
  if (!bytes) return undefined;
  const text = textLines(bytes)
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
  return text || undefined;
}

function story(src: GenerateSource): Scene {
  const s = emptyScene();
  // 23 frames a second: letters typed at a reading pace
  s.speed = 3;
  s.fadeIn = 6;
  s.fadeOut = 6;
  const text = (storyText(src) ?? `${titleOf(src)}\n\nTHE STORY STARTS HERE. WRITE IT IN THIS TEXT.`).toUpperCase();
  // pages of up to 6 lines, 36 letters wide (1x, outlined) in a band at the bottom
  // the .txt's lines are its 31-letter screen lines: paragraphs are what blank lines part
  const paragraphs = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, ' '));
  const lines = linesOf(wrapText(paragraphs.join('\n\n'), 36));
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += 6)
    pages.push(
      lines
        .slice(i, i + 6)
        .join('\n')
        .trim(),
    );
  const lvls = levels(src).filter((l) => l.files[1]);
  const items: TextItem[] = [];
  s.backgrounds = [];
  let f = 0;
  pages
    .filter((p) => p)
    .forEach((page, k) => {
      const letters = page.replace(/\n/g, '').length;
      const len = Math.min(400, letters + 40);
      const lvl = lvls.length ? lvls[k % lvls.length] : undefined;
      const back: Background = lvl ? mapView(lvl, f) : { start: f, kind: 'color', palette: '', color: 0 };
      s.backgrounds.push(back);
      const ink = inks(backgroundOf(back, src).palette);
      items.push(
        fitted(page, {
          start: f,
          end: f + len,
          x: 160,
          y: 196 - textSize(textItem(page, { scale: 1, outline: 0 })).h,
          scale: 1,
          color: ink.light,
          outline: ink.dark,
          motion: 'type',
          rate: 1,
        }),
      );
      f += len;
    });
  s.frames = Math.max(1, f);
  if (!s.backgrounds.length) s.backgrounds = [{ start: 0, kind: 'color', palette: '', color: 0 }];
  s.tracks.push({ name: 'Story', items });
  return s;
}

export function generateScene(kind: Generator, src: GenerateSource): Scene {
  return kind === 'intro' ? intro(src) : kind === 'cast' ? cast(src) : story(src);
}
