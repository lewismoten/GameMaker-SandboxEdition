// Demo recordings (.REC) played back in the game, to watch or to save as a video:
// the title screen's demo (start scene slot 11) or any recording being edited. The title
// and the first level's intro can be skipped so the video starts with the playing; that
// only changes a copy of the game in memory, never the game's own files.
import './demo.css';
import { h, modal, toast } from '../editor/core/ui';
import { GameFiles } from '../project/files';
import { mountPlayer, type PlayerHandle } from '../player/player';
import { parseGame, serializeGame } from '../formats/game';
import { parseRecording } from '../formats/recording';
import type { Session } from '../engine/scene';
import { LiveRecorder, recorderFormat } from './video';
import { AudioMix } from './audioTap';
import { saveBlob } from './screenCapture';
import { attractRecording } from './attractDemo';
import { ADDED_DEMO_NOTICE, extraDemoForGam, fetchExtraDemo, loadExtraDemos } from './extraDemos';

const SKIP_KEY = 'gm-demo-skip-intro';

/** The title screen's demo recording, if the game has one. */
export function titleDemo(files: GameFiles, gam: string): Uint8Array | undefined {
  try {
    const game = parseGame(files.get(gam)!);
    const name = game.scenes[0]?.files[11];
    return name ? files.get(files.resolve(name) ?? name) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * A copy of the game without the title graphic and song, or the first level's intro graphic.
 * Given the recording, a DOS one that begins by waiting on a screen (its first key comes
 * after thousands of GetKey polls, as PEACH's does on the first level's picture) keeps that
 * intro: the key that dismissed it would otherwise wait out in the level.
 */
export function withoutOpening(files: GameFiles, gam: string, rec?: Uint8Array): GameFiles {
  const copy = new GameFiles(files.entries());
  const bytes = files.get(gam);
  if (!bytes) return copy;
  const game = parseGame(bytes);
  const start = game.scenes[0];
  if (!start) return copy;
  start.files[0] = '';
  start.files[1] = '';
  const first = game.scenes[start.links[0]?.toScene ?? -1];
  const waitsFirst = !!rec && (parseRecording(rec)[0]?.delta ?? 0) > 4096;
  if (first && !waitsFirst) first.files[9] = '';
  copy.set(gam, serializeGame(game));
  return copy;
}

/** Game ticks (18.2 a second) until the last recorded key. */
export function recordingTicks(rec: Uint8Array): number {
  return parseRecording(rec).reduce((n, k) => n + k.delta, 0);
}

function loadSkip(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) !== 'off';
  } catch {
    return true;
  }
}

export interface DemoOptions {
  title: string;
  files: GameFiles;
  gam: string;
  rec: Uint8Array;
  /** Start recording a video at once. */
  record?: boolean;
  /** Something shown under the screen that follows the playback (the keys timeline). */
  below?: (tick: () => number) => { el: HTMLElement; destroy(): void };
  /** The dialog's heading. */
  heading?: string;
  /** A line under the screen, e.g. that the recording was not in the original game. */
  notice?: string;
}

