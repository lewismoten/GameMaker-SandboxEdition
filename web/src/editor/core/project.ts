// An open project: a game directory plus its .gam, autosaved to IndexedDB.
import { GameFiles, normalize } from '../../project/files';
import { saveProject, newId } from '../../project/storage';
import { parseGame, serializeGame, newGame, type Game } from '../../formats/game';
import { defaultPalette, parsePalette, type Palette } from '../../formats/palette';
import { decodeGif, isGif } from '../../formats/gif';
import { debounce } from './ui';
import { editedFile, unlockAchievement } from '../../achievements';

export type FileKind = 'gam' | 'pal' | 'bbl' | 'mbl' | 'cbl' | 'mon' | 'chr' | 'map' | 'snd' | 'gif' | 'fli' | 'bkd' | 'txt' | 'lst' | 'cmf' | 'voc' | 'rec' | 'his' | 'other';

export const KIND_LABELS: Record<FileKind, string> = {
  gam: 'Game (integrator)',
  pal: 'Palettes',
  bbl: 'Background blocks',
  mbl: 'Monster blocks',
  cbl: 'Character blocks',
  mon: 'Monsters',
  chr: 'Characters',
  map: 'Maps',
  snd: 'Sound sets',
  gif: 'Pictures',
  fli: 'Animations',
  bkd: 'Backdrops',
  txt: 'Text screens',
  lst: 'Slide shows',
  cmf: 'Music',
  voc: 'Digital sounds',
  rec: 'Demo recordings',
  his: 'High scores',
  other: 'Other files',
};

export function kindOf(name: string): FileKind {
  const ext = (/\.([^.]+)$/.exec(name)?.[1] ?? '').toLowerCase();
  return (ext in KIND_LABELS ? ext : 'other') as FileKind;
}

export class Project {
  id: string;
  name: string;
  gam: string;
  readonly files: GameFiles;
  private listeners = new Set<(name: string) => void>();
  private cachedGame?: { bytes: Uint8Array; game: Game };
  saving = Promise.resolve();

  constructor(id: string, name: string, gam: string, files: GameFiles) {
    this.id = id;
    this.name = name;
    this.gam = gam;
    this.files = files;
    files.onChange = (n) => {
      editedFile(n);
      this.persist();
      for (const l of this.listeners) l(n);
    };
  }

  static create(name: string): Project {
    unlockAchievement('make-new');
    const files = new GameFiles();
    const gam = `${normalize(name).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'game'}.gam`;
    files.set(gam, serializeGame(newGame(name)));
    return new Project(newId(), name, gam, files);
  }

  static fromFiles(files: GameFiles, name?: string, id = newId()): Project {
    let gam = files.mainGame();
    if (!gam) {
      gam = 'game.gam';
      files.set(gam, serializeGame(newGame(name ?? 'My Game')));
    }
    const title = name ?? (parseGame(files.get(gam)!).scenes[0]?.desc || gam);
    return new Project(id, title, gam, files);
  }

  onChange(fn: (name: string) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private persist = debounce(() => {
    this.saving = saveProject(this.id, this.name, this.gam, this.files).catch((e) => console.error('Autosave failed', e));
  }, 400);

  saveNow(): Promise<void> {
    this.saving = saveProject(this.id, this.name, this.gam, this.files);
    return this.saving;
  }

  game(): Game {
    const bytes = this.files.get(this.gam)!;
    if (this.cachedGame?.bytes !== bytes) this.cachedGame = { bytes, game: parseGame(bytes) };
    return this.cachedGame.game;
  }

  saveGame(game: Game): void {
    const bytes = serializeGame(game);
    this.cachedGame = { bytes, game };
    this.files.set(this.gam, bytes);
  }

  /** Scenes and slots that reference a file. */
  usesOf(file: string): { scene: number; slot: number }[] {
    const n = normalize(file);
    const out: { scene: number; slot: number }[] = [];
    this.game().scenes.forEach((s, i) => s.files.forEach((f, slot) => normalize(f) === n && f && out.push({ scene: i, slot })));
    return out;
  }

  /** The palette a block set/map/picture is shown with: the scene that uses it, else the first .pal. */
  paletteFor(file: string): { palette: Palette; source: string } {
    const game = this.game();
    for (const u of this.usesOf(file)) {
      const scene = game.scenes[u.scene];
      if (scene.gametype === 10 && scene.files[0] && this.files.has(scene.files[0]))
        return { palette: parsePalette(this.files.get(scene.files[0])!), source: scene.files[0] };
    }
    // A map: the scene that uses its block set.
    const pals = this.files.byExtension('pal');
    if (pals.length) return { palette: parsePalette(this.files.get(pals[0])!), source: pals[0] };
    for (const g of this.files.byExtension('gif')) {
      const b = this.files.get(g)!;
      if (isGif(b)) {
        try {
          return { palette: decodeGif(b).palette, source: g };
        } catch {
          /* try the next one */
        }
      }
    }
    return { palette: defaultPalette(), source: 'default' };
  }

  palette(name: string): Palette | undefined {
    const b = this.files.get(name);
    return b ? parsePalette(b) : undefined;
  }

  /** A file name not yet used, e.g. "level2.map". */
  freeName(base: string, ext: string): string {
    const stem = base.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 8) || 'new';
    if (!this.files.has(`${stem}.${ext}`)) return `${stem}.${ext}`;
    for (let i = 1; i < 1000; i++) {
      const s = `${stem.slice(0, 8 - String(i).length)}${i}`;
      if (!this.files.has(`${s}.${ext}`)) return `${s}.${ext}`;
    }
    return `${newId().slice(0, 8)}.${ext}`;
  }
}

/** DOS 8.3 file name check. */
export function validDosName(name: string): boolean {
  return /^[a-z0-9_\-~!@#$%^&()]{1,8}\.[a-z0-9]{1,3}$/i.test(name);
}
