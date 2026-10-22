// Demo previews: a game's title-screen demo (.REC, start scene slot 11) playing inside a
// small screen on the page, such as a home page card or the selected game. Only one plays
// at a time: it stops when another starts, when it scrolls out of view, or when the
// recording runs out. It plays with the demos' sound choice (demoAudio.ts: None, Sound
// Blaster or PC speaker), silent until the visitor has used the page.
//
// A game without a title demo can still show one: a CD game may have a demo added for this
// edition (extraDemos.ts, kept apart from its files), and any other game an "attract
// mode" (attractDemo.ts) that walks its hero back and forth. `kind` tells them apart so the
// page can say which it is.
import { DemoAudioEngine, demoAudio, onDemoAudio, type DemoAudio } from './demoAudio';
import { parseGame } from '../formats/game';
import type { Session } from '../engine/scene';
import { mountPlayer, type PlayerHandle } from '../player/player';
import { cdName, fetchGameFile, type CatalogEntry, type GameFiles } from '../project/files';
import { recordingTicks, titleDemo, withoutOpening } from './demo';
import { attractRecording } from './attractDemo';
import { ADDED_DEMO_NOTICE, extraDemoFor, extraDemoForGam, extraDemosLoaded, fetchExtraDemo, loadExtraDemos, type ExtraDemo } from './extraDemos';

/** The game's own title demo, one added for this edition, or a made-up walk about. */
export type DemoKind = 'recorded' | 'added' | 'attract';

/** What the page can say about each kind of preview. */
export const DEMO_KIND_LABEL: Record<DemoKind, string> = {
  recorded: 'Demo',
  added: ADDED_DEMO_NOTICE,
  attract: 'Preview — not a recorded demo',
};

/** The short note shown over a preview that is not the game's own demo. */
export const DEMO_KIND_TAG: Record<DemoKind, string> = {
  recorded: '',
  added: 'Added demo · not in the original game',
  attract: 'Preview · not a recorded demo',
};

// the index is small: fetched early, so a preview can tell at once whether a demo was added
if (typeof window !== 'undefined') void loadExtraDemos();

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

const catalogDemos = new Map<string, Promise<DemoKind | undefined>>();

/**
 * What a CD game's preview plays: its own title demo, one added for this edition, or the
 * attract mode (undefined without a game file). Reads only its .gam (through the shared
 * file cache); an added demo's recording is fetched ahead, ready to play.
 */
export function catalogDemoKind(g: CatalogEntry, base = './'): Promise<DemoKind | undefined> {
  if (!g.gam) return Promise.resolve(undefined);
  let known = catalogDemos.get(g.id);
  if (!known) {
    known = fetchGameFile(g, g.gam, base)
      .then(async (gam): Promise<DemoKind | undefined> => {
        if (!gam) return undefined;
        if (demoFileName(gam, g.files)) return 'recorded';
        const extra = extraDemoForGam(await loadExtraDemos(base), gam);
        if (extra && (await fetchExtraDemo(extra, g, base))) return 'added';
        return 'attract';
      })
      .catch(() => undefined);
    catalogDemos.set(g.id, known);
  }
  return known;
}

/** Whether a CD game has a demo recording to play: its own title demo, or one added for this edition. */
export async function catalogHasDemo(g: CatalogEntry, base = './'): Promise<boolean> {
  const kind = await catalogDemoKind(g, base);
  return kind === 'recorded' || kind === 'added';
}

/** The demo added for this edition for a CD game, if any (whatever its files are now). */
export async function catalogExtraDemo(g: Pick<CatalogEntry, 'id'>, base = './'): Promise<ExtraDemo | undefined> {
  return extraDemoFor(await loadExtraDemos(base), g.id);
}

/** Whether a game's files hold a title demo. */
export function filesHaveDemo(files: GameFiles, gam: string | null | undefined): boolean {
  return !!gam && !!titleDemo(files, gam);
}

