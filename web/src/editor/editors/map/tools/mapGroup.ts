// A selected map picture becomes a named block group in its BBL's companion metadata.
import { promptText, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { groupOf, MAX_SIDE, readGroups, sameGroup, writeGroups, type BlockGroup } from '../../blocks/blockGroups';
import { captureStamp } from './stamps';
import type { CellRect } from './cellOps';

/** Reject oversized layouts explicitly instead of letting groupOf clamp and truncate them. */
export function selectionGroup(name: string, blocks: Uint8Array, area: CellRect, blockCount: number): BlockGroup | undefined {
  if (area.w < 1 || area.h < 1 || area.w > MAX_SIDE || area.h > MAX_SIDE) return undefined;
  const selected = captureStamp(blocks, area);
  return groupOf(name, selected.cells, selected.w, selected.h, blockCount);
}

export async function saveMapGroup(project: Project, bbl: string, blocks: Uint8Array, area: CellRect, blockCount: number): Promise<void> {
  if (!bbl) return toast('Choose a background block set first.', 'error');
  if (area.w > MAX_SIDE || area.h > MAX_SIDE)
    return toast(`Block groups fit up to ${MAX_SIDE}×${MAX_SIDE} blocks. Select a smaller picture, or save this selection as a stamp.`, 'error');
  const name = await promptText('Save as a block group', 'Name (e.g. Building, Tree, Street light)', 'Group');
  if (!name?.trim()) return;
  const group = selectionGroup(name, blocks, area, blockCount);
  if (!group) return toast('This selection has no blocks to group.', 'error');
  const groups = readGroups(project, bbl, blockCount);
  const existing = groups.find((item) => sameGroup(item, group));
  if (existing) return toast(`These blocks already form the group “${existing.name}”.`);
  writeGroups(project, bbl, [...groups, group]);
  toast(`Saved “${group.name}” as a block group. Open ${bbl.toUpperCase()} to paint it as one picture.`);
}
