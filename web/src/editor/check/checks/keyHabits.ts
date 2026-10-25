// The level check's key habits: a fire key that roots the hero while it repeats (PLAYGAME plays
// one sequence at a time, so no walk runs while a shot does), a weapon with its own ammunition
// for each direction (one count per sequence), and a key that does a different kind of thing
// from one level's character to the next.
import { MONBL } from '../../../formats/blocks';
import { INF_REPEAT, MAXSEQ, frameCount, type Character } from '../../../formats/character';
import { scanName } from '../../../input/scancodes';
import type { GameFiles } from '../../../project/files';
import { characterActions, gameKeyMap } from '../../keymap/keyMap';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';

/** Ticks a fire sequence may hold the hero in place before players feel stuck. */
const ROOT_TICKS = 6;
/** A second: long enough that players feel the hero freeze. */
const LONG_ROOT_TICKS = 18;

/** A fire sequence's ticks, and whether it moves the hero at all. */
function fireTime(chr: Character, seq: number): { ticks: number; moves: boolean } {
  const s = chr.sequences[seq];
  const frames = s.frames.slice(0, frameCount(s));
  return { ticks: frames.reduce((t, f) => t + f.pause, 0), moves: frames.some((f) => f.pic2 !== MONBL && (f.x || f.y)) };
}

export function keyHabits(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const where = { scene: d.scene, file: d.names.chr };
  const fires = characterActions(d.chr).filter(({ scan, action }) => scan && action.kind === 'fire');
  for (const { scan, action } of fires) {
    const s = d.chr.sequences[action.seq];
    const t = fireTime(d.chr, action.seq);
    if (t.moves || t.ticks < ROOT_TICKS || (s.norepeat && !s.ground)) continue;
    out.push({
      check: 'response',
      // most shots root the hero a moment (PLAYGAME's way); a long one is worth a second look
      severity: t.ticks >= LONG_ROOT_TICKS && !s.norepeat ? 'warning' : 'info',
      title: `${scanName(scan)} (${action.title.toLowerCase()}) holds the hero still for ${(t.ticks / 18.2).toFixed(1)} s each shot${s.norepeat ? '' : ', again and again while held'}`,
      detail:
        'PLAYGAME plays one sequence at a time, so while the shot plays no walk does, and holding the key roots the hero. If firing on the move matters, make the shot one short frame that can be interrupted, or fire from the walk frames.',
      where,
    });
  }
  // the same shot on several keys, each with uses of its own: ammunition for each direction
  const limited = fires.filter(({ action }) => action.uses !== undefined && d.chr.meter[action.seq] !== INF_REPEAT && action.seq < MAXSEQ);
  const byShot = new Map<number, typeof limited>();
  // one weapon: the same shot, needing the same object (or none)
  for (const f of limited)
    for (const n of f.action.fires) byShot.set(n * 1000 + (f.action.needsBlock ?? 999), [...(byShot.get(n * 1000 + (f.action.needsBlock ?? 999)) ?? []), f]);
  for (const [k, list] of byShot) {
    const n = Math.floor(k / 1000);
    const keys = [...new Set(list.map((f) => f.scan))];
    if (keys.length < 2) continue;
    out.push({
      check: 'controls',
      severity: 'warning',
      title: `Monster ${n} is fired by ${keys.map(scanName).join(', ')}, each with uses of its own`,
      detail:
        'Every sequence keeps its own count, so the weapon has separate ammunition for each key: a player out of shots one way still has them the other, and few understand why. One fire key that fires the way the hero faces, with one count, reads better.',
      where,
    });
  }
  return out;
}

const KIND_WORD: Record<string, string> = { move: 'moves', jump: 'jumps', fire: 'fires', pickup: 'picks up', drop: 'drops', action: 'acts' };

/** Keys whose kind of action changes from one character to another (Space fires here, jumps there). */
export function changingKeys(files: GameFiles): Finding[] {
  const km = gameKeyMap(files);
  const out: Finding[] = [];
  for (const k of km.keys) {
    const kinds = new Map<string, string[]>();
    for (const u of k.uses) if (KIND_WORD[u.action.kind]) kinds.set(u.action.kind, [...(kinds.get(u.action.kind) ?? []), ...u.levels]);
    if (kinds.size < 2) continue;
    const says = [...kinds].map(
      ([kind, levels]) => `${KIND_WORD[kind]} in ${levels.slice(0, 2).join(', ')}${levels.length > 2 ? ` and ${levels.length - 2} more` : ''}`,
    );
    out.push({
      check: 'controls',
      severity: 'info',
      title: `${k.name} ${says.join(', but ')}`,
      detail:
        'A key that changes its job between levels catches players out. Fine for a new vehicle or form the level announces; otherwise keep each key’s job the same all game.',
      where: { file: k.uses[0]?.chrs[0] },
    });
  }
  return out;
}
