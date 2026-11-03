// What the Overview's disk-space card shows without opening the tool: the floppy and one status line.
import type { Project } from '../core/project';
import { drawFloppy } from './floppy';
import { floppyArt } from './floppyData';
import { sizeUp } from './size';

export const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : n >= 1000 ? `${(n / 1000).toFixed(1)} KB` : `${n} bytes`);
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The floppy for a project, as a canvas (or nothing when its files can't be drawn). */
export function floppyFor(project: Project, width: number): HTMLCanvasElement | null {
  try {
    return drawFloppy(document.createElement('canvas'), floppyArt(project.files, project.gam, project.name), width);
  } catch {
    return null;
  }
}

/** The status line the Tools card shows: cheap, no planning. */
export function diskStatus(project: Project): string {
  try {
    const s = sizeUp(project.files, project.gam);
    const d = (n: number) => (n === Infinity ? 'a file too big' : plural(n, 'disk'));
    return `${kb(s.total)} to run · ${d(s.disks.high)} at 1.44 MB · ${d(s.disks.low)} at 720 KB`;
  } catch {
    return 'Not measured';
  }
}

/** Opens the Optimize dialog (loaded when first used); the Tools card and the Files tab's floppy both open it. */
export function openOptimize(project: Project): void {
  void import('./diskTool').then((m) => m.diskTool(project));
}