/**
 * What a preview of these files plays: their title demo, a demo added for the CD game they
 * still are (same .gam), or the attract mode when the hero has keys to walk with.
 */
export async function filesDemoKind(files: GameFiles, gam: string | null | undefined): Promise<DemoKind | undefined> {
  if (!gam) return undefined;
  if (titleDemo(files, gam)) return 'recorded';
  if (extraDemoForGam(await loadExtraDemos(), files.get(gam))) return 'added';
  return attractRecording(files, gam) ? 'attract' : undefined;
}

interface DemoSource {
  kind: DemoKind;
  rec: Uint8Array;
  /** An added demo that is the game's own recording (one its title screen does not name). */
  inGame?: boolean;
}

/** The tag over a game's own recording that its title screen never named (Houses, Peach). */
export const IN_GAME_DEMO_TAG = 'Its own recording · unused by the original';

/** The recording a preview plays; a promise while an added demo is still being fetched. */
function demoSource(files: GameFiles, gam: string, attract: boolean): DemoSource | Promise<DemoSource | undefined> | undefined {
  const own = titleDemo(files, gam);
  if (own) return { kind: 'recorded', rec: own };
  const fallback = (): DemoSource | undefined => {
    const rec = attract ? attractRecording(files, gam) : undefined;
    return rec && { kind: 'attract', rec };
  };
  const added = (extra: ExtraDemo | undefined): DemoSource | Promise<DemoSource | undefined> | undefined => {
    if (!extra) return fallback();
    // one the game had all along (named nowhere) is in its files already
    const inFiles = extra.inGame ? files.get(extra.file) : undefined;
    if (inFiles) return { kind: 'added', rec: inFiles, inGame: true };
    return fetchExtraDemo(extra).then((rec) => (rec ? { kind: 'added' as const, rec } : fallback()));
  };
  const index = extraDemosLoaded();
  if (index) return added(extraDemoForGam(index, files.get(gam)));
  return loadExtraDemos().then((i) => added(extraDemoForGam(i, files.get(gam))));
}

/** True once the visitor has clicked or typed on the page: sound may start without asking. */
const mayPlaySound = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;

/** The demos' sound, which never asks the browser for audio before the visitor has used the page (or for None). */
class PreviewAudio extends DemoAudioEngine {
  override async resume(): Promise<void> {
    if (!this.context && (this.mode === 'none' || !mayPlaySound())) return;
    await super.resume();
  }
}

export interface DemoPreview {
  /** What is playing: the game's own demo, one added for this edition, or the attract mode (see DEMO_KIND_LABEL). */
  readonly kind: DemoKind;
  /** An added demo that is the game's own recording, which its title screen never named (see IN_GAME_DEMO_TAG). */
  readonly inGame: boolean;
  /** Resolves with `kind` once known (at once, unless an added demo is still being fetched). */
  readonly ready: Promise<DemoKind | undefined>;
  /** The sound it plays with: the demos' choice (demoAudio.ts), followed as it changes. */
  readonly audio: DemoAudio;
  stop(): void;
}

export interface DemoPreviewOptions {
  title: string;
  /** Play again from the start when the recording runs out. */
  loop?: boolean;
  /** Called once when it stops: ended, scrolled away, replaced by another or stopped. */
  onStop?: () => void;
  /** Walk the hero about when the game has no demo recording (default true). */
  attract?: boolean;
  /** Show DEMO_KIND_TAG over an added demo or the attract mode (default true). */
  tag?: boolean;
}

let current: { stop(): void } | undefined;

/** Stops the demo preview playing on the page, if any. */
export function stopDemoPreview(): void {
  current?.stop();
}

/**
 * Plays the title demo in `host` (sized by the page): the game's own, else one added for
 * this edition, else (unless `attract` is false) the attract mode. Returns undefined when
 * there is nothing to play; `kind` says which it is.
 */
