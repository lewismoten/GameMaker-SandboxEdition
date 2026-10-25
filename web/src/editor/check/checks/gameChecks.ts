// The level check's whole-game checks: keys never taught on a text screen, keys that wait
// before they answer, the hero's walking speed, loud or long sounds on frequent events, the
// title, instructions, credits, won and lost screens, and how much changes from level to level.
import { CHARBL, MONBL } from '../../../formats/blocks';
import { MAXSEQ, type Character } from '../../../formats/character';
import { decodeVoc, isVoc } from '../../../formats/voc';
import type { Game } from '../../../formats/game';
import { scanName } from '../../../input/scancodes';
import type { GameFiles } from '../../../project/files';
import { characterActions, gameKeyMap } from '../../keymap/keyMap';
import type { Finding } from '../findings';
import { blockUse, type SceneData } from '../sceneData';
import { heroSpeed } from './monsterChecks';

const ARROWS = new Set([72, 75, 77, 80, 71, 73, 79, 81]);

/** Every word the game shows as text: its .txt screens. */
export function gameText(files: GameFiles): string {
  return files
    .byExtension('txt')
    .map((n) => new TextDecoder('latin1').decode(files.get(n)))
    .join('\n');
}

/** Is the key named somewhere in the text? Single letters only count as a capital on their own. */
export function mentions(text: string, scan: number): boolean {
  const name = scanName(scan);
  const words: Record<string, string[]> = { Space: ['space', 'spacebar', 'space bar'], Enter: ['enter', 'return'], Ctrl: ['ctrl', 'control'], Alt: ['alt'] };
  const alts = words[name] ?? [name];
  return alts.some((w) => (w.length === 1 ? new RegExp(`(^|[^A-Za-z])${w}([^A-Za-z]|$)`).test(text) : new RegExp(`\\b${w}\\b`, 'i').test(text)));
}

export function controls(files: GameFiles): Finding[] {
  const km = gameKeyMap(files);
  const text = gameText(files);
  const pictures = km.instructions.some((i) => i.kind === 'picture');
  const out: Finding[] = [];
  for (const k of km.keys) {
    if (ARROWS.has(k.scan) || k.uses.every((u) => u.action.kind === 'nothing' || u.action.kind === 'builtin')) continue;
    if (mentions(text, k.scan)) continue;
    const does = k.uses.map((u) => u.action.title.toLowerCase()).join(', ');
    out.push({
      check: 'controls',
      severity: pictures ? 'info' : 'warning',
      title: `The ${k.name} key (${does}) isn’t named on any text screen`,
      detail: pictures
        ? 'The instructions are a picture, which the check can’t read: make sure it shows this key.'
        : 'Unless it is a secret, name it in the instructions, or on a sign in the level where it is first needed.',
      where: { file: k.uses[0]?.chrs[0] },
      fix: 'key-sign',
    });
  }
  return out;
}

/** Ticks after the key before the sequence first moves the hero or fires. */
function answerTicks(chr: Character, seq: number): number {
  let t = 0;
  for (const f of chr.sequences[seq].frames) {
    if (f.pic2 === CHARBL + 1) return 0;
    if (f.x || f.y || f.pic2 === MONBL) return t;
    t += f.pause;
  }
  return 0;
}

