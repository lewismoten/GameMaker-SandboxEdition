// Demo previews: a game's title-screen demo (.REC, start scene slot 11) playing inside a
// small screen on the page, such as a home page card or the selected game. Only one plays
// at a time: it stops when another starts, when it scrolls out of view, or when the
// recording runs out. It starts silent; the sound can be turned on (and stays on for the
// next preview until it is turned off).
import { AudioEngine } from '../audio/engine';
import { getVolume, output } from '../audio/output';
import { parseGame } from '../formats/game';
import type { Session } from '../engine/scene';
import { mountPlayer, type PlayerHandle } from '../player/player';
import { cdName, fetchGameFile, type CatalogEntry, type GameFiles } from '../project/files';
import { recordingTicks, titleDemo, withoutOpening } from './demo';

/** The demo file the title scene names, when it is one of the game's files (any case, or its CD name). */
export function demoFileName(gam: Uint8Array, files: readonly string[]): string | undefined {
  try {
    const name = parseGame(gam).scenes[0]?.files[11]?.trim();
    if (!name) return undefined;
    const wanted = [name.toLowerCase(), cdName(name)];
    return files.find((f) => wanted.includes(f.toLowerCase()));
  } catch {
    return undefined;
  }
}

const catalogDemos = new Map<string, Promise<boolean>>();

/** Whether a CD game has a title demo: reads only its .gam (through the shared file cache). */
export function catalogHasDemo(g: CatalogEntry, base = './'): Promise<boolean> {
  if (!g.gam) return Promise.resolve(false);
  let known = catalogDemos.get(g.id);
  if (!known) {
    known = fetchGameFile(g, g.gam, base)
      .then((gam) => !!gam && !!demoFileName(gam, g.files))
      .catch(() => false);
    catalogDemos.set(g.id, known);
  }
  return known;
}

/** Whether a game's files hold a title demo. */
export function filesHaveDemo(files: GameFiles, gam: string | null | undefined): boolean {
  return !!gam && !!titleDemo(files, gam);
}

/** True once the visitor has clicked or typed on the page: sound may start without asking. */
const mayPlaySound = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;

let soundOn = false;

/** Sound that can be silenced, and that never asks the browser for audio before the visitor has used the page. */
class PreviewAudio extends AudioEngine {
  constructor(public muted: boolean) {
    super();
  }

  override async resume(): Promise<void> {
    if (this.muted && !this.context && !mayPlaySound()) return;
    await super.resume();
    this.applyMute();
  }

  applyMute(): void {
    const ctx = this.context;
    if (ctx) (output(ctx) as GainNode).gain.value = this.muted ? 0 : getVolume();
  }
}

export interface DemoPreview {
  readonly muted: boolean;
  /** Turns the sound on or off (starting over, with its music, if no sound was allowed when it began). */
  setMuted(muted: boolean): void;
  stop(): void;
}

export interface DemoPreviewOptions {
  title: string;
  /** Start with sound (defaults to the last choice on this page, silent at first). */
  muted?: boolean;
  /** Play again from the start when the recording runs out. */
  loop?: boolean;
  /** Called once when it stops: ended, scrolled away, replaced by another or stopped. */
  onStop?: () => void;
}

let current: { stop(): void } | undefined;

/** Stops the demo preview playing on the page, if any. */
export function stopDemoPreview(): void {
  current?.stop();
}

/** Plays the title demo in `host` (sized by the page); returns undefined when the game has none. */
export function playDemoPreview(host: HTMLElement, files: GameFiles, gam: string, o: DemoPreviewOptions): DemoPreview | undefined {
  const rec = titleDemo(files, gam);
  if (!rec) return undefined;
  current?.stop();
  const lastTick = recordingTicks(rec);
  const game = withoutOpening(files, gam);
  let muted = o.muted ?? !soundOn;
  let audio: PreviewAudio;
  let player: PlayerHandle | undefined;
  let session: Session | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    player?.stop();
    session = undefined;
    audio = new PreviewAudio(muted);
    let played = false;
    let endedAt = 0;
    const p = mountPlayer(host, game, gam, { title: o.title, playback: rec, preview: true, audio, onSession: (s) => (session = s) });
    player = p;
    clearInterval(timer);
    // A second after the last recorded key (or once the playback is over) the demo is done.
    timer = setInterval(() => {
      const playing = !!session?.rec.playing;
      if (playing) played = true;
      const over =
        (playing && session!.rec.tick >= lastTick + 18) || (played && !playing && (endedAt ||= performance.now()) && performance.now() - endedAt > 1000);
      if (!over) return;
      if (o.loop) start();
      else handle.stop();
    }, 250);
    void p.done.then(() => player === p && !o.loop && handle.stop());
  };

  // Scrolled out of sight: stop (the card shows its picture again).
  const seen = new IntersectionObserver((entries) => {
    if (entries.some((e) => !e.isIntersecting)) handle.stop();
  });

  const handle: DemoPreview = {
    get muted() {
      return muted;
    },
    setMuted(m: boolean) {
      muted = m;
      soundOn = !m;
      audio.muted = m;
      // Sound held back until the visitor used the page: start over so the music plays too.
      if (!m && !audio.context) start();
      else audio.applyMute();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      if (current === entry) current = undefined;
      clearInterval(timer);
      seen.disconnect();
      player?.stop();
      host.replaceChildren();
      host.classList.remove('gm-player', 'gm-preview');
      o.onStop?.();
    },
  };
  const entry = { stop: () => handle.stop() };
  current = entry;
  start();
  // after the first layout, so a preview just placed counts as in view
  requestAnimationFrame(() => !stopped && seen.observe(host));
  return handle;
}
