// Files the BBS and GMCRACK add to the desk PC's C: drive (retro/computer/drives.ts lists
// them): FILE_ID.DIZ beside every download, the Warez area's releases in C:\DOWNLOAD, a
// cracked game's .EXE and .BAK, and C:\GM\PLAYGAME.REG.
import { deskDate, file, DOS_DATE, type DosNode, type ProgramRef } from '../dos/vfs';
import type { Downloads } from '../host';
import type { CatalogEntry } from '../../project/files';
import { DIZ_NAME, dizBytes, gameDiz, newestPicture, pictureDiz } from '../bbs/fileId';
import { WAREZ, fileSize, textBytes } from '../bbs/warezArea';
import { pcExtras } from './pcExtras';
import { bakName } from './gmcrackText';

const bytesNode = (name: string, bytes: Uint8Array, extra: Partial<DosNode> = {}): DosNode => file(name, bytes.length, { read: async () => bytes, ...extra });

/** The original .EXE's size, and how much GMCRACK's patch (with its intro) adds. */
const EXE_SIZE = 155_156;
const INTRO_SIZE = 3_417;

/**
 * A shareware game's .EXE in C:\DOWNLOAD\<GAME>, and what else its folder holds besides the
 * game's files: FILE_ID.DIZ, and GAME.BAK once GMCRACK has cracked it.
 */
export function gameDownloadNodes(g: CatalogEntry, date: Date, run: ProgramRef & { kind: 'game' }): DosNode[] {
  const cracked = pcExtras().cracked(g.id);
  const nodes: DosNode[] = [];
  if (g.exe) {
    if (cracked === undefined) nodes.push(file(g.exe, EXE_SIZE, { date, run }));
    else {
      // the "patched" .EXE: the group's intro before the game
      nodes.push(file(g.exe, EXE_SIZE + INTRO_SIZE, { date: deskDate(cracked), run: { ...run, notice: undefined, cracked: g.exe.toUpperCase() } }));
      nodes.push(file(bakName(g.exe), EXE_SIZE, { date }));
    }
  }
  nodes.push(bytesNode(DIZ_NAME, dizBytes(gameDiz(g)), { date }));
  return nodes;
}

/** The Warez area's downloads, as folders in C:\DOWNLOAD (DEL and RD work as for games). */
export function utilityFolders(dl: Downloads, liveFolder: (name: string, list: () => DosNode[], date?: Date) => DosNode): DosNode[] {
  return WAREZ.filter((u) => dl.has(u.id)).map((u) => {
    const date = dl.date(u.id) ?? DOS_DATE;
    const node = liveFolder(
      u.id,
      () =>
        [
          ...u.files.map((f) => (f.text ? bytesNode(f.name, textBytes(f.text), { date }) : file(f.name, fileSize(f), { date, run: f.run }))),
          bytesNode(DIZ_NAME, dizBytes(u.diz), { date }),
        ]
          .filter((n) => !dl.isDeleted(u.id, n.name))
          .map((n) => Object.assign(n, { remove: () => dl.deleteFile(u.id, n.name) })),
      date,
    );
    node.remove = () => dl.remove(u.id);
    return node;
  });
}

/** C:\IMAGES\FILE_ID.DIZ: the newest picture's (each unzip wrote over the one before). */
export async function imagesDiz(dl: Downloads): Promise<DosNode[]> {
  // (the gallery's picture decoders load with it, so only when C:\IMAGES is listed)
  const { GALLERY } = await import('../bbs/gallery');
  const got = GALLERY.filter((f) => dl.has(f.name));
  const newest = newestPicture(got, (n) => dl.date(n)?.getTime());
  if (!newest || dl.isDeleted(newest.name, DIZ_NAME)) return [];
  return [bytesNode(DIZ_NAME, dizBytes(pictureDiz(newest)), { date: dl.date(newest.name), remove: () => dl.deleteFile(newest.name, DIZ_NAME) })];
}

/** C:\GM\PLAYGAME.REG, which CHK.EXE reads as GM starts (DEL it, and GM won't start). */
export async function playgameReg(): Promise<DosNode[]> {
  const store = pcExtras();
  await store.ready;
  const reg = store.reg;
  if (reg === null) return [];
  const bytes = Uint8Array.from(reg, (c) => c.charCodeAt(0) & 255);
  return [bytesNode('PLAYGAME.REG', bytes, { remove: () => store.setReg(null) })];
}

/** Waits for the stored record, so the first DIR shows cracked games as they are. */
export const deskFilesReady = (): Promise<void> => pcExtras().ready;
