// What the Saves & scores panel does to a whole slot: save the changes, start a new game in it,
// download or bring in its .sav, and delete it (each change backed up first).
import { download, pickFiles } from '../editor/core/ui';
import { deleteSlot, newGameSave, NEW_SAVE_NAME, parseSave, writeSlot, writeSlotBytes } from '../project/saveData';
import type { Panel } from './panelState';
import { confirmDialog } from './panelText';

export async function commitSlot(p: Panel, slot: number): Promise<void> {
  const w = p.work.get(slot);
  if (!w) return;
  try {
    await p.safety();
    await writeSlot(p.target.saveId, slot, w.save, w.name);
    p.work.delete(slot);
    p.whereSay.delete(slot);
    await p.reload();
    p.toast(`Slot ${slot + 1} saved. In the game, F6 loads it.`);
    p.render();
  } catch (e) {
    p.toast(`Could not save: ${(e as Error).message}`, 'error');
  }
}

const fileBase = (p: Panel) =>
  (p.target.gam ?? p.target.title)
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

export const exportSav = (p: Panel, slot: number, bytes: Uint8Array) => download(`${fileBase(p)}-game${slot}.sav`, bytes);

export async function importSav(p: Panel, slot: number): Promise<void> {
  const [file] = await pickFiles({ multiple: false, accept: '.sav,application/json' });
  if (!file) return;
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    parseSave(bytes);
  } catch (e) {
    p.toast(`${file.name}: ${(e as Error).message}`, 'error');
    return;
  }
  if (
    p.saves?.slots[slot].bytes &&
    !(await confirmDialog(
      'Replace this save?',
      `Slot ${slot + 1} already holds a saved game. Replace it with ${file.name}? (A backup is taken first.)`,
      'Replace',
    ))
  )
    return;
  p.backedUp = false; // a fresh backup for each replace
  await p.safety();
  await writeSlotBytes(p.target.saveId, slot, bytes);
  p.work.delete(slot);
  await p.reload();
  p.toast(`${file.name} is in slot ${slot + 1}.`);
  p.render();
}

/** An empty slot gets the game as it starts (saveData newGameSave), named; then it can be edited. */
export async function newSave(p: Panel, slot: number): Promise<void> {
  if (!p.disk || !p.target.gam) return;
  try {
    const save = newGameSave(p.disk, p.target.gam);
    await p.safety();
    await writeSlot(p.target.saveId, slot, save, NEW_SAVE_NAME);
    p.work.delete(slot);
    await p.reload();
    p.toast(`Slot ${slot + 1}: a new game, as it starts. Rename it or change anything; in the game, F6 loads it.`);
    p.render();
    p.main.querySelector<HTMLInputElement>(`#sv-name-${slot}`)?.select();
  } catch (e) {
    p.toast(`Could not make a new save: ${(e as Error).message}`, 'error');
  }
}

export async function removeSlot(p: Panel, slot: number): Promise<void> {
  if (
    !(await confirmDialog('Delete this save?', `Slot ${slot + 1} will be empty. A backup is taken first, so it can be restored from Backups.`, 'Delete', true))
  )
    return;
  p.backedUp = false;
  await p.safety();
  await deleteSlot(p.target.saveId, slot);
  p.work.delete(slot);
  await p.reload();
  p.render();
}