/** Plays a demo recording in a dialog: watch it, or save it as a video (screen and sound). */
export function playDemo(o: DemoOptions): Promise<void> {
  let skip = loadSkip();
  let player: PlayerHandle | undefined;
  let session: Session | undefined;
  let video: { rec: LiveRecorder; mix: AudioMix; timer: ReturnType<typeof setInterval> } | undefined;
  const lastTick = recordingTicks(o.rec);
  let generation = 0;
  const host = h('div', { class: 'player-host rec-player demo-player' });
  const status = h('span', { class: 'meta demo-status' });
  const fmt = recorderFormat(true);
  const recBtn = h('button', { class: 'primary', disabled: !fmt, title: fmt ? '' : 'This browser cannot record video' }, '⏺ Save as video');
  const skipBox = h('input', { type: 'checkbox', checked: skip });
  const tick = () => (session?.rec.playing ? session.rec.tick : 0);
  const below = o.below?.(tick);

  const stopVideo = async (keep: boolean) => {
    const v = video;
    if (!v) return;
    video = undefined;
    clearInterval(v.timer);
    host.classList.remove('recording');
    recBtn.textContent = '⏺ Save as video';
    const blob = await v.rec.stop();
    v.mix.dispose();
    if (!keep) return;
    const name = `${o.title.replace(/[^\w-]+/g, '-').toLowerCase() || 'demo'}-demo-320x200.${v.rec.ext}`;
    saveBlob(name, blob);
    status.textContent = `Saved ${name} (${(blob.size / 1e6).toFixed(1)} MB).`;
  };

  /** (Re)starts the playback from the beginning, recording it when asked. */
  const start = (record: boolean) => {
    void stopVideo(false);
    player?.stop();
    session = undefined;
    const gen = ++generation;
    const files = skip ? withoutOpening(o.files, o.gam, o.rec) : new GameFiles(o.files.entries());
    player = mountPlayer(host, files, o.gam, {
      title: o.title,
      playback: o.rec,
      autoStart: true,
      noKeysButton: true,
      onSession: (s) => (session = s),
      // a replaced player exits later: only the current one ends the video
      onExit: () => gen === generation && void stopVideo(true),
    });
    status.textContent = skip ? 'Straight into the playing. Esc leaves.' : 'From the title screen. Esc leaves.';
    if (!record) return;
    const machine = player.machine;
    const mix = new AudioMix((ctx) => ctx === machine.audio.context);
    try {
      const rec = new LiveRecorder(machine.screen.canvas, mix.track, 70);
      const began = performance.now();
      let played = false;
      let endedAt = 0;
      let seenTick = -1;
      let seenAt = 0;
      video = {
        rec,
        mix,
        timer: setInterval(() => {
          const s = Math.floor((performance.now() - began) / 1000);
          const left = Math.max(0, Math.ceil((lastTick + 36 - tick()) / 18.2));
          status.textContent = `⏺ Recording ${rec.ext.toUpperCase()} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · about ${left} s to go`;
          // two seconds after the last recorded key (or after the playback ends), the video is done
          if (session?.rec.playing) {
            played = true;
            const t = tick();
            if (t !== seenTick) [seenTick, seenAt] = [t, performance.now()];
            // ...or once the keys have run out and the game holds still (a score table) for 3 s
            const stalled = t >= lastTick - 90 && performance.now() - seenAt > 3000;
            if (t >= lastTick + 36 || stalled) void stopVideo(true);
          } else if (played) {
            endedAt ||= performance.now();
            if (performance.now() - endedAt > 2000) void stopVideo(true);
          }
        }, 250),
      };
      host.classList.add('recording');
      recBtn.textContent = '⏹ Stop and save';
    } catch (e) {
      mix.dispose();
      toast((e as Error).message, 'error');
    }
  };

  recBtn.addEventListener('click', () => (video ? void stopVideo(true) : start(true)));
  skipBox.addEventListener('change', () => {
    skip = skipBox.checked;
    try {
      localStorage.setItem(SKIP_KEY, skip ? 'on' : 'off');
    } catch {
      /* private mode */
    }
    start(!!video);
  });

  return modal<void>(o.heading ?? 'Watch the demo', () => {
    queueMicrotask(() => start(!!o.record && !!fmt));
    return h(
      'div',
      { class: 'stack rec-dialog rec-watch demo-dialog' },
      host,
      below?.el ?? null,
      h(
        'div',
        { class: 'demo-bar' },
        h('label', { class: 'demo-skip' }, skipBox, 'Skip the title and opening screens'),
        h('span', { class: 'spacer' }),
        h('button', { onclick: () => start(false), title: 'Play it again from the beginning' }, '↺ Restart'),
        recBtn,
      ),
      status,
      o.notice ? h('p', { class: 'meta demo-notice' }, o.notice) : null,
      h(
        'p',
        { class: 'hint' },
        `Videos are 320×200 with the game’s music and sounds, recorded as it plays (${fmt ? fmt.ext.toUpperCase() : 'not available here'}); they stop by themselves two seconds after the last recorded key.`,
      ),
    );
  }).then(() => {
    void stopVideo(true);
    below?.destroy();
    player?.stop();
  });
}

/** "▶ Watch demo" for a game card: plays the title screen's demo with its music and sounds. */
export function demoButton(title: string, load: () => Promise<GameFiles>, gam: string | null | undefined): HTMLElement | null {
  if (!gam) return null;
  return h(
    'button',
    {
      title: 'Watch the demo the title screen plays when nobody touches the keys, with its music and sounds',
      onclick: async () => {
        const files = await load();
        const rec = titleDemo(files, gam);
        if (rec) return playDemo({ title, files, gam, rec, heading: `${title}: the demo` });
        // a CD game that shipped without one may have a demo added for this edition
        const added = extraDemoForGam(await loadExtraDemos(), files.get(gam));
        const bytes = added && (added.inGame ? files.get(added.file) : await fetchExtraDemo(added));
        if (!added || !bytes) {
          // nothing recorded: the attract mode walks the hero about instead
          const walk = attractRecording(files, gam);
          if (!walk) return toast(`${title} has no demo recording.`);
          return playDemo({
            title,
            files,
            gam,
            rec: walk,
            heading: `${title}: a preview`,
            notice: 'Preview — not a recorded demo: the hero walks back and forth with the game’s own keys. Nothing is saved to the game.',
          });
        }
        await playDemo({ title, files, gam, rec: bytes, heading: `${title}: the demo (added)`, notice: `${ADDED_DEMO_NOTICE}. ${added.made}` });
      },
    },
    '▶ Watch demo',
  );
}
