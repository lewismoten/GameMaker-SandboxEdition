// Where HEXEDIT's files come from and go back to on the desk PC. Reading is the DOS file
// system's (any drive); writing is allowed where a DOS program could write:
//   C:\GM\<GAME>   your game folders (an installed game becomes your copy on the first save,
//                  as Game-Maker's own designers do), with NAME.BAK written first;
//   A:\            a floppy of yours that isn't write-protected, NAME.BAK first;
//   saved games    GAME0.SAV, SAVNAMES.DAT, <GAME>.HIS: what a game wrote while played,
//                  shown in its C:\GM or C:\DOWNLOAD folder; backed up first in the same
//                  store BACKUP.EXE and SAVEHACK keep.
// The CD (D:), the BBS's shareware and DOS's own files are read-only, in DOS's words.
import type { RetroHost } from '../host';
import { loadProject, loadSaveData, writeSaveFile } from '../../project/storage';
import { hdProject } from '../dos/hardDisk';
import { backupNow } from '../../project/saveData';
import { Project } from '../../editor/core/project';

export interface HexEntry {
  name: string;
  dir: boolean;
  size: number;
  /** A file the game saved while played (kept apart from the game's own files). */
  save?: boolean;
}

export interface HexFile {
  /** C:\GM\TEDDY\TEDDY.GAM */
  path: string;
  name: string;
  bytes: Uint8Array;
  /** Why it can't be written, in DOS's words (first line) and a hint; undefined when it can. */
  readOnly?: [string, string];
  /** Writes the file back (backing up first); returns what was done, for the status line. */
  write?: (bytes: Uint8Array) => Promise<string>;
}

/** The .BAK name a file is backed up to (TEDDY.GAM → TEDDY.BAK), as DOS editors did. */
export const bakOf = (name: string): string => `${name.replace(/\.[^.]*$/, '')}.BAK`.toUpperCase();

export const pathOf = (drive: string, parts: string[], name?: string): string => `${drive}:\\${[...parts, ...(name ? [name] : [])].join('\\')}`;

/** The save id of the game in a folder (where its saves and high scores are kept), if any. */
async function saveIdOf(h: RetroHost, drive: string, parts: string[]): Promise<string | undefined> {
  if (drive !== 'C' || parts.length !== 2) return undefined;
  if (parts[0] === 'DOWNLOAD') {
    const g = (await h.catalog()).find((c) => c.id.toUpperCase() === parts[1] && h.downloads.has(c.id));
    return g?.gam ? `game:${g.id}` : undefined;
  }
  if (parts[0] === 'GM') {
    const g = (await h.hdGames()).find((x) => x.dir === parts[1]);
    if (!g) return undefined;
    return g.source === 'installed' ? `game:${g.catalog!.id}` : `project:${g.projectId}`;
  }
  return undefined;
}

/** A folder's files and folders, with the saves of the game in it; null if the drive isn't ready. */
export async function listFolder(h: RetroHost, drive: string, parts: string[]): Promise<HexEntry[] | null | undefined> {
  const list = await h.fs.listDir(drive, parts);
  if (!list) return list;
  const out: HexEntry[] = list.map((n) => ({ name: n.name, dir: n.dir, size: n.size }));
  const save = await saveIdOf(h, drive, parts);
  if (save)
    for (const [name, bytes] of Object.entries(await loadSaveData(save)))
      if (!out.some((e) => e.name === name.toUpperCase())) out.push({ name: name.toUpperCase(), dir: false, size: bytes.length, save: true });
  return out;
}

/** Opens a file for HEXEDIT; undefined when there's no such file. */
export async function openFile(h: RetroHost, drive: string, parts: string[], name: string): Promise<HexFile | undefined> {
  const upper = name.toUpperCase();
  const path = pathOf(drive, parts, upper);
  const node = (await h.fs.listDir(drive, parts))?.find((n) => n.name === upper);
  if (node?.dir) return undefined;
  if (!node?.read) {
    // not a file on the disk: a file the game saved?
    const save = await saveIdOf(h, drive, parts);
    if (!save) return undefined;
    const files = await loadSaveData(save);
    const key = Object.keys(files).find((k) => k.toUpperCase() === upper);
    if (!key) return undefined;
    return {
      path,
      name: upper,
      bytes: files[key],
      write: async (bytes) => {
        const b = await backupNow(save, { label: `Before HEXEDIT changed ${upper}`, auto: true, by: 'HEXEDIT' });
        await writeSaveFile(save, key, bytes);
        return b ? 'Saved. The saves as they were are a backup now (BACKUP /L lists it).' : 'Saved.';
      },
    };
  }
  const bytes = await node.read();
  const file: HexFile = { path, name: upper, bytes };
  if (drive === 'D') file.readOnly = ['Access denied', `${path} is on the CD-ROM, which can't be written to.`];
  else if (drive === 'A') {
    const d = h.disk();
    if (d?.disk.writeProtected) file.readOnly = ['Write protect error writing drive A', 'The disk is write-protected: slide its tab to write on it.'];
    else if (d?.disk.projectId) {
      const id = d.disk.projectId;
      file.write = async (b) => {
        const stored = await loadProject(id);
        if (!stored) throw new Error('General failure writing drive A');
        const p = Project.fromFiles(stored.files, stored.record.name, id);
        p.gam = stored.record.gam;
        const bak = bakOf(upper);
        p.files.set(bak, bytes);
        p.files.set(upper, b);
        d.files.set(bak, bytes);
        d.files.set(upper, b);
        await p.saveNow();
        return `Saved. The file as it was is ${bak}.`;
      };
    } else file.readOnly = ['Access denied', `${path} can't be written to.`];
  } else if (drive === 'C' && parts[0] === 'GM' && parts.length === 2) {
    const g = (await h.hdGames()).find((x) => x.dir === parts[1]);
    if (g)
      file.write = async (b) => {
        const p = await hdProject(g);
        const bak = bakOf(upper);
        p.files.set(bak, p.files.get(upper) ?? bytes);
        p.files.set(upper, b);
        await p.saveNow();
        return `Saved. The file as it was is ${bak}${g.source === 'installed' ? ' (Restore in GM puts the game back as installed)' : ''}.`;
      };
    else file.readOnly = ['Access denied', `${path} can't be written to.`];
  } else if (drive === 'C' && parts[0] === 'DOWNLOAD') file.readOnly = ['Access denied', 'Shareware is played, not changed: its files are read-only.'];
  else file.readOnly = ['Access denied', `${path} is read-only.`];
  return file;
}
