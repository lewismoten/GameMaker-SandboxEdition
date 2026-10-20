// Works out which keys a game uses, and what each does, from its data: the character
// (.chr) of every level scene (sequence keys, joystick bindings, frames that move or fire
// monsters, objects a sequence needs, limited uses) plus PLAYGAME's own function keys.
// Games often describe their keys in their instructions but leave some out; this does not.
import { BACKBL, MONBL, parseBlocks } from '../formats/blocks';
import { DROPSEQ, INF_REPEAT, MAXSEQ, PICKUPSEQ, SEQUENCE_NAMES, frameCount, parseCharacter, type Character, type Sequence } from '../formats/character';
import { ADVTYPE, parseGame } from '../formats/game';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';
import { scanName } from '../input/scancodes';
import type { GameFiles } from '../project/files';

export type ActionKind = 'move' | 'jump' | 'fire' | 'pickup' | 'drop' | 'action' | 'builtin' | 'nothing';

/** What one character sequence does when its key (or joystick) starts it. */
export interface SeqAction {
  seq: number;
  kind: ActionKind;
  /** "Move left", "Jump right", "Fire", "Pick up". */
  title: string;
  /** A word or symbol short enough for a key cap: "←", "Jump", "Fire". */
  short: string;
  /** Plain-language details, one per line. */
  details: string[];
  /** Background block that must be carried for the sequence to work (none when undefined). */
  needsBlock?: number;
  /** Uses at the start when limited. */
  uses?: number;
  /** Monster numbers the sequence fires. */
  fires: number[];
  /** Joystick binding in words ("← Left + button 1"), when it has one. */
  joystick?: string;
}

export interface Level {
  /** Scene number in the .gam file (-1 when the game file has no levels). */
  scene: number;
  name: string;
  chr: string;
  /** The scene's palette, background blocks, monsters and monster blocks, for pictures. */
  pal?: string;
  map?: string;
  bbl?: string;
  mon?: string;
  mbl?: string;
}

/** One way a key behaves, in the levels that share a character. */
export interface KeyUse {
  action: SeqAction;
  /** Character files where the key does this. */
  chrs: string[];
  /** Level names where it does this. */
  levels: string[];
  /** The first of those levels, for drawing objects and monsters in its colors. */
  level: Level;
}

export interface KeyBinding {
  scan: number;
  name: string;
  uses: KeyUse[];
}

export interface GlobalKey {
  scan: number;
  name: string;
  short: string;
  title: string;
}

export interface JoystickUse {
  label: string;
  action: SeqAction;
  levels: string[];
}

export interface Instructions {
  name: string;
  kind: 'text' | 'picture';
  /** .txt contents (text) or the GIF bytes (picture). */
  text?: string;
  gif?: Uint8Array;
}

export interface GameKeyMap {
  title: string;
  levels: Level[];
  keys: KeyBinding[];
  joystick: JoystickUse[];
  global: GlobalKey[];
  /** Characters whose files are missing or unreadable. */
  missing: string[];
  instructions: Instructions[];
}

/** PLAYGAME's own keys during play (code/GM/PLAYGAME.C main loop and FuncKey). */
export const GLOBAL_KEYS: GlobalKey[] = [
  { scan: 1, name: 'Esc', short: 'Quit', title: 'Leave the level (back to the menu)' },
  { scan: 59, name: 'F1', short: 'Help', title: 'Help: the game’s instructions' },
  { scan: 60, name: 'F2', short: 'Status', title: 'Status: inventory, score, money, hit points, lives, time' },
  { scan: 61, name: 'F3', short: 'Music', title: 'Music on / off' },
  { scan: 62, name: 'F4', short: 'Sound', title: 'Sound effects on / off' },
  { scan: 63, name: 'F5', short: 'Save', title: 'Save the game' },
  { scan: 64, name: 'F6', short: 'Load', title: 'Load a saved game' },
  { scan: 66, name: 'F8', short: 'Joy', title: 'Joystick on / off' },
  { scan: 67, name: 'F9', short: 'Joy?', title: 'Joystick setup (a gamepad works as the joystick here)' },
  { scan: 68, name: 'F10', short: 'About', title: 'About Game-Maker' },
];

const JOY_DIR = ['', '↑ Up', '↗ Up-right', '→ Right', '↘ Down-right', '↓ Down', '↙ Down-left', '← Left', '↖ Up-left', 'Any direction'];
const JOY_BUT = ['', ' + button 1', ' + button 2', ' + both buttons', ' with no button'];

const activeFrames = (s: Sequence) => s.frames.slice(0, frameCount(s));
const fires = (s: Sequence) => [
  ...new Set(
    activeFrames(s)
      .filter((f) => f.pic2 === MONBL)
      .map((f) => f.pic1),
  ),
];

