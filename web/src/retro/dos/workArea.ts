// The designers' file handling in text mode (WINDIO.C's loadany, saveany and delany):
// files are read from and written to the game area, a game folder such as C:\GM\SAMPLE.
import type { RetroHost } from '../host';
import { browseFile, type Picked } from './picker';
import { errorBox } from '../text/textUi';
import { gameArea } from '../gm';
import type { Project } from '../../editor/core/project';

type Folder = { drive: string; parts: string[] };

export class WorkArea {
  /** The folder files were last loaded from or saved to. */
  folder: Folder;
  /** The file being edited (curfile), lower case, or ''. */
  curfile = '';
  private project?: Project;

  constructor(private h: RetroHost) {
    this.folder = gameArea(h);
  }

  private async pick(question: string, ext: string, allowNew: boolean): Promise<Picked | null> {
    const picked = await browseFile(this.h, this.h.fs, question, [ext], this.folder, { allowNew });
    if (!picked) return null;
    if (picked.drive === 'C' && picked.parts.length < 2) {
      await errorBox(this.h, 'Choose a game folder first (such as SAMPLE\\).', '(C)ontinue');
      return null;
    }
    return picked;
  }

  /** loadany: picks a file and returns its bytes. */
  async load(question: string, ext: string): Promise<Uint8Array | null> {
    const picked = await this.pick(question, ext, false);
    if (!picked) return null;
    const game = await this.h.gameIn(picked.drive, picked.parts);
    const bytes = game?.files.get(picked.name);
    if (!bytes) {
      await errorBox(this.h, `I can't find ${picked.name.toUpperCase()}!`, '(C)ontinue');
      return null;
    }
    this.useFolder(picked);
    this.curfile = picked.name.toLowerCase();
    return bytes;
  }

  /** saveany: asks for a name (offering the current one) and writes the file. */
  async save(question: string, ext: string, bytes: Uint8Array): Promise<boolean> {
    const picked = await this.pick(question, ext, true);
    if (!picked) return false;
    let name = picked.name.toLowerCase();
    if (!name.includes('.')) name += `.${ext}`;
    if (!/^[a-z0-9_$~!#%&-]{1,8}\.[a-z0-9]{1,3}$/.test(name)) {
      await errorBox(this.h, `${name.toUpperCase()} is not a DOS file name.`, '(C)ontinue');
      return false;
    }
    if (picked.exists && name !== this.curfile) {
      const r = await errorBox(this.h, `${name.toUpperCase()} already exists.  Write over it?`, '(Y)es  (N)o');
      if (r !== 'Y') return false;
    }
    const project = await this.writable(picked);
    if (!project) return false;
    project.files.set(name, bytes);
    await project.saveNow();
    this.curfile = name;
    return true;
  }

  /** Writes a file by name into the current game folder (fopen/fwrite). */
  async write(name: string, bytes: Uint8Array): Promise<boolean> {
    const project = await this.writable(this.folder);
    if (!project) return false;
    project.files.set(name.toLowerCase(), bytes);
    await project.saveNow();
    return true;
  }

  /** A file in the current game folder, if it is there. */
  async read(name: string): Promise<Uint8Array | undefined> {
    return (await this.h.gameIn(this.folder.drive, this.folder.parts))?.files.get(name);
  }

  /** delany */
  async remove(question: string, ext: string): Promise<boolean> {
    const picked = await this.pick(question, ext, false);
    if (!picked) return false;
    const name = picked.name.toLowerCase();
    const r = await errorBox(this.h, `Really delete ${name.toUpperCase()}?`, '(Y)es  (N)o');
    if (r !== 'Y') return false;
    const project = await this.writable(picked);
    if (!project) return false;
    project.files.delete(name);
    await project.saveNow();
    if (this.curfile === name) this.curfile = '';
    return true;
  }

  /** The project behind a folder, copied to the hard disk first if it is read-only. */
  private async writable(at: Folder): Promise<Project | undefined> {
    this.useFolder(at); // forgets the project if the folder changed
    this.project ??= await this.h.editableGameIn(at.drive, at.parts);
    return this.project;
  }

  private useFolder(at: Folder): void {
    if (at.drive !== this.folder.drive || at.parts.join('\\') !== this.folder.parts.join('\\')) this.project = undefined;
    this.folder = { drive: at.drive, parts: [...at.parts] };
  }
}
