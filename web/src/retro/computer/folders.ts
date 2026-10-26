// Game folders on the retro PC's disks: which game is in a folder, making it editable (a
// copy on the hard disk when it comes from a floppy or the CD), new and restored game
// folders, and copying a game to a floppy.
import { dosDirName, hdFiles, hdProject, makeGameFolder, restoreInstalled, type HdGame } from '../dos/hardDisk';
import { type FolderGame } from '../host';
import { errorBox } from '../text/textUi';
import { GameFiles } from '../../project/files';
import { Project } from '../../editor/core/project';
import { download } from '../../editor/core/ui';
import { ComputerDrives } from './drives';
import { dosDir } from '../../project/dosDir';
import { isBizarreGame } from '../../project/bizarre';

export abstract class ComputerFolders extends ComputerDrives {
  /**
   * Set while the desk saves a designer's work for you: nobody is at the keyboard, so a
   * read-only game is copied to the hard disk without asking, and anything else that would
   * ask a question fails instead.
   */
  quiet = false;
  /** Where the last copy to the hard disk went (C:\GM\NAME). */
  copiedTo?: string;

  // Defined by a later layer (see the chain in the header comment).
  abstract writableProject(): Promise<Project | undefined>;

  workDir(): { drive: string; parts: string[] } {
    return { drive: this.shell.drive, parts: this.shell.cwdOf(this.shell.drive) };
  }

  /** The game in a folder (A:\, C:\GM\X, C:\DOWNLOAD\X, D:\GM\X, D:\GAMEWARE\X). */
  async gameIn(drive: string, parts: string[]): Promise<FolderGame | undefined> {
    const path = `${drive}:\\${parts.join('\\')}`;
    this.opts.onDriveAccess?.(drive);
    if (drive === 'A' && !parts.length) {
      const d = this.inserted;
      if (!d || d.disk.kind === 'blank') return undefined;
      return { title: d.disk.title, files: d.files, where: path, kind: 'disk' };
    }
    const [top, dir] = parts;
    if (parts.length !== 2 || !dir) return undefined;
    const cat = await this.catalog();
    if (drive === 'C' && top === 'GM') {
      const g = (await this.hdGames()).find((x) => x.dir === dir);
      return g ? { title: g.title, files: await hdFiles(g), where: path, kind: 'hd', hd: g } : undefined;
    }
    if (drive === 'C' && top === 'DOWNLOAD') {
      const g = cat.find((c) => dosDir(c) === dir && this.downloads.has(c.id));
      if (!g) return undefined;
      const free = isBizarreGame(g) || undefined;
      return {
        title: g.title,
        files: new GameFiles(await this.catalogFiles(g)),
        where: path,
        kind: 'shareware',
        notice: g.notice,
        ...(free ? { free, catalogId: g.id } : {}),
      };
    }
    if (drive === 'D' && this.cdIn && (top === 'GAMEWARE' || top === 'GM')) {
      const g = cat.find((c) => c.kind === 'gameware' && c.id.toUpperCase() === dir);
      return g ? { title: g.title, files: new GameFiles(await this.catalogFiles(g)), where: path, kind: 'cd', catalogId: g.id } : undefined;
    }
    return undefined;
  }

  /** A project for editing the game in a folder: copies read-only games to the hard disk first. */
  async editableGameIn(drive: string, parts: string[]): Promise<Project | undefined> {
    if (drive === 'A') return this.writableProject();
    const g = await this.gameIn(drive, parts);
    if (!g) {
      if (this.quiet) return undefined;
      await errorBox(this, `There is no game in ${drive}:\\${parts.join('\\')}.`, 'Type MD C:\\GM\\NAME at the DOS prompt to make one.  (C)ontinue');
      return undefined;
    }
    if (g.kind === 'hd') return hdProject(g.hd!);
    if (g.kind === 'shareware' && g.free) {
      // free to change: designed from a copy in C:\GM (the download itself stays as it came)
      const gam = g.files.mainGame();
      // a copy made before (here or with Edit a copy on the home page) is opened again
      const mine = (await this.hdGames()).find((x) => x.source === 'project' && x.title === g.title);
      if (mine) {
        this.copiedTo = `C:\\GM\\${mine.dir}`;
        return hdProject(mine);
      }
      return this.copyToHardDisk(g.title, g.files, gam, undefined, `${g.where} is a free download, kept as it came.`);
    }
    if (g.kind === 'shareware') {
      if (this.quiet) return undefined;
      await errorBox(this, `${g.title} is shareware: it can be played, not changed.`, 'Register it with its author!  (C)ontinue');
      return undefined;
    }
    const gam = g.files.mainGame();
    return this.copyToHardDisk(g.title, g.files, gam, g.catalogId, `${g.where} is on the CD-ROM, which can't be changed.`);
  }

