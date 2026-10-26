// The level check's parts that aren't there: sounds whose .VOC file the game doesn't have (with a
// Sound Blaster, PLAYGAME's DoSound then plays nothing: SOUNDC.C PlaySbVocFile gives up when the
// file won't open, after stopping the sound that was playing), files a level names that are
// missing (loadscene stops the game there), map cells and block changes past a block set's 150
// blocks (DOS reads stray memory past them), counters past 29, and placed or born monsters from
// an empty slot of the .mon file (nothing ever shows).
import { BACKBL, MONBL } from '../../../formats/blocks';
import type { Game } from '../../../formats/game';
import { LASTMON, type Monster } from '../../../formats/monster';
import { SOUND_NAMES } from '../../../formats/sound';
import { at, type Finding } from '../findings';
import { blockUse, type SceneData } from '../sceneData';
import type { FileSource } from '../sim';

/** A sound slot's name as the findings say it. */
const slotName = (n: number) => `sound ${n}${SOUND_NAMES[n] ? ` (${SOUND_NAMES[n].toLowerCase()})` : ''}`;

/** A .VOC name DOS can open: letters, digits and the few marks file names allow. */
export const goodName = (s: string) => /^[A-Za-z0-9_$~!#%&'(){}^@`-]{1,8}$/.test(s);

/** Sound slots that name a .VOC file the game doesn't have, or a name no file can have. */
export function missingVocs(d: SceneData, files: FileSource): Finding[] {
  const snd = d.sounds;
  if (!snd || !d.names.snd) return [];
  const gone: string[] = [];
  let first = -1;
  snd.digital.forEach((raw, n) => {
    const name = raw.trim();
    if (!raw || raw[0] === ' ' || !name) return;
    if (goodName(name) && files.get(`${name}.voc`)) return;
    if (first < 0) first = n;
    gone.push(goodName(name) ? `${slotName(n)}: ${name.toUpperCase()}.VOC` : `${slotName(n)}: a name with characters no file name has`);
  });
  if (!gone.length) return [];
  return [
    {
      check: 'voc-missing',
      severity: 'warning',
      title: `${d.names.snd} names ${gone.length === 1 ? 'a .VOC file' : `${gone.length} .VOC files`} the game doesn’t have`,
      detail: `${gone.join('; ')}. With a Sound Blaster, PLAYGAME plays nothing for ${gone.length === 1 ? 'it' : 'them'}, and stops the sound that was playing; only a PC without a card plays the speaker sound. Add the files, or clear the names so every PC plays the speaker sound.`,
      where: { scene: d.scene, sound: { file: d.names.snd, n: first }, file: d.names.snd },
      fix: 'speaker-sound',
    },
  ];
}

/** Files a level names that aren't in the game: play stops there. */
export function missingFiles(game: Game, files: FileSource, scenes: SceneData[]): Finding[] {
  const out: Finding[] = [];
  const told = new Set<string>();
  for (const d of scenes)
    // the palette to the sound set: the files loadscene needs (a missing song is music's to tell)
    for (const name of game.scenes[d.scene].files.slice(0, 8)) {
      if (!name || told.has(name.toLowerCase()) || files.get(name)) continue;
      told.add(name.toLowerCase());
      out.push({
        check: 'missing-file',
        severity: 'error',
        title: `${d.name} names ${name}, which isn’t in the game`,
        detail:
          'PLAYGAME stops at a scene whose files it can’t find and shows which are missing, so nobody gets past this level. Add the file, or choose another in the Integrator.',
        where: { scene: d.scene, file: name },
      });
    }
  return out;
}

/** A .mon slot nothing was made in: no picture at all, and never marked used. */
export const emptySlot = (m: Monster | undefined) => !m || (!m.used && m.pic.every(([b]) => b >= MONBL));

/** Block numbers past the set, counters past 29, and monsters from empty slots. */
export function outOfRange(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const where = { scene: d.scene, map: d.names.map };
  const past: number[] = [];
  d.map.blocks.forEach((n, i) => n >= BACKBL && past.push(i));
  if (past.length)
    out.push({
      check: 'out-of-range',
      severity: 'error',
      title: `${past.length} map cell${past.length === 1 ? ' names a block' : 's name blocks'} past 149, first at ${at(past[0])}`,
      detail: `Block ${d.map.blocks[past[0]]} is there. A block set has 150 blocks, numbered 0 to 149. DOS draws whatever is in memory past them, and what the hero touches there is anyone’s guess. Paint those cells with a real block.`,
      where: { ...where, cell: past[0], cells: past },
    });
  const use = blockUse(d.map);
  for (let n = 0; n < BACKBL; n++) {
    const b = d.bbl[n];
    if (!use[n]) continue;
    const bad = [
      b.touchBl >= BACKBL && `becomes block ${b.touchBl} when touched`,
      b.ntime > 0 && b.nextBl >= BACKBL && `turns into block ${b.nextBl} after ${b.ntime} ticks`,
      b.effect > 29 && b.eamt !== 0 && `changes counter ${b.effect}, and the counters stop at 29`,
      b.birthTime > 0 &&
        b.birthMon < LASTMON &&
        d.mon.length > 0 &&
        emptySlot(d.mon[b.birthMon]) &&
        `gives birth to monster ${b.birthMon}, an empty slot in ${d.names.mon ?? 'the monster file'}`,
    ].filter((s): s is string => !!s);
    if (!bad.length) continue;
    const birthOnly = bad.length === 1 && b.birthTime > 0 && bad[0].startsWith('gives birth');
    out.push({
      check: 'out-of-range',
      severity: birthOnly ? 'warning' : 'error',
      title: `Block ${n} ${bad.join(', and ')}`,
      detail: birthOnly
        ? 'Nothing is ever born there. Was the block set made for another monster file? Choose a monster that is there, or set it to give birth to none.'
        : 'That number is past the end of what PLAYGAME keeps, so DOS reads stray memory there and the game can act up or crash. Choose a block from 0 to 149 and a counter from 3 to 29.',
      where: { ...where, block: { file: d.names.bbl ?? '', n }, cells: [...d.map.blocks.keys()].filter((i) => d.map.blocks[i] === n) },
    });
  }
  const empty = new Map<number, number[]>();
  // a scene with no monster file at all shows none (missing-file says so when one is named)
  for (const p of d.mon.length ? d.map.monsters : [])
    if (p.monnum < LASTMON && p.curx >= 0 && p.curx < 100 && p.cury >= 0 && p.cury < 100 && emptySlot(d.mon[p.monnum]))
      empty.set(p.monnum, [...(empty.get(p.monnum) ?? []), p.cury * 100 + p.curx]);
  for (const [n, cells] of empty)
    out.push({
      check: 'out-of-range',
      severity: 'warning',
      title: `Monster ${n} is placed ${cells.length === 1 ? 'once' : `${cells.length} times`}, but its slot in ${d.names.mon ?? 'the monster file'} is empty`,
      detail: `First at ${at(cells[0])}. It never shows and does nothing. Was the map made for another monster file? Place a monster that is there, or remove these.`,
      where: { ...where, cell: cells[0], cells, monster: { file: d.names.mon ?? '', n } },
    });
  return out;
}
