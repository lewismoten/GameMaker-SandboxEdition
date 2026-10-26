// The level check's "characters DOS can't draw". Every word a game shows in play goes through
// GWrite, whose GPutChar takes the character as a signed char and indexes the BIOS 8x8 ROM font
// (code/GM/GRAPHC.C; XFERPLAY's `cbw`), which holds only characters 0-127: a byte 128-255 draws
// eight bytes from before the font, scribbles on a real VGA card. The words it draws from the
// game's own files are text pages (a .txt any scene slot shows, also inside a slide list), the
// game's name on the menu (the start scene's description) and the names in a shipped .his.
// games/kit/textfitCheck.ts runs the same scan over a built disk.
import { ADVTYPE, type Game } from '../../../formats/game';
import { parseSlideList, textLines } from '../../../formats/graphicScripts';
import { parseHighScores } from '../../../formats/highscore';
import { fromCp437 } from '../../../retro/text/cp437';
import type { Finding } from '../findings';
import type { FileSource } from '../sim';

/** A line of the game's own text that GWrite draws. */
interface GWriteLine {
  /** The file it comes from (the .gam for the menu's name). */
  file: string;
  scene?: number;
  text: string;
}

// The slots ShowGraphic shows: the front end's pictures, the ending's, a level's cards.
const FRONT = [0, 2, 4, 6, 7, 8, 9, 10];
const END = [0, 2];
const LEVEL = [9, 10];

function shownTexts(files: FileSource, name: string, scene: number, out: GWriteLine[], seen: Set<string>, depth = 0): void {
  const key = name.toLowerCase();
  if (seen.has(key) || depth > 3) return;
  seen.add(key);
  const bytes = files.get(name);
  if (!bytes) return;
  if (key.endsWith('.txt')) for (const text of textLines(bytes)) out.push({ file: name, scene, text });
  else if (key.endsWith('.lst')) for (const e of parseSlideList(bytes)) shownTexts(files, e.name, scene, out, seen, depth + 1);
}

/** Every line of the game's own text that the player draws with GWrite. */
export function gwriteLines(game: Game, files: FileSource, gam?: string): GWriteLine[] {
  const out: GWriteLine[] = [];
  const seen = new Set<string>();
  game.scenes.forEach((sc, n) => {
    const slots = n === 0 ? FRONT : n === 1 ? END : sc.gametype === ADVTYPE ? LEVEL : [];
    for (const slot of slots) if (sc.files[slot]) shownTexts(files, sc.files[slot], n, out, seen);
  });
  if (gam && game.scenes[0]) out.push({ file: gam, scene: 0, text: game.scenes[0].desc });
  const his = gam && `${gam.replace(/\.[^.]*$/, '')}.his`;
  const scores = his && files.get(his);
  if (his && scores && scores.length >= 340) for (const s of parseHighScores(scores)) out.push({ file: his, text: s.name });
  return out;
}

// The files are read with TextDecoder('latin1'), which is windows-1252: bytes 0x80-0x9F come
// back as other code points (0x82 as U+201A). Each decoded character's byte, for those.
const decoded = new TextDecoder('latin1');
const BYTE = new Map<string, number>();
for (let b = 0x80; b < 0x100; b++) BYTE.set(decoded.decode(Uint8Array.of(b)), b);

/** The byte (CP437 code) a character read from a game file stands for. */
const byteOf = (ch: string): number => BYTE.get(ch) ?? ch.charCodeAt(0);

/** The characters 128-255 in a line, as their bytes, each once. */
export function highChars(text: string): number[] {
  return [...new Set([...text].map(byteOf).filter((b) => b >= 0x80))];
}

