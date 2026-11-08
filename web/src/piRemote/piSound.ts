// "Pi sound": plays the Pi's sound events (soundLine.ts) on this computer with the site's own
// audio engine, from the site's copy of the game's files, the way the web player plays them
// (engine/scene.ts attachSound, engine/game.ts PlaySong): a .CMF through the OPL2 synth, a
// .VOC clip, or a PC speaker tune from the level's .SND. It follows the visitor's volume and
// sound settings (the engine's output and mix). Nothing is streamed from the Pi.
import { parseSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import type { SoundEvent } from './soundLine';
import { findSiteGame, type SiteGame } from './soundGame';

/** What PiSound needs of AudioEngine (engine/src/audio/engine.ts). */
export interface SoundOut {
  playSong(bytes: Uint8Array | undefined): Promise<boolean>;
  stopSong(): void;
  playVoc(bytes: Uint8Array | undefined): boolean;
  playSpeaker(freqs: ArrayLike<number>): void;
  stopAll(): void;
}

/** Where the site's games and their files come from (project/files.ts in the page). */
export interface SoundSource<G extends SiteGame = SiteGame> {
  games(): Promise<readonly G[]>;
  file(game: G, name: string): Promise<Uint8Array | undefined>;
}

/** What the switch's line says: none yet, playing a game, or a game the site does not have. */
export type SoundState = { kind: 'waiting' } | { kind: 'playing'; title: string } | { kind: 'unknown' };

export class PiSound<G extends SiteGame = SiteGame> {
  private game?: Promise<G | undefined>;
  private files = new Map<string, Promise<Uint8Array | undefined>>();
  private sets = new Map<string, Promise<SoundSet | undefined>>();
  /** Counts songs asked for: a song still loading is dropped once a newer one (or a stop) comes. */
  private songs = 0;
  /** Counts effects: an effect whose file arrives after a newer effect is dropped. */
  private effects = 0;

  constructor(
    private readonly out: SoundOut,
    private readonly source: SoundSource<G>,
    private readonly onState: (s: SoundState) => void = () => undefined,
    /** Each sound as it starts ("music DICE.CMF", "voc JUMP.VOC", "beep DICE.SND 9", "stop"): for a log or a check. */
    private readonly onPlay: (what: string) => void = () => undefined,
  ) {}

  /** One event from the Pi. Resolves once its sound has started (or was dropped). */
  async handle(e: SoundEvent): Promise<void> {
    switch (e.kind) {
      case 'game':
        return this.startGame(e.dir, e.gam);
      case 'end':
      case 'stopAll':
        this.stop();
        if (e.kind === 'end') {
          this.game = undefined;
          this.files.clear();
          this.sets.clear();
          this.onState({ kind: 'waiting' });
        }
        return;
      case 'musicStop':
        this.songs++;
        this.out.stopSong();
        this.onPlay('music stop');
        return;
      case 'music': {
        const song = ++this.songs;
        const bytes = await this.fileOf(e.file);
        if (song !== this.songs || !bytes) return;
        this.onPlay(`music ${e.file}`);
        await this.out.playSong(bytes);
        return;
      }
      case 'voc': {
        const fx = ++this.effects;
        const bytes = await this.fileOf(e.file);
        if (fx !== this.effects || !bytes) return;
        this.onPlay(`voc ${e.file}`);
        this.out.playVoc(bytes);
        return;
      }
      case 'beep': {
        const fx = ++this.effects;
        const set = await this.setOf(e.file);
        const freqs = set?.freqs[e.effect];
        if (fx !== this.effects || !freqs) return;
        this.onPlay(`beep ${e.file} ${e.effect}`);
        this.out.playSpeaker(freqs);
        return;
      }
    }
  }

  /** Everything stops (the switch off, the port closed); the game is remembered. */
  stop(): void {
    this.songs++;
    this.effects++;
    this.out.stopAll();
    this.onPlay('stop');
  }

  private async startGame(dir: string, gam: string): Promise<void> {
    this.stop();
    this.files.clear();
    this.sets.clear();
    const game = this.source.games().then(
      (list) => findSiteGame(list, dir, gam),
      () => undefined,
    );
    this.game = game;
    const g = await game;
    if (this.game !== game) return;
    this.onState(g ? { kind: 'playing', title: g.title } : { kind: 'unknown' });
  }

  private fileOf(name: string): Promise<Uint8Array | undefined> {
    const game = this.game;
    if (!game) return Promise.resolve(undefined);
    const key = name.toLowerCase();
    let p = this.files.get(key);
    if (!p) {
      p = game.then((g) => (g ? this.source.file(g, name) : undefined)).catch(() => undefined);
      this.files.set(key, p);
    }
    return p;
  }

  private setOf(name: string): Promise<SoundSet | undefined> {
    const key = name.toLowerCase();
    let p = this.sets.get(key);
    if (!p) {
      p = this.fileOf(name).then((b) => {
        if (!b) return undefined;
        try {
          return parseSoundSet(b);
        } catch {
          return undefined;
        }
      });
      this.sets.set(key, p);
    }
    return p;
  }
}