export function playDemoPreview(host: HTMLElement, files: GameFiles, gam: string, o: DemoPreviewOptions): DemoPreview | undefined {
  const source = demoSource(files, gam, o.attract !== false);
  if (!source) return undefined;
  current?.stop();
  let rec: Uint8Array = new Uint8Array(0);
  let kind: DemoKind = source instanceof Promise ? 'added' : source.kind;
  let lastTick = 0;
  let inGame = false;
  let game = files;
  let audio: PreviewAudio | undefined;
  let player: PlayerHandle | undefined;
  let session: Session | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    player?.stop();
    session = undefined;
    const sound = (audio = new PreviewAudio(demoAudio()));
    let played = false;
    let endedAt = 0;
    const p = mountPlayer(host, game, gam, { title: o.title, playback: rec, preview: true, audio: sound, speakerOnly: sound.mode !== 'blaster', onSession: (s) => (session = s) });
    player = p;
    if (kind !== 'recorded' && o.tag !== false) {
      const tag = document.createElement('div');
      tag.className = 'demo-kind-tag';
      tag.textContent = inGame ? IN_GAME_DEMO_TAG : DEMO_KIND_TAG[kind];
      tag.style.cssText =
        'position:absolute;top:6px;left:50%;transform:translateX(-50%);max-width:calc(100% - 12px);padding:2px 8px;border-radius:999px;background:rgb(0 0 0 / .72);color:#fff;font:600 11px/1.4 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;z-index:2';
      host.append(tag);
    }
    clearInterval(timer);
    // A second after the last recorded key (or once the playback is over) the demo is done.
    timer = setInterval(() => {
      const playing = !!session?.rec.playing;
      if (playing) played = true;
      // the recording ran out, the playback ended, or play left the levels (the hero was
      // caught for good: the score table that follows is not worth waiting for)
      const left = playing && session!.rec.halted;
      const over =
        (playing && session!.rec.tick >= lastTick + 18) || ((left || (played && !playing)) && (endedAt ||= performance.now()) && performance.now() - endedAt > 1500);
      if (!over) return;
      if (o.loop) start();
      else handle.stop();
    }, 250);
    void p.done.then(() => player === p && !o.loop && handle.stop());
  };

  // Scrolled out of sight after being seen: stop (the card shows its picture again). One
  // that starts out of sight (the page is still scrolling to it) waits to be seen first.
  let inView = false;
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) inView = true;
      else if (inView) handle.stop();
    }
  });

  const handle: DemoPreview = {
    get kind() {
      return kind;
    },
    get inGame() {
      return inGame;
    },
    ready: Promise.resolve(source).then((src) => src?.kind),
    get audio() {
      return audio?.mode ?? demoAudio();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      offAudio();
      if (current === entry) current = undefined;
      clearInterval(timer);
      seen.disconnect();
      player?.stop();
      host.replaceChildren();
      host.classList.remove('gm-player', 'gm-preview');
      o.onStop?.();
    },
  };
  // the choice changed: at once, or (sound held back until the visitor used the page) from the start
  // (still fetching an added demo: it starts with the new choice)
  const offAudio = onDemoAudio((m) => {
    if (!audio) return;
    if (m !== 'none' && !audio.context) start();
    else audio.setMode(m, session);
  });
  const entry = { stop: () => handle.stop() };
  current = entry;
  const begin = (src: DemoSource) => {
    ({ kind, rec } = src);
    inGame = !!src.inGame;
    lastTick = recordingTicks(rec);
    game = withoutOpening(files, gam, rec);
    start();
  };
  if (source instanceof Promise)
    void source.then((src) => {
      if (stopped) return;
      if (src) begin(src);
      else handle.stop();
    });
  else begin(source);
  // after the first layout, so a preview just placed counts as in view
  requestAnimationFrame(() => !stopped && seen.observe(host));
  return handle;
}
