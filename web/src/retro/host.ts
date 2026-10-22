// What programs running on the retro PC (Game-Maker, the BBS terminal, games) can use.
import type { Vga } from '../vga/shared/vga';
import type { Ui } from './text/textUi';
import type { Disk } from './dos/disks';
import type { GameFiles, CatalogEntry } from '../project/files';
import type { Project } from '../editor/core/project';
import type { FileSystem } from './dos/vfs';
import type { HdGame } from './dos/hardDisk';
import type { WorkArea } from './dos/workArea';
import type { PictureScreen } from './view/picture';

/**
 * A ported designer with work open. The desk asks it whether anything is unsaved before
 * it stops Game-Maker (to play a game, say), and saves it if you want.
 */
export interface OpenDesigner {
  /** "Palette Designer" */
  title: string;
  readonly saved: boolean;
  /** Where its files are (the game area) and the file being edited (curfile). */
  work: WorkArea;
  /** What saving writes: the work, one file per extension. */
  contents(): { ext: string; bytes: Uint8Array }[];
}

/** A game found in a folder on one of the PC's drives. */
export interface FolderGame {
  title: string;
  files: GameFiles;
  /** e.g. C:\GM\SAMPLE */
  where: string;
  kind: 'disk' | 'hd' | 'cd' | 'shareware';
  hd?: HdGame;
  catalogId?: string;
  notice?: string;
}

export interface InsertedDisk {
  disk: Disk;
  files: GameFiles;
}

export interface RetroHost extends Ui {
  /** The disk in drive A:, if any. */
  disk(): InsertedDisk | undefined;
  /**
   * The project behind the disk in drive A:, ready for editing. Formats blank disks
   * and offers to copy write-protected originals. Undefined if the user declined.
   */
  writableProject(): Promise<Project | undefined>;
  /** Switches to 320x200 VGA graphics (mode 13h) for a designer. */
  graphMode(): Vga;
  /** Back to text mode, with a blank screen. */
  textMode(): void;
  /** Switches to a 256-color graphics mode (320x200 or 640x400) for showing a picture. */
  pictureMode(width: number, height: number): PictureScreen;
  /** Back to text mode from pictureMode, with the text screen as it was. */
  leavePictureMode(): void;
  /** Shows a graphic editor on the monitor; resolves when the user leaves it. */
  openEditor(project: Project, file: string, program: string): Promise<void>;
  /** Plays a game on the monitor; resolves when the player quits. */
  playGame(files: GameFiles, gam: string, title: string, notice?: string): Promise<void>;
  /** Leaves the 90s desk for today's web editor. */
  openModern(projectId: string, file?: string): void;
  /** A file from the installed C:\GM (help screens). */
  gmFile(name: string): Promise<Uint8Array | undefined>;
  catalog(): Promise<CatalogEntry[]>;
  /** Shareware downloaded from the BBS into C:\DOWNLOAD. */
  downloads: Downloads;
  /** The ported designer running, if any (vga/*.ts set it; Computer.run clears it). */
  designer?: OpenDesigner;
  /** Unlocked Web Audio context for modem sounds. */
  audio(): AudioContext | undefined;
  /** False when TURBO is off and the PC runs like a 286. */
  turbo(): boolean;
  fs: FileSystem;
  /** The DOS prompt's current folder (Game-Maker's starting game area). */
  workDir(): { drive: string; parts: string[] };
  gameIn(drive: string, parts: string[]): Promise<FolderGame | undefined>;
  editableGameIn(drive: string, parts: string[]): Promise<Project | undefined>;
  newGameFolder(dir: string, title?: string): Promise<Project>;
  hdGames(): Promise<HdGame[]>;
  restoreGame(g: HdGame): Promise<void>;
  transferToFloppy(game: FolderGame): Promise<boolean>;
}

const KEY = 'gm-bbs-downloads';
/** Files DEL took out of a download's folder ("id/NAME"), and folders made on C: ("IMAGES"). */
const DELETED = 'gm-bbs-deleted';
const DIRS = 'gm-dos-dirs';

function load(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch {
    return new Set(); // private mode
  }
}

function save(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* private mode */
  }
}

/**
 * What the BBS downloaded to C: (shareware ids and picture names), kept in the browser:
 * DEL takes files out again, RD the folders.
 */
export class Downloads {
  private ids = load(KEY);
  private deleted = load(DELETED);
  private dirs = load(DIRS);
  onChange?: () => void;

  has(id: string): boolean {
    return this.ids.has(id);
  }

  list(): string[] {
    return [...this.ids];
  }

  add(id: string): void {
    this.ids.add(id);
    // downloading again brings back every file of it
    for (const d of this.deleted) if (d.startsWith(`${id}/`)) this.deleted.delete(d);
    this.persist();
  }

  /** Forgets a download (DEL of a picture, RD of an emptied shareware folder). */
  remove(id: string): void {
    this.ids.delete(id);
    for (const d of this.deleted) if (d.startsWith(`${id}/`)) this.deleted.delete(d);
    this.persist();
  }

  /** DEL of one file in a download's folder. */
  deleteFile(id: string, name: string): void {
    this.deleted.add(`${id}/${name}`);
    this.persist();
  }

  isDeleted(id: string, name: string): boolean {
    return this.deleted.has(`${id}/${name}`);
  }

  /** A folder made on C: (C:\IMAGES on the first picture), until RD removes it. */
  hasDir(name: string): boolean {
    return this.dirs.has(name);
  }

  setDir(name: string, made: boolean): void {
    if (made) this.dirs.add(name);
    else this.dirs.delete(name);
    this.persist();
  }

  private persist(): void {
    save(KEY, this.ids);
    save(DELETED, this.deleted);
    save(DIRS, this.dirs);
    this.onChange?.();
  }
}
