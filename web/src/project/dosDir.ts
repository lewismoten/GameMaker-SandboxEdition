// A game's name in DOS, the single source for its ZIP (<DIR>.ZIP), its folder (C:\DOWNLOAD\<DIR>
// on the desk PC, a Sample Disk folder, a CD folder): its about.json "dosName" when it has one, else its id when that is a valid
// 8.3 name already, else its program's name (RECKON for reckoning, from RECKON.EXE, the same name
// its ZIP has), else the id cut to six letters and "~1", the way DOS shortened long names.
const DOS_NAME = /^[A-Z0-9_$~!#%&-]{1,8}$/;

export function dosDir(g: { id: string; exe?: string; dosName?: string }): string {
  if (g.dosName && DOS_NAME.test(g.dosName.toUpperCase())) return g.dosName.toUpperCase();
  const id = g.id.toUpperCase();
  if (DOS_NAME.test(id)) return id;
  const stem = (g.exe ?? '').replace(/\.EXE$/i, '').toUpperCase();
  if (DOS_NAME.test(stem)) return stem;
  return `${id.replace(/[^A-Z0-9_-]/g, '').slice(0, 6)}~1`;
}

/** Is it a valid DOS file name (8 characters, a dot and up to 3)? */
export const isDosFileName = (name: string): boolean => /^[A-Z0-9_$~!#%&-]{1,8}(\.[A-Z0-9_$~!#%&-]{1,3})?$/i.test(name);