/** Compass word and arrow for a movement. Small sideways drift next to a big move is ignored. */
export function direction(x: number, y: number): { word: string; arrow: string } | undefined {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (!ax && !ay) return undefined;
  const h = ax * 3 < ay ? 0 : Math.sign(x);
  const v = ay * 3 < ax ? 0 : Math.sign(y);
  const words: Record<string, [string, string]> = {
    '0,-1': ['up', '↑'],
    '1,-1': ['up-right', '↗'],
    '1,0': ['right', '→'],
    '1,1': ['down-right', '↘'],
    '0,1': ['down', '↓'],
    '-1,1': ['down-left', '↙'],
    '-1,0': ['left', '←'],
    '-1,-1': ['up-left', '↖'],
  };
  const [word, arrow] = words[`${h},${v}`];
  return { word, arrow };
}

const px = (n: number, a: string, b: string) => `${Math.abs(n)} px ${n > 0 ? b : a}`;

/** Describes what sequence `i` of a character does. */
export function describeSequence(chr: Character, i: number, carriesAtStart?: (block: number) => boolean, gravity = false): SeqAction {
  const s = chr.sequences[i];
  const frames = activeFrames(s);
  const fired = fires(s);
  const details: string[] = [];
  let x = 0;
  let y = 0;
  let top = 0;
  for (const f of frames) {
    if (f.pic2 === MONBL) continue;
    x += f.x;
    y += f.y;
    top = Math.min(top, y);
  }
  // Up first, then (mostly) back down: a jump.
  // Where gravity pulls down, moving up is jumping: gravity brings the hero back.
  const jumps = top < 0 && ((y - top >= -top / 2 && frames.length > 1) || gravity);
  const dir = direction(x, jumps ? 0 : y);
  let kind: ActionKind;
  let title: string;
  let short: string;
  if (i === PICKUPSEQ) {
    kind = 'pickup';
    title = 'Pick up';
    short = 'Get';
    details.push('Picks up the object the hero is standing on, if there is room in the inventory.');
  } else if (i === DROPSEQ) {
    kind = 'drop';
    title = 'Drop';
    short = 'Drop';
    details.push('Asks which object from the inventory to put down, then drops it.');
  } else if (i < 5) {
    kind = 'builtin';
    title = `Plays “${SEQUENCE_NAMES[i]}”`;
    short = SEQUENCE_NAMES[i];
  } else if (!frames.length) {
    kind = 'nothing';
    title = 'Does nothing';
    short = '–';
    details.push('Its sequence has no frames.');
  } else if (fired.length) {
    kind = 'fire';
    title = dir && !jumps ? `Fire, moving ${dir.word}` : 'Fire';
    short = 'Fire';
  } else if (jumps) {
    kind = 'jump';
    title = dir ? `Jump ${dir.word}` : 'Jump';
    short = dir ? `Jump${dir.arrow}` : 'Jump';
  } else if (dir) {
    kind = 'move';
    title = `${s.momentum ? 'Push' : 'Move'} ${dir.word}`;
    short = dir.arrow;
  } else {
    kind = 'action';
    title = 'Action (stays in place)';
    short = 'Act';
  }
  if (fired.length) details.push(`Fires monster${fired.length > 1 ? 's' : ''} ${fired.join(', ')}.`);
  if (i >= 5 && frames.length) {
    const moves = [x ? px(x, 'left', 'right') : '', jumps ? `up ${-top} px and back` : y ? px(y, 'up', 'down') : ''].filter(Boolean).join(', ');
    if (moves) details.push(`Moves ${moves} each time it plays${s.momentum ? ', as momentum (the hero keeps drifting)' : ''}.`);
  }
  if (i >= 5) details.push(s.norepeat ? 'Runs once per press.' : 'Repeats while the key is held.');
  if (s.ground) details.push('Can’t be interrupted until it finishes.');
  let needsBlock: number | undefined;
  if (s.bloc !== BACKBL && s.bloc < BACKBL) {
    needsBlock = s.bloc;
    details.push(`Only works while carrying object ${s.bloc}${carriesAtStart?.(s.bloc) ? ' (the hero starts with it)' : ' — find it first'}.`);
  }
  let uses: number | undefined;
  if (i >= 5 && chr.meter[i] !== INF_REPEAT && chr.meter[i] !== undefined) {
    uses = chr.meter[i];
    details.push(
      uses > 0 ? `Limited: ${uses} use${uses === 1 ? '' : 's'} at the start; some blocks can give more.` : 'Can’t be used until a block gives it uses.',
    );
  }
  let joystick: string | undefined;
  if (i >= 3 && s.jstkMov > 0 && s.jstkMov <= 9) joystick = `${JOY_DIR[s.jstkMov]}${JOY_BUT[s.jstkBut] ?? ''}`;
  return { seq: i, kind, title, short, details, needsBlock, uses, fires: fired, joystick };
}

