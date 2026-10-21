// What programs running on the retro PC (Game-Maker, the BBS terminal, games) can use.
import type { Vga } from '../vga/shared/vga';
import type { Ui } from './text/textUi';
import type { Disk } from './dos/disks';
import type { GameFiles, CatalogEntry } from '../project/files';
import type { Project } from '../editor/core/project';
import type { FileSystem } from './dos/vfs';
import type { HdGame } from './dos/hardDisk';
import type { WorkArea } from './dos/workArea';

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

export class Downloads {
  private ids = new Set<string>();
  onChange?: () => void;

  constructor() {
    try {
      for (const id of JSON.parse(localStorage.getItem(KEY) ?? '[]')) this.ids.add(id);
    } catch {
      /* private mode */
    }
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  list(): string[] {
    return [...this.ids];
  }

  add(id: string): void {
    this.ids.add(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...this.ids]));
    } catch {
      /* private mode */
    }
    this.onChange?.();
  }
}