  /** Copies a game into C:\GM (or into its installed folder, if it is one of those). */
  protected async copyToHardDisk(
    title: string,
    files: GameFiles,
    gam: string | undefined,
    catalogId: string | undefined,
    why: string,
  ): Promise<Project | undefined> {
    const installed = catalogId ? (await this.hdGames()).find((x) => x.source === 'installed' && x.catalog?.id === catalogId) : undefined;
    const dir = installed?.dir ?? dosDirName(gam ?? title);
    const r = this.quiet ? 'C' : await errorBox(this, why, `(C)opy it to C:\\GM\\${dir} on the hard disk   (E)xit`);
    if (r !== 'C' && r !== 'Enter') return undefined;
    this.copiedTo = `C:\\GM\\${dir}`;
    if (installed) return hdProject(installed);
    const project = Project.fromFiles(new GameFiles(files.entries()), title);
    if (gam) project.gam = gam;
    await project.saveNow();
    this.opts.onDisksChanged?.();
    return project;
  }

  /** MD C:\GM\NAME makes a new game folder; nothing else can be created here. */
  async makeDir(drive: string, parts: string[]): Promise<string | undefined> {
    if (drive !== 'C' || parts.length !== 2 || parts[0] !== 'GM' || !/^[A-Z0-9_]{1,8}$/.test(parts[1])) {
      return 'Unable to create directory (make game folders as C:\\GM\\NAME, up to 8 letters)';
    }
    if ((await this.hdGames()).some((g) => g.dir === parts[1])) return 'Directory already exists';
    await this.newGameFolder(parts[1]);
    return undefined;
  }

  async newGameFolder(dir: string, title?: string): Promise<Project> {
    const p = await makeGameFolder(dir, title ?? dir);
    this.opts.onDisksChanged?.();
    return p;
  }

  async restoreGame(g: HdGame): Promise<void> {
    await restoreInstalled(g);
  }

  /** Utilities > Transfer: puts a stand-alone copy of a game on the blank disk in A:. */
  async transferToFloppy(game: FolderGame): Promise<boolean> {
    const d = this.inserted;
    if (!d) {
      await errorBox(this, "I can't access the disk!  Did you remember to insert one?", 'Put a blank disk from the disk box in drive A:.  (C)ontinue');
      return false;
    }
    if (d.disk.kind !== 'blank') {
      // the game is already read in, so the disk can come out: a blank one from the disk box goes in
      const r = await errorBox(this, `The disk in drive A: (${d.disk.title}) isn't blank.`, '(S)wap in a blank disk from the disk box   (A)bort');
      if (r !== 'S') return false;
    }
    const project = Project.fromFiles(new GameFiles(game.files.entries()), game.title);
    const gam = game.files.mainGame();
    if (gam) project.gam = gam;
    await project.saveNow();
    await this.swapInProject(project);
    const r = await errorBox(this, 'Transfer Done!', '(D)ownload it too, to run in DOSBox   (C)ontinue');
    if (r === 'D' && gam) {
      try {
        const { name, zip } = await (await import('../../export/exportDos')).exportDos(project.files, { title: game.title, gam });
        download(name, zip, 'application/zip');
      } catch (e) {
        await errorBox(this, (e as Error).message.slice(0, 70), '(C)ontinue');
      }
    }
    return true;
  }

  protected async swapInProject(project: Project): Promise<void> {
    this.inserted = {
      disk: {
        id: `project:${project.id}`,
        kind: 'project',
        title: project.name,
        label: project.name,
        color: '#d8d2c0',
        stripe: '#1565c0',
        density: 'HD',
        gam: project.gam,
        bytes: 0,
        writeProtected: false,
        projectId: project.id,
        load: async () => project.files,
      },
      files: project.files,
    };
    this.opts.onDisksChanged?.(`project:${project.id}`);
  }
}
