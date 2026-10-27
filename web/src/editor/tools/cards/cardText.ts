// The words of the instruction card and the level card, with no DOM: the keys from the game's own
// characters (keymap/keyMap.ts), the goal, dangers and items the designer writes, wrapped to the
// 30 letters a text-screen line holds safely (Display_File reads 31, and a line of exactly 31
// leaves a blank one after it), in pages of 16 lines.
import { textBytes } from '../../../formats/binary';
import { ADVTYPE, NOSCENE, type Game } from '../../../formats/game';
import type { GameFiles } from '../../../project/files';
import { gameKeyMap } from '../../keymap/keyMap';

/** Letters a card's line holds, and lines a page. */
export const CARD_WIDTH = 30;
export const CARD_LINES = 16;

/** Words wrapped to `width`, a word longer than the line cut. Blank lines are kept. */
export function wrapCard(text: string, width = CARD_WIDTH): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r\n/g, '\n').split('\n')) {
    let line = '';
    for (let word of para.trim().split(/\s+/).filter(Boolean)) {
      while (word.length > width) {
        if (line) out.push(line);
        out.push(word.slice(0, width));
        word = word.slice(width);
        line = '';
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

const ARROW_NAME: Record<string, string> = { 'Up / Pad 8': 'Up', 'Down / Pad 2': 'Down', 'Left / Pad 4': 'Left', 'Right / Pad 6': 'Right' };

/** One line per key the game's heroes use ("Space: fire", "Left/Right: move"), from their characters. */
export function keyLines(files: GameFiles): string[] {
  const km = gameKeyMap(files);
  const said = new Map<string, string[]>();
  for (const k of km.keys) {
    const does = [...new Set(k.uses.filter((u) => u.action.kind !== 'nothing' && u.action.kind !== 'builtin').map((u) => u.action.title.toLowerCase()))];
    if (!does.length) continue;
    const name = ARROW_NAME[k.name] ?? k.name;
    // "move left" and "move right" on Left and Right read as one line
    const plain = does.map((d) => d.replace(/^(move|push|jump|fire, moving) (left|right|up|down)$/, '$1'));
    const key = plain.join(' / ');
    said.set(key, [...(said.get(key) ?? []), name]);
  }
  return [...said].map(([does, keys]) => {
    const pair = keys.length > 1 && keys.every((k) => ['Left', 'Right', 'Up', 'Down'].includes(k));
    return pair ? `${keys.join('/')}: ${does}` : keys.map((k) => `${k}: ${does}`).join('\n');
  });
}

interface InstructionCard {
  title: string;
  goal: string;
  keys: string;
  dangers: string;
  items: string;
}

/** The instruction pages: the goal first, then the keys, what to watch for, the items, and PLAYGAME's own keys. */
export function instructionLines(c: InstructionCard): string[] {
  const block = (head: string, body: string) => (body.trim() ? ['', head, ...wrapCard(body)] : []);
  const lines = [
    ...wrapCard(c.title.trim().toUpperCase() || 'HOW TO PLAY'),
    ...block('YOUR GOAL', c.goal),
    ...block('KEYS', c.keys),
    ...block('WATCH OUT FOR', c.dangers),
    ...block('ITEMS', c.items),
    '',
    'F1 help      F2 status',
    'F5 save      F6 load',
    'Esc leaves the level',
  ];
  // no page starts with a blank line
  const out: string[] = [];
  for (const l of lines) if (l || out.length % CARD_LINES) out.push(l);
  return out;
}

interface LevelCard {
  name: string;
  number: number;
  total: number;
  goal: string;
  hint: string;
}

/** A level card: its name, "Level 3 of 10", the goal and a hint (it shows again after every death). */
export function levelCardLines(c: LevelCard): string[] {
  const lines = [...wrapCard(c.name.trim().toUpperCase())];
  if (c.number > 0) lines.push(c.total >= c.number ? `Level ${c.number} of ${c.total}` : `Level ${c.number}`);
  if (c.goal.trim()) lines.push('', ...wrapCard(c.goal));
  if (c.hint.trim()) lines.push('', ...wrapCard(`Hint: ${c.hint.trim()}`));
  return lines.slice(0, CARD_LINES);
}

/** Pages a list of lines takes. */
export const pagesOf = (lines: string[]) => Math.max(1, Math.ceil(lines.length / CARD_LINES));

/** The lines as a DOS text file (CR LF ends). */
export const cardFile = (lines: string[]) => textBytes(lines.join('\r\n') + '\r\n');

/**
 * The level scenes in the order play meets them (from the start link, following links, each
 * once), for "level 3 of 10". Scenes no link reaches come last, in file order.
 */
export function playOrder(game: Game): number[] {
  const levels = (n: number) => game.scenes[n]?.gametype === ADVTYPE && !!game.scenes[n].files[1];
  const seen = new Set<number>();
  const queue = game.scenes[0]?.links.map((l) => l.toScene).filter((n) => n !== NOSCENE) ?? [];
  const out: number[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    if (seen.has(n) || !game.scenes[n]) continue;
    seen.add(n);
    if (n > 1 && levels(n)) out.push(n);
    for (const l of game.scenes[n].links) if (l.toScene !== NOSCENE && !seen.has(l.toScene)) queue.push(l.toScene);
  }
  game.scenes.forEach((_, n) => n > 1 && levels(n) && !seen.has(n) && out.push(n));
  return out;
}
