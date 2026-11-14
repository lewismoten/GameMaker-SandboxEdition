// An open project: a game directory plus its .gam, autosaved to IndexedDB.
import { GameFiles, normalize } from '../../project/files';
import { saveProject, newId } from '../../project/storage';
import { libraryDefaultPalette } from '@lewismoten/gamemaker-sandbox-tools/palettes';
import { parseGame, serializeGame, newGame, type Game, gameTitle } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { defaultPalette, parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { debounce } from './ui';
import { isSolidPalette, mostReadable } from './readablePalette';
import { emptyCompanion, getSection, renameInCompanion, setExportPreviews, setMenuVersion, setSection, type Companion } from '../../project/companion';
import { setAbout, type AboutGame } from '../../project/aboutGame';
import { editedFile, unlockAchievement } from '../../achievements';
import { kindOf, KIND_LABELS, type FileKind } from './fileKind';
export { kindOf, KIND_LABELS, type FileKind };
import { MEMORY_SECTIONS, refuse, type ReadOnlyGuard } from './readOnly';

/** Where an autosave is: begun, kept in IndexedDB, or refused (storage full, private mode…). */
type SaveState = 'dirty' | 'saving' | 'saved' | 'failed';

export class Project {
  id: string;
  name: string;
  gam: string;
  readonly files: GameFiles;
  private listeners = new Set<(name: string) => void>();
  private cachedGame?: { bytes: Uint8Array; game: Game };
  saving = Promise.resolve();
  /** Editor-only extras (project/companion.ts); undefined until loaded or first changed (saving then keeps the stored one). */
  companion?: Companion;
  private extrasListeners = new Set<(file: string, section: string) => void>();
  /** Set for a game opened only to look inside (readOnly.ts makeReadOnly): every change is refused before it happens, and nothing is saved. */
  readOnly?: ReadOnlyGuard;
  /** Set by the workspace: play test a level starting at a spot (the map editor's Play here); undefined where nothing can play. */
  playAt?: (scene: number, at: { x: number; y: number }) => void;

  constructor(id: string, name: string, gam: string, files: GameFiles, companion?: Companion) {
    this.id = id;
    this.name = name;
    this.gam = gam;
    this.files = files;
    this.companion = companion;
    files.onChange = (n) => {
      if (!this.readOnly) editedFile(n);
      this.persist();
      for (const l of this.listeners) l(n);
    };
  }

  static create(name: string): Project {
    unlockAchievement('make-new');
    const files = new GameFiles();
    const gam = `${
      normalize(name)
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8) || 'game'
    }.gam`;
    files.set(gam, serializeGame(newGame(name)));
    files.set('default.pal', libraryDefaultPalette());
    return new Project(newId(), name, gam, files);
  }

  static fromFiles(files: GameFiles, name?: string, id = newId(), companion?: Companion): Project {
    let gam = files.mainGame();
    if (!gam) {
      gam = 'game.gam';
      files.set(gam, serializeGame(newGame(name ?? 'My Game')));
    }
    // trimmed: authors padded the name with spaces to center it on the DOS menu
    const title = name?.trim() || gameTitle(parseGame(files.get(gam)!)) || gam;
    return new Project(id, title, gam, files, companion);
  }

  onChange(fn: (name: string) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private saveListeners = new Set<(state: SaveState, error?: Error, savedAt?: Date) => void>();
  private saveState?: { state: SaveState; error?: Error; savedAt?: Date };

  /** Hears each autosave start, finish or failure (the editor's "Saved" note: shell/saveNote.ts). */
  onSaveState(fn: (state: SaveState, error?: Error, savedAt?: Date) => void): () => void {
    this.saveListeners.add(fn);
    if (this.saveState) fn(this.saveState.state, this.saveState.error, this.saveState.savedAt);
    return () => this.saveListeners.delete(fn);
  }

  private tellSave(state: SaveState, error?: Error): void {
    this.saveState = { state, error, savedAt: state === 'saved' ? new Date() : undefined };
    for (const l of this.saveListeners) l(state, error, this.saveState.savedAt);
  }

  private revision = 0;
  private saveRequest = 0;
  private saveQueue = Promise.resolve();
  private persist(): void {
    if (this.readOnly) return;
    this.revision++;
    this.tellSave('dirty');
    this.schedulePersist();
  }

  private schedulePersist = debounce(() => {
    if (this.readOnly) return;
    this.saving = this.writeSave().catch((e: unknown) => console.error('Autosave failed', e));
  }, 400);

  private writeSave(): Promise<void> {
    const revision = this.revision;
    const request = ++this.saveRequest;
    const files = new GameFiles(this.files.entries().map(([name, bytes]) => [name, bytes.slice()]));
    const companion = this.companion ? structuredClone(this.companion) : undefined;
    this.tellSave('saving');
    const write = this.saveQueue.then(() => saveProject(this.id, this.name, this.gam, files, companion));
    this.saveQueue = write.catch(() => undefined);
    return write.then(
      () => {
        if (revision === this.revision && request === this.saveRequest) this.tellSave('saved');
      },
      (e: unknown) => {
        if (revision === this.revision && request === this.saveRequest) this.tellSave('failed', e as Error);
        throw e;
      },
    );
  }

  saveNow(): Promise<void> {
    if (this.readOnly) return this.saving;
    return (this.saving = this.writeSave());
  }

  /** One section of a file's editor-only extras (e.g. the terrains of forest.bbl). */
  extras<T>(file: string, section: string, fallback: T): T {
    return this.companion ? getSection(this.companion, file, section, fallback) : fallback;
  }

  /** Changes one section of a file's extras and autosaves (the game's files are not touched). */
  setExtras(file: string, section: string, value: unknown): void {
    // a look-only game keeps what the Level check finds in memory; anything else is a change
    if (this.readOnly && !MEMORY_SECTIONS.includes(section)) refuse(this, `${file}: ${section}`);
    this.companion ??= emptyCompanion();
    setSection(this.companion, file, section, value);
    this.persist();
    for (const l of this.extrasListeners) l(file, section);
  }

  /** The author's version and whether it is lettered on the menu picture (companion.ts); the game's files are not touched. */
  setMenuVersion(version: string, show: boolean): void {
    if (this.readOnly) refuse(this, 'version');
    this.companion ??= emptyCompanion();
    setMenuVersion(this.companion, version, show);
    this.persist();
  }

  /** Whether the one-page export includes animation and sound previews (companion.ts); the game's files are not touched. */
  setExportPreviews(on: boolean): void {
    if (this.readOnly) refuse(this, 'export');
    this.companion ??= emptyCompanion();
    setExportPreviews(this.companion, on);
    this.persist();
  }

  /** "About this game" (project/aboutGame.ts): editor-only, so the game's files are not touched. */
  setAbout(about: AboutGame): void {
    if (this.readOnly) refuse(this, 'about');
    this.companion ??= emptyCompanion();
    setAbout(this.companion, about);
    this.persist();
  }

  /** A file was renamed: its extras follow it. */
  renameExtras(from: string, to: string): void {
    if (this.readOnly) refuse(this, from);
    if (!this.companion) return;
    renameInCompanion(this.companion, from, to);
    this.persist();
  }

  onExtrasChange(fn: (file: string, section: string) => void): () => void {
    this.extrasListeners.add(fn);
    return () => this.extrasListeners.delete(fn);
  }

  game(): Game {
    const bytes = this.files.get(this.gam)!;
    if (this.cachedGame?.bytes !== bytes) this.cachedGame = { bytes, game: parseGame(bytes) };
    return this.cachedGame.game;
  }

  /** Drops the parsed game, so the next game() reads the .gam again (readOnly.ts restoreFiles). */
  forgetParsed(): void {
    this.cachedGame = undefined;
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
  paletteFor(file: string, used?: ArrayLike<number>): { palette: Palette; source: string } {
    const game = this.game();
    // several scenes may use one file with different palettes: the palette most of them use wins, the first on a tie
    const tally = new Map<string, { n: number; name: string }>();
    // a slot left blank keeps the file of the level scene before it (loadscene's globals), so a scene counts as using what it inherits
    const want = normalize(file);
    const held: string[] = [];
    for (const scene of game.scenes) {
      if (scene.gametype !== 10) continue;
      scene.files.forEach((f, slot) => {
        if (f) held[slot] = f;
      });
      const pal = held[0];
      if (!want || !pal || !this.files.has(pal) || !held.some((f) => f && normalize(f) === want)) continue;
      const hit = tally.get(normalize(pal));
      if (hit) hit.n++;
      else tally.set(normalize(pal), { n: 1, name: pal });
    }
    if (tally.size) {
      const ranked = [...tally.values()].sort((a, b) => b.n - a.n); // stable: the first scene breaks a tie
      // with the sprite's colors known, skip a scene palette that would show it dark on dark
      const i = used
        ? mostReadable(
            ranked.map((t) => this.files.get(t.name)!),
            used,
          )
        : 0;
      return { palette: parsePalette(this.files.get(ranked[i].name)!), source: ranked[i].name };
    }
    // no scene uses the file: the palette the scenes use most (below)
    let pals = this.files.byExtension('pal');
    if (pals.length) {
      // a palette that is one solid color stands for nothing: use the others, the one the scenes use most first
      const usable = pals.filter((p) => !isSolidPalette(this.files.get(p)!));
      if (usable.length) {
        const uses = (p: string) => game.scenes.filter((sc) => normalize(sc.files[0] ?? '') === normalize(p)).length;
        pals = usable
          .map((p, i) => ({ p, i }))
          .sort((a, b) => uses(b.p) - uses(a.p) || a.i - b.i)
          .map((x) => x.p);
      }
      // with the sprite's colors known, skip a palette that would show it dark on dark
      const i = used
        ? mostReadable(
            pals.map((p) => this.files.get(p)!),
            used,
          )
        : 0;
      return { palette: parsePalette(this.files.get(pals[i])!), source: pals[i] };
    }
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

  /**
   * What a preview of `file` is drawn in: the palette the author picked for it ("Show with palette",
   * kept in the companion, restored while that .pal exists), else the scene's (paletteFor).
   */
  shownPalette(file: string, used?: ArrayLike<number>): Palette {
    const saved = this.savedPalette(file);
    return saved ? parsePalette(this.files.get(saved)!) : this.paletteFor(file, used).palette;
  }

  /** The .pal picked for a file that still exists. A map has no picker of its own: it follows its block set's. */
  private savedPalette(file: string): string {
    const keys = [file];
    if (normalize(file).endsWith('.map'))
      for (const u of this.usesOf(file)) {
        const bbl = this.game().scenes[u.scene].files[2];
        if (bbl) keys.push(bbl);
      }
    for (const k of keys) {
      const saved = this.extras<string>(k, 'showPalette', '');
      if (saved && this.files.has(saved)) return saved;
    }
    return '';
  }

  palette(name: string): Palette | undefined {
    const b = this.files.get(name);
    return b ? parsePalette(b) : undefined;
  }

  /** A file name not yet used, e.g. "level2.map". */
  freeName(base: string, ext: string): string {
    const stem =
      base
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 8) || 'new';
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
