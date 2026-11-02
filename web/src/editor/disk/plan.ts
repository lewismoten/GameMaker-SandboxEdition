// The disk-space tool's findings: every consolidation that is safe to apply, in the order it must
// happen (monster blocks, then monster files, then palettes, then look-alike blocks, then block sets), found by applying each to a copy
// and looking again; plus the near misses the author may want to do by hand.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { GameFiles } from '../../project/files';
import { planBackgrounds } from './mergeBackgrounds';
import { planCharacterBlocks } from './mergeCharacterBlocks';
import { planLookAlikes } from './lookAlikeFold';
import { planPalettes } from './mergePalettes';
import { planRangeSync } from './rangeSync';
import type { PaletteReservation } from '../editors/palette/paletteReservations';
import { planMonsterBlocks } from './mergeMonsterBlocks';
import { planMonsters } from './mergeMonsters';
import { planColorFolds } from './lookAlikeColors';
import { planGifs } from './shrinkGifs';
import { filesIn, sceneUses } from './refs';
import { SAVE_SAFE_KINDS } from './savesSafe';
import type { Note, Plan, Step } from './types';

// block sets join last: once two scenes share a block set, their monster files can no longer tell whose birth blocks are whose
const ORDER: Step['kind'][][] = [['sync', 'mbl', 'mon', 'cbl', 'pal'], ['look', 'bbl'], ['gif']];

/** The next step that can be applied, and why the other pairs can't. */
function next(files: GameFiles, gam: string, notes: Note[], order: Step['kind'][], ranges: readonly PaletteReservation[]): Step | undefined {
  const uses = sceneUses(files, parseGame(files.get(gam)!));
  for (const kind of order) {
    if (kind === 'sync') {
      const s = planRangeSync(files, gam, ranges);
      if (s) return s;
      continue;
    }
    if (kind === 'gif') return planGifs(files);
    if (kind === 'pal') return planPalettes(files, gam, uses);
    if (kind === 'look') {
      const s = planLookAlikes(files, gam, uses) ?? planColorFolds(files, gam);
      if (s) return s;
      continue;
    }
    const slot = kind;
    const names = filesIn(uses, slot).sort();
    for (let a = 0; a < names.length; a++)
      for (let b = 0; b < names.length; b++) {
        if (a === b) continue;
        const [x, y] = [names[a], names[b]];
        const r =
          kind === 'bbl'
            ? planBackgrounds(files, gam, uses, x, y)
            : kind === 'mbl'
              ? planMonsterBlocks(files, gam, uses, x, y, ranges)
              : kind === 'cbl'
                ? planCharacterBlocks(files, gam, uses, x, y, ranges)
                : planMonsters(files, gam, uses, x, y);
        if (typeof r !== 'string') return r;
        if (a < b && !/do not fit|merge those first/.test(r) && (kind !== 'bbl' || /carried between|also used with/.test(r)))
          notes.push({ kind, title: `${names[a]} and ${names[b]} stay separate`, why: r });
      }
  }
  return undefined;
}

/** `ranges` are the project's palette reservations (editors/palette/paletteReservations.ts); without them no range is synced. */
/** `skip` leaves out step kinds ("Monsters and characters only" skips the background ones). With `keepSaves`, only the steps that never change a number a saved game holds (savesSafe.ts). */
export function planDisk(
  files: GameFiles,
  gam: string,
  ranges: readonly PaletteReservation[] = [],
  keepSaves = false,
  skip: ReadonlySet<Step['kind']> = new Set(),
): Plan {
  const work = files.copy();
  const steps: Step[] = [];
  const notes: Note[] = [];
  for (const all of ORDER) {
    const order = all.filter((k) => !skip.has(k) && (!keepSaves || SAVE_SAFE_KINDS.has(k)));
    for (let guard = 0; guard < 50; guard++) {
      const note: Note[] = [];
      const step = next(work, gam, note, order, ranges);
      if (!step) {
        notes.push(...note);
        break;
      }
      steps.push(step);
      step.apply(work, gam);
    }
  }
  return { steps, notes };
}
