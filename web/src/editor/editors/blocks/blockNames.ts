// Designer labels for native block numbers live only in each block set's project companion.
import type { Project } from '../../core/project';

export const BLOCK_NAMES = 'blockNames';
export type BlockNames = Record<number, string>;
const clean = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, 80);

export function readBlockNames(value: unknown, count = 256): BlockNames {
  const names: BlockNames = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return names;
  for (const [key, name] of Object.entries(value)) {
    if (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= count || typeof name !== 'string') continue;
    const label = clean(name);
    if (label) names[Number(key)] = label;
  }
  return names;
}

export function blockName(project: Pick<Project, 'extras'>, file: string, index: number): string {
  return readBlockNames(project.extras<unknown>(file, BLOCK_NAMES, undefined))[index] ?? '';
}

/** Keep the native number visible in selectors even when a designer supplied a label. */
export function blockLabel(project: Pick<Project, 'extras'>, file: string, index: number): string {
  const name = blockName(project, file, index);
  return `Block ${index}${name ? `: ${name}` : ''}`;
}

export function setBlockName(project: Pick<Project, 'extras' | 'setExtras'>, file: string, index: number, name: string, count = 256): void {
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError('Choose an existing block number');
  const names = readBlockNames(project.extras<unknown>(file, BLOCK_NAMES, undefined), count);
  const label = clean(name);
  if (label) names[index] = label;
  else delete names[index];
  project.setExtras(file, BLOCK_NAMES, Object.keys(names).length ? names : undefined);
}
