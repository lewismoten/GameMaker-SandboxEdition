// Bringing a backup back: this browser read afresh, the import worked out again with the choices
// made (so a change made meanwhile in another tab isn't lost), and only what differs written.
// Then the pages listening for changes are told; the dialog asks for a reload for the rest.
import type { ReadBackup } from './file';
import { planImport, type ImportChoices, type Plan } from './plan';
import { readWorld, writeWorld } from './world';

/** Events other parts of the site redraw on (each module's own name for it; project/catalogWatch.ts follows the eggs' and saves'). */
const CHANGED = [
  'gm-saves-changed',
  'gm-save-backups-changed',
  'gm-achievements-changed',
  'gm-scores-changed',
  'gm-score-trophies-changed',
  'gm-eggs-changed',
  'gm-tin-hearts-changed',
  'gm-imported-notes-changed',
];

export async function applyImport(backup: ReadBackup, choices: ImportChoices): Promise<Plan> {
  const before = await readWorld();
  const plan = await planImport(before, backup, choices);
  await writeWorld(before, plan.next);
  for (const name of CHANGED) window.dispatchEvent(new Event(name));
  return plan;
}