/** ASCII for symbols and box lines that have no letter under an accent. */
const STAND_IN: Record<string, string> = {
  æ: 'ae',
  Æ: 'AE',
  ß: 'ss',
  '¢': 'c',
  '£': 'L',
  '¥': 'Y',
  '₧': 'Pts',
  ƒ: 'f',
  ª: 'a',
  º: 'o',
  '¿': '?',
  '¡': '!',
  '«': '<<',
  '»': '>>',
  '½': '1/2',
  '¼': '1/4',
  '⌐': '-',
  '¬': '-',
  α: 'a',
  Γ: 'G',
  π: 'pi',
  Σ: 'S',
  σ: 's',
  µ: 'u',
  τ: 't',
  Φ: 'F',
  Θ: 'O',
  Ω: 'O',
  δ: 'd',
  '∞': 'oo',
  φ: 'f',
  ε: 'e',
  '∩': 'n',
  '≡': '=',
  '±': '+/-',
  '≥': '>=',
  '≤': '<=',
  '⌠': '|',
  '⌡': '|',
  '÷': '/',
  '≈': '~',
  '°': 'o',
  '∙': '.',
  '·': '.',
  '√': 'v',
  ⁿ: 'n',
  '²': '2',
  '■': '*',
  [String.fromCharCode(0xa0)]: ' ',
};

/** What a DOS writer would have typed for CP437 code `c` (128-255) in plain ASCII. */
export function asciiFor(c: number): string {
  const u = fromCp437(String.fromCharCode(c));
  if (STAND_IN[u] !== undefined) return STAND_IN[u];
  const plain = u.normalize('NFD').replace(/\p{M}/gu, '');
  if (/^[\x20-\x7e]+$/.test(plain)) return plain;
  if (/[░▒▓█▄▌▐▀]/.test(u)) return '#';
  if (u === '─') return '-';
  if (u === '═') return '=';
  if (u === '│' || u === '║') return '|';
  if (u.charCodeAt(0) >= 0x2500 && u.charCodeAt(0) <= 0x257f) return '+';
  return '?';
}

/** `bytes` with every character 128-255 written in ASCII. */
export function asciiBytes(bytes: Uint8Array): Uint8Array {
  const out: number[] = [];
  for (const b of bytes) {
    if (b < 0x80) out.push(b);
    else for (const ch of asciiFor(b)) out.push(ch.charCodeAt(0));
  }
  return Uint8Array.from(out);
}

/** A string read from a game file with every character 128-255 written in ASCII. */
export function asciiText(text: string): string {
  return [...text].map((ch) => (byteOf(ch) >= 0x80 ? asciiFor(byteOf(ch)) : ch)).join('');
}

/** A line read from a game file as a PC showed it. */
const shown = (text: string) => fromCp437(String.fromCharCode(...[...text].map(byteOf)));

/** One finding per file whose in-game text has characters DOS draws as scribbles. */
export function dosChars(game: Game, files: FileSource, gam?: string): Finding[] {
  const byFile = new Map<string, { scene?: number; line: string; chars: Set<number> }>();
  for (const l of gwriteLines(game, files, gam)) {
    const chars = highChars(l.text);
    if (!chars.length) continue;
    const f = byFile.get(l.file) ?? { scene: l.scene, line: l.text.trim(), chars: new Set<number>() };
    for (const c of chars) f.chars.add(c);
    byFile.set(l.file, f);
  }
  return [...byFile].map(([file, f]) => {
    const what = /\.gam$/i.test(file) ? 'The game’s name on the menu' : /\.his$/i.test(file) ? `The high scores in ${file}` : file;
    const chars = [...f.chars];
    return {
      check: 'dos-chars',
      severity: 'warning',
      title: `${what} ${/\.his$/i.test(file) ? 'use' : 'uses'} characters DOS can’t draw in the game`,
      detail: `“${shown(f.line)}” has ${chars.map((c) => fromCp437(String.fromCharCode(c))).join(' ')}. In DOS the player draws each letter from the PC’s built-in font, which stops at character 127, so these come out as scribbles. Write them as ${chars.map((c) => `“${asciiFor(c)}”`).join(', ')}.`,
      where: { scene: f.scene, file },
      fix: 'dos-ascii',
    };
  });
}