export function characterChecks(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const where = { scene: d.scene, file: d.names.chr };
  for (const { scan, action } of characterActions(
    d.chr,
    d.bbl.some((b) => b.grav),
  )) {
    if (!scan || !['move', 'jump', 'fire'].includes(action.kind)) continue;
    const t = answerTicks(d.chr, action.seq);
    if (t > 9)
      out.push({
        check: 'response',
        severity: 'warning',
        title: `${scanName(scan)} (${action.title.toLowerCase()}) waits ${(t / 18.2).toFixed(1)} s before anything happens`,
        detail: 'If it should feel instant, make its first frame move, or shorten the first pause.',
        where,
      });
  }
  const v = heroSpeed(d.chr);
  if (v && v < 2)
    out.push({
      check: 'hero-speed',
      severity: 'info',
      title: `The hero walks ${v.toFixed(1)} px a tick (${Math.round(v * 18.2)} px a second)`,
      detail: 'About 4 px a tick crosses a screen in four seconds. Slower can suit a heavy or careful hero; is that the feel you want?',
      where,
    });
  for (let i = 5; i < MAXSEQ; i++) {
    const s = d.chr.sequences[i];
    if (!s.key || s.momentum) continue;
    const end = s.frames.findIndex((f) => f.pic2 === CHARBL + 1);
    const frames = s.frames.slice(0, end < 0 ? s.frames.length : end);
    const moving = frames.filter((f) => f.x && !f.y);
    if (moving.length < 3 || moving.length < frames.length - 1) continue;
    const steps = new Set(moving.map((f) => `${Math.abs(f.x)}/${f.pause}`));
    if (steps.size > 1)
      out.push({
        check: 'hero-speed',
        severity: 'info',
        title: `The ${scanName(s.key >> 8)} walk moves unevenly (${[...steps].join(', ')} px per tick of pause)`,
        detail: 'Unless the stagger is meant, give every walk frame the same move and pause, so the hero doesn’t feel slippery.',
        where,
      });
  }
  return out;
}

/** A .voc file's length in seconds and loudness (RMS, in dB below full scale). */
function vocStats(bytes: Uint8Array): { seconds: number; db: number } | undefined {
  if (!isVoc(bytes)) return undefined;
  try {
    const v = decodeVoc(bytes);
    let sum = 0;
    for (const s of v.samples) sum += s * s;
    const rms = Math.sqrt(sum / Math.max(1, v.samples.length));
    return { seconds: v.samples.length / v.sampleRate, db: 20 * Math.log10(rms || 1e-6) };
  } catch {
    return undefined;
  }
}

export function soundChecks(d: SceneData, files: GameFiles): Finding[] {
  const snd = d.sounds;
  if (!snd) return [];
  // what plays often: the sound of a move or jump that repeats while held, a score or a heal
  // when the map has many of them
  const often = new Map<number, string>();
  d.chr.sequences.forEach((s, i) => {
    if (i >= 5 && s.key && !s.norepeat && s.sound >= 0 && s.sound < 30) often.set(s.sound, `the ${scanName(s.key >> 8)} key’s sequence`);
  });
  const use = blockUse(d.map);
  const count = (f: (n: number) => boolean) => [...use.keys()].filter((n) => n < 150 && f(n)).reduce((s, n) => s + use[n], 0);
  if (count((n) => d.bbl[n].scorePts > 0) >= 20) often.set(5, 'every score pickup');
  if (count((n) => d.bbl[n].chHitPt > 0) >= 10) often.set(0, 'every healing pickup');
  const out: Finding[] = [];
  for (const [n, what] of often) {
    const name = snd.digital[n];
    if (!name || name[0] === ' ') continue;
    const bytes = files.get(`${name}.voc`);
    const st = bytes && vocStats(bytes);
    if (!st || (st.seconds <= 0.6 && st.db < -9)) continue;
    out.push({
      check: 'sounds',
      severity: st.seconds > 1.2 ? 'warning' : 'info',
      title: `Sound ${n} (${name}.voc) plays on ${what}: ${st.seconds.toFixed(1)} s long, ${Math.round(st.db)} dB`,
      detail: 'Does it wear well a hundred times? Frequent sounds usually work best short and soft, with long or loud ones kept for rare events.',
      where: { scene: d.scene, sound: { file: d.names.snd ?? '', n } },
    });
  }
  return out;
}

