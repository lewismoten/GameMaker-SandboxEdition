// Demo previews: a game's title-screen demo (.REC, start scene slot 11) playing inside a
// small screen on the page, such as a home page card or the selected game. Only one plays
// at a time: it stops when another starts, when a player such as the walkthrough takes the
// media focus (mediaFocus.ts), when it scrolls out of view, or when the
// recording runs out. It plays with the demos' sound choice (demoAudio.ts: None, Sound
// Blaster or PC speaker), silent until the visitor has used the page.
//
// A game without a title demo can still show one: a CD game may have a demo added for this
// edition (extraDemos.ts, kept apart from its files), and any other game an "attract
// mode" (attractDemo.ts) that walks its hero back and forth. `kind` tells them apart so the
// page can say which it is (demoSource.ts picks the recording).
import { DemoAudioEngine, demoAudio, onDemoAudio, type DemoAudio } from './demoAudio';
import type { Session } from '../engine/scene';
import { mountPlayer, type PlayerHandle } from '../player/player';
import type { GameFiles } from '../project/files';
import { recordingTicks, titleDemo, withoutOpening } from './demo';
import { attractRecording } from './attractDemo';
import { extraDemoForGam, loadExtraDemos } from './extraDemos';
import { demoSource, type DemoSource } from './demoSource';
import { DEMO_KIND_TAG, type DemoKind } from './demoKind';
import { onSoundUnlocked, soundUnlocked } from '../audio/context';
import { claimMediaFocus } from './mediaFocus';

// the index is small: fetched early, so a preview can tell at once whether a demo was added
if (typeof window !== 'undefined') void loadExtraDemos();

export { DEMO_KIND_LABEL, DEMO_KIND_TAG, catalogDemoKind, catalogExtraDemo, catalogHasDemo, demoFileName, type DemoKind } from './demoKind';

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

/** The tag over a game's own recording that its title screen never named (Houses, Peach). */
const IN_GAME_DEMO_TAG = 'Its own recording · unused by the original';

/**
 * True once the visitor has tapped, clicked or typed on the page: sound may start without
 * asking (iOS: the page's AudioContext was resumed in that gesture, audio/context.ts).
 */
const mayPlaySound = () => soundUnlocked() || (navigator.userActivation?.hasBeenActive ?? false);

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

interface DemoPreviewOptions {
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

/**
 * Plays the title demo in `host` (sized by the page): the game's own, else one added for
 * this edition, else (unless `attract` is false) the attract mode. Returns undefined when
 * there is nothing to play, or a player (the walkthrough) has the media focus
 * (mediaFocus.ts); `kind` says which it is.
 */
export function playDemoPreview(host: HTMLElement, files: GameFiles, gam: string, o: DemoPreviewOptions): DemoPreview | undefined {
  const source = demoSource(files, gam, o.attract !== false);
  if (!source) return undefined;
  // one at a time: this stops the preview playing, and stops when a player starts
  const release = claimMediaFocus('preview', () => handle.stop());
  if (!release) return undefined;
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
  let tagShown = false;

  const start = () => {
    player?.stop();
    audio?.dispose();
    session = undefined;
    const sound = (audio = new PreviewAudio(demoAudio()));
    let played = false;
    let endedAt = 0;
    const p = mountPlayer(host, game, gam, {
      title: o.title,
      playback: rec,
      preview: true,
      audio: sound,
      speakerOnly: sound.mode !== 'blaster',
      onSession: (s) => (session = s),
    });
    player = p;
    // the note shows for a few seconds when the demo starts, then fades (not again on each loop)
    if (kind !== 'recorded' && o.tag !== false && !tagShown) {
      tagShown = true;
      const tag = document.createElement('div');
      tag.className = 'demo-kind-tag';
      tag.textContent = inGame ? IN_GAME_DEMO_TAG : DEMO_KIND_TAG[kind];
      tag.style.cssText =
        'position:absolute;top:6px;left:50%;transform:translateX(-50%);max-width:calc(100% - 12px);padding:2px 8px;border-radius:999px;background:rgb(0 0 0 / .72);color:#fff;font:600 11px/1.4 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;z-index:2';
      host.append(tag);
      tag.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 5000, fill: 'forwards' });
    }
    // silent until the visitor uses the page (iOS needs a tap for sound): say so, and a tap here does it
    if (sound.mode !== 'none' && !mayPlaySound()) {
      const hint = document.createElement('button');
      hint.type = 'button';
      hint.className = 'demo-sound-hint';
      // a pointer convenience: any key turns the sound on too, so it stays out of the Tab order
      // (and out of the aria-hidden demo on the home page)
      hint.tabIndex = -1;
      hint.textContent = `🔇 ${matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click'} for sound`;
      // the tap only turns the sound on (audio/context.ts hears it first); the card under it stays put
      hint.addEventListener('click', (e) => (e.stopPropagation(), e.preventDefault()));
      host.append(hint);
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
        (playing && session!.rec.tick >= lastTick + 18) ||
        ((left || (played && !playing)) && (endedAt ||= performance.now()) && performance.now() - endedAt > 1500);
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
      release();
      clearInterval(timer);
      seen.disconnect();
      offUnlock();
      player?.stop();
      audio?.dispose();
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
  // the visitor's first tap or click anywhere (inside its handler): the sound starts now
  const offUnlock = onSoundUnlocked(() => {
    host.querySelector('.demo-sound-hint')?.remove();
    if (audio && !stopped) void audio.wake();
  });
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
