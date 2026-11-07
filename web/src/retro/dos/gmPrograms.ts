// What each program in C:\GM (and D:\GM on the CD) runs as when typed at the prompt.
// GM.EXE chains to the others with "cOoL <choice>" on their command line
// (code/GM/GM.ASM's Programs table); typed by hand they run on their own. Only MENU.EXE
// refuses to (MENU.C:38); the rest check OKMSG just to decide whether to put text mode
// back on exit (RestorePal), so quitting them ends at the prompt.
import type { ProgramRef } from './vfs';

/** The designers GM chains to, minus IMAGE.EXE, which has a ProgramRef of its own. */
export const GM_DESIGNERS = ['PALCHOS.EXE', 'BLOCEDIT.EXE', 'MONEDIT.EXE', 'MAPMAKER.EXE', 'CHAREDIT.EXE', 'SNDEDIT.EXE', 'GRATOR.EXE'];

const RUNS: Record<string, ProgramRef> = {
  'GM.EXE': { kind: 'gm' },
  'MENU.EXE': { kind: 'menu' },
  'IMAGE.EXE': { kind: 'image' },
  'PLAYGAME.EXE': { kind: 'playgame' },
  'UTILITY.EXE': { kind: 'utility' },
  'XFERPLAY.EXE': { kind: 'xferplay' },
  ...Object.fromEntries(GM_DESIGNERS.map((exe): [string, ProgramRef] => [exe, { kind: 'designer', exe }])),
};

/** The program a file in the GM folder starts, by its (upper-case) name; undefined for data. */
export function gmProgramRef(name: string): ProgramRef | undefined {
  // GMMENU.BAT, DE.BAT, BL.BAT ...: RSD's batch files for PCs that cannot chain programs
  if (name.endsWith('.BAT')) return { kind: 'batch' };
  return RUNS[name];
}