/** Every sequence a key or the joystick can start, by scan code (0 = joystick only). */
export function characterActions(chr: Character, gravity = false): { scan: number; action: SeqAction }[] {
  const inv = new Set(chr.inv);
  const out: { scan: number; action: SeqAction }[] = [];
  for (let i = 0; i < MAXSEQ; i++) {
    const s = chr.sequences[i];
    const scan = s.key >> 8;
    const joy = i >= 3 && s.jstkMov > 0 && s.jstkMov <= 9;
    if (!scan && !joy) continue;
    out.push({ scan, action: describeSequence(chr, i, (b) => inv.has(b), gravity) });
  }
  return out;
}

/** The game's F1 instructions: text files and pictures it shows. */
function instructionsOf(files: GameFiles, name: string | undefined, depth = 0): Instructions[] {
  if (!name || depth > 2) return [];
  const bytes = files.get(name);
  if (!bytes) return [];
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'txt')
    return [
      {
        name,
        kind: 'text',
        text: new TextDecoder('latin1')
          .decode(bytes)
          .replace(/\x1a[\s\S]*$/, '')
          .replace(/\r\n/g, '\n'),
      },
    ];
  if (ext === 'gif') return [{ name, kind: 'picture', gif: bytes }];
  if (ext === 'bkd') {
    const gif = parseBackdrop(bytes).gif;
    const g = files.get(gif);
    return g ? [{ name, kind: 'picture', gif: g }] : [];
  }
  if (ext === 'lst') return parseSlideList(bytes).flatMap((e) => instructionsOf(files, e.name, depth + 1));
  return [];
}

/** The key map of a whole game, from its .gam file and the characters of its levels. */
export function gameKeyMap(files: GameFiles, gamFile?: string): GameKeyMap {
  const gam = gamFile ?? files.mainGame();
  const game = gam && files.get(gam) ? parseGame(files.get(gam)!) : undefined;
  const levels: Level[] = [];
  game?.scenes.forEach((s, scene) => {
    const f = (i: number) => (s.files[i] ? (files.resolve(s.files[i]) ?? s.files[i].toLowerCase()) : undefined);
    if (s.gametype === ADVTYPE && s.files[5])
      levels.push({ scene, name: s.desc.trim() || `Scene ${scene}`, chr: f(5)!, pal: f(0), map: f(1), bbl: f(2), mon: f(3), mbl: f(4) });
  });
  // Without a game file (or levels), fall back to every character in the folder.
  if (!levels.length) for (const c of files.byExtension('chr')) levels.push({ scene: -1, name: c, chr: c });

  const missing: string[] = [];
  const byKey = new Map<number, KeyUse[]>();
  const joy = new Map<string, JoystickUse>();
  const chrs = [...new Set(levels.map((l) => l.chr))];
  const blockSets = new Map<string, ReturnType<typeof parseBlocks>>();
  for (const name of chrs) {
    const bytes = files.get(name);
    let chr: Character;
    try {
      if (!bytes) throw new Error('missing');
      chr = parseCharacter(bytes);
    } catch {
      missing.push(name);
      continue;
    }
    const mine = levels.filter((l) => l.chr === name);
    const levelNames = mine.map((l) => l.name);
    // Blocks that refill a limited sequence (block effect = sequence number).
    const bblNames = levels.filter((l) => l.chr === name && l.scene >= 0).map((l) => game!.scenes[l.scene].files[2]);
    const refills = new Set<number>();
    for (const b of bblNames) {
      if (!b || !files.get(b)) continue;
      if (!blockSets.has(b)) {
        try {
          blockSets.set(b, parseBlocks(files.get(b)!, BACKBL));
        } catch {
          continue;
        }
      }
      for (const blk of blockSets.get(b)!) if (blk.effect >= 5 && blk.effect < MAXSEQ && blk.eamt > 0) refills.add(blk.effect);
    }
    for (const { scan, action } of characterActions(chr)) {
      if (action.uses !== undefined && !refills.has(action.seq)) action.details = action.details.map((d) => d.replace('; some blocks can give more', ''));
      if (scan) {
        const list = byKey.get(scan) ?? [];
        const same = list.find((u) => u.action.title === action.title && u.action.details.join('|') === action.details.join('|'));
        if (same) {
          if (!same.chrs.includes(name)) {
            same.chrs.push(name);
            same.levels.push(...levelNames);
          }
        } else list.push({ action, chrs: [name], levels: [...levelNames], level: mine[0] });
        byKey.set(scan, list);
      }
      if (action.joystick) {
        const k = `${action.joystick}|${action.title}`;
        const j = joy.get(k);
        if (j) j.levels.push(...levelNames.filter((l) => !j.levels.includes(l)));
        else joy.set(k, { label: action.joystick, action, levels: [...levelNames] });
      }
    }
  }
  const order = (scan: number) => ([72, 80, 75, 77].includes(scan) ? scan - 100 : scan);
  const keys = [...byKey.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([scan, uses]) => ({ scan, name: scanName(scan), uses }));
  return {
    title: game?.scenes[0]?.desc.trim() || gam || 'Game',
    levels,
    keys,
    joystick: [...joy.values()],
    global: GLOBAL_KEYS,
    missing,
    instructions: instructionsOf(files, game?.scenes[0]?.files[6]),
  };
}
