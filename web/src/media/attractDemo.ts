// An "attract mode" for a game with no demo recording (most often one of your own): a
// made-up recording that walks the hero one way, turns and walks back, jumping and firing
// now and then, in the first level, with the keys the hero's own sequences answer to. It
// is played like a demo but never saved into the game.
import { characterActions, type SeqAction } from '../editor/keymap/keyMap';
import { parseCharacter, type Character } from '../formats/character';
import { ADVTYPE, NOSCENE, parseGame } from '../formats/game';
import { serializeRecording, type RecordedKey } from '../formats/recording';
import type { GameFiles } from '../project/files';

/** Esc: playback leaves the level when the made-up keys run out. */
const ESC = 0x01;

/** The character of the level play starts in (or the first level that has one). */
export function firstLevelCharacter(files: GameFiles, gam: string): Character | undefined {
  try {
    const game = parseGame(files.get(gam)!);
    const start = game.scenes[0]?.links.find((l) => l.toScene !== NOSCENE)?.toScene;
    const order = [start, ...game.scenes.map((_, i) => i)].filter((i): i is number => i !== undefined && game.scenes[i]?.gametype === ADVTYPE);
    for (const i of order) {
      const bytes = files.get(game.scenes[i].files[5] || undefined);
      if (bytes) return parseCharacter(bytes);
    }
  } catch {
    /* not a readable game */
  }
  return undefined;
}

interface Keys {
  left?: number;
  right?: number;
  up?: number;
  down?: number;
  jump?: number;
  fire?: number;
}

/** The keys to walk, jump and fire with: the first usable sequence of each kind. */
export function attractKeys(chr: Character): Keys {
  const keys: Keys = {};
  const inv = new Set(chr.inv);
  const usable = (a: SeqAction) => (a.needsBlock === undefined || inv.has(a.needsBlock)) && (a.uses === undefined || a.uses > 0);
  for (const { scan, action } of characterActions(chr)) {
    if (!scan || !usable(action)) continue;
    const t = action.title.toLowerCase();
    if (action.kind === 'move') {
      for (const d of ['left', 'right', 'up', 'down'] as const) if (t.endsWith(` ${d}`)) keys[d] ??= scan;
    }
    // a plain "Jump" / "Fire" before one that also moves
    else if (action.kind === 'jump' && (keys.jump === undefined || t === 'jump')) keys.jump = scan;
    else if (action.kind === 'fire' && (keys.fire === undefined || t === 'fire')) keys.fire = scan;
  }
  return keys;
}

/**
 * A made-up recording, about `seconds` long: walk right, jump, fire, turn and walk left,
 * and again; a hero who only moves up and down paces that way instead. Undefined when
 * the hero has no keys to walk with.
 */
export function attractRecording(files: GameFiles, gam: string, seconds = 40): Uint8Array | undefined {
  const chr = firstLevelCharacter(files, gam);
  if (!chr) return undefined;
  const k = attractKeys(chr);
  const across = k.left !== undefined && k.right !== undefined;
  const there = across ? k.right : k.down;
  const back = across ? k.left : k.up;
  if (there === undefined || back === undefined) return undefined;
  const out: RecordedKey[] = [];
  let gap = 18; // a second to look at the level first
  const press = (key: number) => (out.push({ delta: gap, key }), (gap = 0));
  const wait = (ticks: number) => (gap += ticks);
  const tap = (key: number | undefined) => {
    if (key === undefined) return;
    press(key);
    wait(3);
    press(key | 0x80);
  };
  const walk = (key: number, ticks: number) => {
    press(key);
    wait(Math.round(ticks * 0.4));
    tap(k.jump);
    wait(Math.round(ticks * 0.3));
    tap(k.fire);
    wait(Math.round(ticks * 0.3));
    press(key | 0x80);
    wait(6);
  };
  const total = seconds * 18.2;
  let ticks = 18;
  for (let leg = 0; ticks < total; leg++) {
    // short first legs, then longer ones, so the hero roams a little further each way
    const len = 30 + Math.min(leg, 3) * 12;
    walk(leg % 2 ? back : there, len);
    ticks += len + 6;
  }
  wait(9);
  press(ESC);
  wait(2);
  press(ESC | 0x80);
  return serializeRecording(out);
}