export function endingChecks(game: Game): Finding[] {
  const out: Finding[] = [];
  const title = game.scenes[0];
  const end = game.scenes[1];
  const missing = (label: string, severity: Finding['severity'], why: string) =>
    out.push({ check: 'ending', severity, title: `No ${label}`, detail: why, where: { scene: label.includes('won') || label.includes('lost') ? 1 : 0 } });
  if (end && !end.files[0]) missing('“game won” graphic', 'warning', 'The player’s reward is the last thing they see: give it a picture and a thank-you.');
  if (end && !end.files[2]) missing('“game lost” graphic', 'info', 'A picture for losing tells the player the game noticed.');
  if (title && !title.files[6]) missing('game instructions', 'warning', 'Players need to know the keys and the goal.');
  if (title && !title.files[4]) missing('storyline', 'info', 'A line of story says why the hero is there.');
  if (title && !title.files[7]) missing('credits', 'info', 'Say who made it.');
  return out;
}

export function variety(scenes: SceneData[]): Finding[] {
  if (scenes.length < 3) return [];
  const all = (k: keyof SceneData['names']) => new Set(scenes.map((s) => s.names[k]));
  const same = (['bbl', 'mon', 'pal'] as const).filter((k) => all(k).size === 1);
  if (same.length < 2) return [];
  return [
    {
      check: 'variety',
      severity: 'info',
      title: `All ${scenes.length} levels share the same ${same.map((k) => ({ bbl: 'blocks', mon: 'monsters', pal: 'palette' })[k]).join(' and ')}`,
      detail: 'Is one look the style? If not, a new place, enemy or item every level or two keeps the game fresh.',
      where: {},
    },
  ];
}

/**
 * Special blocks (a pull other than the scene's ordinary one, a door that opens when touched)
 * used in a single spot in the whole game: a mechanic shown once and never built on.
 */
export function mechanics(scenes: SceneData[]): Finding[] {
  const spots = new Map<string, { scene: number; map?: string; cells: number[]; what: string }[]>();
  for (const d of scenes) {
    const use = blockUse(d.map);
    let common = 0;
    for (let n = 0; n < 150; n++) if (d.bbl[n].solid !== 15 && use[n] > use[common]) common = n;
    const ordinary = d.bbl[common].grav;
    d.bbl.forEach((b, n) => {
      if (!use[n] || n >= 150) return;
      const kind = b.grav && b.grav !== ordinary ? `pull ${b.grav}` : b.solid && b.touchBl !== n && !d.bbl[b.touchBl]?.solid ? 'door' : '';
      if (!kind) return;
      const cells: number[] = [];
      d.map.blocks.forEach((v, i) => v === n && cells.push(i));
      const k = `${d.names.bbl}:${n}`;
      spots.set(k, [
        ...(spots.get(k) ?? []),
        { scene: d.scene, map: d.names.map, cells, what: kind === 'door' ? 'opens when touched' : 'pulls the hero a special way' },
      ]);
    });
  }
  const out: Finding[] = [];
  for (const [k, list] of spots) {
    if (list.length > 1 || list[0].cells.length > 2) continue;
    const n = Number(k.split(':').pop());
    out.push({
      check: 'mechanics',
      severity: 'info',
      title: `Block ${n} ${list[0].what}, and is used in just ${list[0].cells.length === 1 ? 'one place' : 'two places'} in the whole game`,
      detail:
        'Used once: is that on purpose? A one-off can be a fine surprise. If it isn’t one, it could come back where it asks something new: teach it, test it, twist it.',
      where: { scene: list[0].scene, map: list[0].map, cell: list[0].cells[0], cells: list[0].cells },
    });
  }
  return out;
}

/** Jumps that a stray key can cut off in mid-air (their sequence can be interrupted). */
export function jumps(d: SceneData): Finding[] {
  const out: Finding[] = [];
  for (const { scan, action } of characterActions(
    d.chr,
    d.bbl.some((b) => b.grav),
  )) {
    if (!scan || action.kind !== 'jump' || d.chr.sequences[action.seq].ground) continue;
    out.push({
      check: 'hero-speed',
      severity: 'info',
      title: `${scanName(scan)} (${action.title.toLowerCase()}) can be cut off by another key in mid-air`,
      detail: 'Another key can stop the jump partway. To have it always finish, mark its sequence as one that can’t be interrupted.',
      where: { scene: d.scene, file: d.names.chr },
    });
  }
  return out;
}
