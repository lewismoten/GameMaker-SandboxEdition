// The level check's key-reach check: with the right hand on the arrows (as nearly every
// Game-Maker game on the CD plays), an action belongs on a key the left hand reaches without
// moving: Space, Z X C V B, A S D F G, Q W E R T, 1 to 5, Tab, Shift, Ctrl, Alt. A key on the
// right half of the letters or the number row (P, H, K, L, 6 to 0…) makes a hand leave its
// place in the middle of play. A game that moves only on W A S D frees the right hand, so it
// is not checked.
import { SCAN, scanName } from '../../../input/scancodes';
import type { GameFiles } from '../../../project/files';
import { gameKeyMap } from '../../keymap/keyMap';
import type { Finding } from '../findings';

/** Keys only the right hand reaches, and it has to leave the arrows to do it. */
const FAR = new Set(
  [
    'KeyY',
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    'Semicolon',
    'Quote',
    'BracketLeft',
    'BracketRight',
    'Backslash',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Digit0',
    'Minus',
    'Equal',
    'Backspace',
  ].map((c) => SCAN[c]),
);

const ARROWS = [SCAN.ArrowUp, SCAN.ArrowDown, SCAN.ArrowLeft, SCAN.ArrowRight];
const MOVES = new Set(['move', 'jump']);

export function keyReach(files: GameFiles): Finding[] {
  const km = gameKeyMap(files);
  const onArrows = km.keys.some((k) => ARROWS.includes(k.scan) && k.uses.some((u) => MOVES.has(u.action.kind)));
  if (!onArrows) return [];
  const out: Finding[] = [];
  for (const k of km.keys) {
    if (!FAR.has(k.scan) || k.uses.every((u) => u.action.kind === 'nothing' || u.action.kind === 'builtin')) continue;
    const does = [...new Set(k.uses.map((u) => u.action.title.toLowerCase()))].join(', ');
    out.push({
      check: 'reach',
      severity: 'warning',
      title: `${scanName(k.scan)} (${does}) makes the right hand leave the arrows`,
      detail:
        'Put actions where the left hand rests while the right steers: Space first, then Z, X, C, V or B, then A to G, Q to T or 1 to 5 if W A S D don’t move the hero.',
      where: { file: k.uses[0]?.chrs[0] },
    });
  }
  return out;
}
