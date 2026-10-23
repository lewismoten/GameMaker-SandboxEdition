// "Watch walkthrough" on a Sandbox game's page: the whole game played from power-on to the
// credits on the real engine (runtime.ts), at 320×200 scaled up with square pixels. Play and
// pause, 1×/2×/4×, the demos' sound choice (None · Sound Blaster · PC speaker, media/demoAudio.ts), a chapter list to jump to (a jump replays the game from the start
// as fast as it can, nothing drawn, to the chapter's first scene), "Download MP4" (made frame
// by frame, faster than real time, exportVideo.ts) and "Copy for YouTube" (title, description
// and chapter markers) right under the screen. While it is open the page's other demos stop
// (media/mediaFocus.ts).
import './walkthrough.css';
import { h, modal, toast } from '../editor/core/ui';
import { saveBlob } from '../media/screenCapture';
import { fetchSiteFile, type CatalogEntry, type GameFiles } from '../project/files';
import { SITE_URL } from '../seo/site';
import { TICK_RATE } from '../audio/cmfPlayer';
import { clock, WALKTHROUGH_FPS, youtubeText, type Walkthrough } from './format';
import { WalkAudio, WalkRun } from './runtime';
import { canExport, exportWalkthrough } from './exportVideo';
import { demoAudio, demoAudioPicker, onDemoAudio, DEMO_AUDIO_LABEL } from '../media/demoAudio';
import { claimMediaFocus } from '../media/mediaFocus';
import { unlockAchievement, watchedWalkthrough } from '../achievements';

const FRAME_MS = 1000 / WALKTHROUGH_FPS;
/** A skip ahead moves the clock 40 timer ticks a frame: the most the engine's loop takes at once. */
const SKIP_MS = (40 * 1000) / TICK_RATE;

const walkCache = new Map<string, Promise<Walkthrough | undefined>>();

/** The game's walkthrough (its catalog entry names it), loaded once. */
export function loadWalkthrough(entry: CatalogEntry): Promise<Walkthrough | undefined> {
  const path = entry.walkthrough;
  if (!path) return Promise.resolve(undefined);
  let p = walkCache.get(path);
  if (!p) {
    p = fetchSiteFile(path, entry.gz)
      .then((b) => (b ? (JSON.parse(new TextDecoder().decode(b)) as Walkthrough) : undefined))
      .catch(() => undefined);
    walkCache.set(path, p);
  }
  return p;
}

const slug = (s: string) => s.replace(/['’]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'game';

/** The address of the game's page in the web app. */
export const gameUrl = (entry: CatalogEntry) => `${SITE_URL}#/game/cd:${entry.id}`;

export function walkthroughText(entry: CatalogEntry, walk: Walkthrough) {
  return youtubeText({
    gameTitle: entry.title,
    year: entry.year,
    company: entry.company,
    blurb: entry.blurb,
    url: gameUrl(entry),
    chapters: walk.timeline.chapters,
    fps: walk.timeline.fps,
    frames: walk.timeline.frames,
  });
}

/** What "Copy for YouTube" puts on the clipboard: the title, a blank line, then the description (its chapter list last). */
export const youtubeClipboard = (yt: { title: string; description: string }) => `${yt.title}\n\n${yt.description}`;

/** Copies `text`: the Clipboard API, else a selected textarea inside `inside` (a modal dialog keeps the rest of the page inert). */
async function copyText(text: string, inside: HTMLElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { readonly: true, 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0' }, text) as HTMLTextAreaElement;
    inside.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      /* no clipboard at all */
    }
    ta.remove();
    return ok;
  }
}

/** Opens the walkthrough player; `onReady` hears when it has loaded and is about to show. */
export async function watchWalkthrough(entry: CatalogEntry, loadFiles: () => Promise<GameFiles>, onReady?: () => void): Promise<void> {
  // the page's demos stop now (and none starts while it is open); another player taking over pauses this one
  let lose = () => {};
  const release = claimMediaFocus('player', () => lose());
  try {
    await watch(entry, loadFiles, onReady, (f) => (lose = f));
  } finally {
    release?.();
  }
}

async function watch(entry: CatalogEntry, loadFiles: () => Promise<GameFiles>, onReady: (() => void) | undefined, onLose: (f: () => void) => void): Promise<void> {
  const [walk, files] = await Promise.all([loadWalkthrough(entry), loadFiles()]);
  if (!walk || !entry.gam) {
    toast(`${entry.title} has no walkthrough.`);
    return;
  }
  const gam = entry.gam;
  const tl = walk.timeline;
  const total = tl.frames;

  const canvas = h('canvas', { class: 'wt-canvas', width: 320, height: 200, 'aria-hidden': 'true' }) as HTMLCanvasElement;
  const busy = h('div', { class: 'wt-busy', hidden: true });
  const screen = h('div', { class: 'wt-screen', title: 'Play or pause' }, canvas, busy);
  const playBtn = h('button', { class: 'primary wt-play', type: 'button' });
  const timeEl = h('span', { class: 'wt-time', 'aria-live': 'off' });
  const bar = h('div', { class: 'wt-bar-fill' });
  const ticks = tl.chapters.slice(1).map((c) => h('span', { class: 'wt-bar-tick', style: `left:${(100 * c.frame) / total}%` }));
  const progress = h('div', { class: 'wt-bar', role: 'progressbar', 'aria-label': 'Walkthrough position', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(total / WALKTHROUGH_FPS)) }, bar, ...ticks);
  const speeds = [1, 2, 4].map((v) => h('button', { type: 'button', class: 'wt-speed', 'aria-pressed': String(v === 1), 'aria-label': `Speed ${v}×`, dataset: { speed: String(v) } }, `${v}×`));
  const soundPick = demoAudioPicker({ label: 'Sound', className: 'wt-sound' });
  const chapterList = h('ol', { class: 'wt-chapters' });
  const status = h('p', { class: 'meta wt-status', role: 'status' });

  const exportSel = h(
    'select',
    { class: 'wt-export-pick', 'aria-label': 'What to put in the MP4' },
    h('option', { value: 'all' }, `Whole walkthrough (${clock(total / WALKTHROUGH_FPS)})`),
    ...tl.chapters.map((c, i) => h('option', { value: String(i) }, `Only ${c.title} (${clock(((tl.chapters[i + 1]?.frame ?? total) - c.frame) / WALKTHROUGH_FPS)})`)),
  );
  const exportBtn = h('button', { type: 'button', class: 'wt-export-btn', title: '320×200 at 60 frames a second with the sound picked, made frame by frame (faster than real time)' }, '⬇ Download MP4');
  const exportBar = h('progress', { class: 'wt-export-progress', max: 1, value: 0, hidden: true, 'aria-label': 'Making the MP4' });
  const yt = walkthroughText(entry, walk);
  const ytText = youtubeClipboard(yt);
  const marks = (yt.description.split('\nChapters:\n')[1] ?? '').split('\n').filter(Boolean).length;
  const copyLabel = '⧉ Copy for YouTube';
  const copyBtn = h(
    'button',
    { type: 'button', class: 'wt-copy-btn', title: `Copies the YouTube title, description${marks ? ` and ${marks} chapter markers` : ''} in one go` },
    copyLabel,
  );
  const ytTitle = h('input', { type: 'text', readonly: true, value: yt.title, 'aria-label': 'YouTube title' });
  const ytDesc = h('textarea', { readonly: true, rows: 10, 'aria-label': 'YouTube description and chapters' }, yt.description);

  // ---- playback ---------------------------------------------------------------------
  const audio = new WalkAudio();
  let mode = demoAudio();
  let sound = mode !== 'none';
  audio.card = mode !== 'speaker';
  audio.setMuted(!sound);
  let run: WalkRun | undefined;
  let playing = false;
  let speed = 1;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let stepping = false;
  let seeking = false;
  let closed = false;
  let current = -1;

  const fresh = () => {
    run?.stop();
    run = new WalkRun(canvas, files.copy(), gam, walk, audio);
    return run;
  };

  const chapterAt = (frame: number) => {
    let c = 0;
    tl.chapters.forEach((ch, i) => ch.frame <= frame && (c = i));
    return c;
  };

  const chapterButtons = tl.chapters.map((c, i) =>
    h(
      'li',
      null,
      h(
        'button',
        { type: 'button', class: 'wt-chapter', onclick: () => void seek(i), 'aria-label': `${c.title}, at ${clock(c.frame / WALKTHROUGH_FPS)}` },
        h('span', { class: 'wt-chapter-time' }, clock(c.frame / WALKTHROUGH_FPS)),
        h('span', { class: 'wt-chapter-title' }, c.title),
      ),
    ),
  );
  chapterList.append(...chapterButtons);

  const showTime = () => {
    const f = run?.frame ?? 0;
    timeEl.textContent = `${clock(f / WALKTHROUGH_FPS)} / ${clock(total / WALKTHROUGH_FPS)}`;
    bar.style.width = `${Math.min(100, (100 * f) / total)}%`;
    progress.setAttribute('aria-valuenow', String(Math.round(f / WALKTHROUGH_FPS)));
    progress.setAttribute('aria-valuetext', `${clock(f / WALKTHROUGH_FPS)} of ${clock(total / WALKTHROUGH_FPS)}`);
    const c = chapterAt(f);
    if (c !== current) {
      chapterButtons[current]?.firstElementChild?.removeAttribute('aria-current');
      chapterButtons[c]?.firstElementChild?.setAttribute('aria-current', 'step');
      current = c;
    }
  };

  const showPlay = () => {
    playBtn.textContent = playing ? '❚❚ Pause' : run?.done ? '↺ Watch again' : '▶ Play';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : run?.done ? 'Watch again from the start' : 'Play');
    screen.classList.toggle('paused', !playing);
  };

  const loop = (now: number) => {
    raf = 0;
    if (!playing || closed) return;
    raf = requestAnimationFrame(loop);
    acc += Math.min(250, now - last) * speed;
    last = now;
    if (stepping || seeking || !run) return;
    let n = Math.floor(acc / FRAME_MS);
    acc -= n * FRAME_MS;
    if (n <= 0) return;
    n = Math.min(n, 8 * speed);
    stepping = true;
    const r = run;
    void (async () => {
      for (let i = 0; i < n; i++) if (!(await r.step(i === n - 1))) break;
      stepping = false;
      if (r !== run) return;
      showTime();
      if (r.done) {
        playing = false;
        showPlay();
        status.textContent = r.error ? `The walkthrough stopped: ${String(r.error)}` : 'The end. Thanks for watching!';
        if (!r.error) watchedWalkthrough(entry.id);
      }
    })();
  };

  const setPlaying = (on: boolean) => {
    if (on && run?.done) {
      fresh();
      void run!.start().then(() => run!.step(true)).then(showTime);
    }
    playing = on;
    audio.pauseMusic(!on);
    if (on) {
      if (sound) void audio.start();
      last = performance.now();
      acc = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }
    showPlay();
  };

  /** Jumps to chapter `i`: from the start again if it is behind, as fast as the game goes, nothing drawn. */
  const seek = async (i: number) => {
    if (seeking) return;
    const target = tl.chapters[i];
    seeking = true;
    while (stepping) await new Promise((r) => setTimeout(r, 5));
    playing = false;
    audio.setMuted(true);
    busy.hidden = false;
    busy.textContent = `Skipping to ${target.title}…`;
    status.textContent = `Skipping to ${target.title}…`;
    let r = run!;
    if (r.done || r.chapters.length > i || r.frame > target.frame) r = fresh();
    await r.start();
    let n = 0;
    while (!closed && r === run && r.chapters.length <= i && (await r.step(false, SKIP_MS))) {
      if (++n % 200 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    if (r !== run || closed) return;
    r.frame = target.frame;
    await r.step(true);
    busy.hidden = true;
    seeking = false;
    audio.setMuted(!sound);
    status.textContent = `${target.title}.`;
    showTime();
    setPlaying(true);
  };

  playBtn.addEventListener('click', () => setPlaying(!playing));
  screen.addEventListener('click', () => !seeking && setPlaying(!playing));
  for (const b of speeds)
    b.addEventListener('click', () => {
      speed = Number(b.dataset.speed);
      speeds.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  // the sound choice: at once (back on the card, the scene's song starts over)
  const offAudio = onDemoAudio((m) => {
    mode = m;
    sound = m !== 'none';
    if (!seeking) audio.setMuted(!sound);
    // (None only silences: the card stays as it was, so the song comes back with it)
    if (m !== 'none') audio.setCard(m === 'blaster', run?.session);
    if (sound && playing) void audio.start();
  });

  // ---- the video file ---------------------------------------------------------------
  let making: AbortController | undefined;
  // another player took the media focus: pause, and stop making a video
  onLose(() => {
    if (playing) setPlaying(false);
    making?.abort();
  });
  exportBtn.addEventListener('click', async () => {
    if (making) return making.abort();
    if (!(await canExport())) return toast('This browser cannot make MP4 videos (it has no H.264 encoder). Try Chrome, Edge or Safari.', 'error');
    const pick = exportSel.value;
    const from = pick === 'all' ? 0 : tl.chapters[Number(pick)].frame;
    const to = pick === 'all' ? total : (tl.chapters[Number(pick) + 1]?.frame ?? total);
    const name = `${slug(entry.title)}-walkthrough${pick === 'all' ? '' : `-${slug(tl.chapters[Number(pick)].title)}`}-320x200.mp4`;
    setPlaying(false);
    making = new AbortController();
    exportBtn.textContent = '✕ Cancel MP4';
    exportSel.disabled = true;
    exportBar.hidden = false;
    exportBar.value = 0;
    const began = performance.now();
    try {
      const res = await exportWalkthrough({
        files,
        gam,
        walk,
        from,
        to,
        signal: making.signal,
        sound: mode,
        onProgress: (done, all) => {
          exportBar.value = done / all;
          const secs = (performance.now() - began) / 1000;
          const left = done > 0 ? (secs / done) * (all - done) : 0;
          status.textContent = done ? `Making the video: ${Math.round((100 * done) / all)}% (${clock(done / WALKTHROUGH_FPS)} of ${clock(all / WALKTHROUGH_FPS)}), about ${clock(left)} to go.` : 'Making the video: getting to the start…';
        },
      });
      saveBlob(name, res.blob);
      unlockAchievement('download-mp4');
      status.textContent = `Saved ${name}: ${clock(res.frames / WALKTHROUGH_FPS)}, 320×200 at 60 fps, ${(res.blob.size / 1e6).toFixed(1)} MB${res.audio !== 'none' ? ` with ${DEMO_AUDIO_LABEL[mode]} sound (${res.audio.toUpperCase()})` : mode === 'none' ? ', without sound' : ', without sound (this browser has no audio encoder)'}.`;
    } catch (e) {
      status.textContent = (e as Error).name === 'AbortError' ? 'Video cancelled.' : `The video could not be made: ${(e as Error).message}`;
    } finally {
      making = undefined;
      exportBtn.textContent = '⬇ Download MP4';
      exportSel.disabled = false;
      exportBar.hidden = true;
    }
  });

  let copied: ReturnType<typeof setTimeout> | undefined;
  copyBtn.addEventListener('click', async () => {
    if (await copyText(ytText, copyBtn.parentElement ?? copyBtn)) {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      status.textContent = `Copied the YouTube title, description${marks ? ` and ${marks} chapter markers` : ''}.`;
      clearTimeout(copied);
      copied = setTimeout(() => {
        copyBtn.textContent = copyLabel;
        copyBtn.classList.remove('copied');
      }, 2000);
    } else {
      // no clipboard here: the text, selected, to copy by hand
      ytDetails.open = true;
      ytDesc.focus();
      ytDesc.select();
      status.textContent = 'This browser would not copy it: the text is selected below to copy by hand.';
    }
  });
  const ytDetails = h(
    'details',
    { class: 'wt-youtube' },
    h('summary', null, 'YouTube title, description and chapters'),
    h('label', null, 'Title', ytTitle),
    h('label', null, 'Description (the chapters are at the end)', ytDesc),
  );

  showPlay();
  showTime();
  fresh();
  void run!.start().then(() => run!.step(true));

  onReady?.();
  await modal<void>(`${entry.title}: walkthrough`, () =>
    h(
      'div',
      { class: 'wt-dialog' },
      h(
        'div',
        { class: 'wt-main' },
        screen,
        progress,
        h('div', { class: 'wt-controls' }, playBtn, timeEl, h('span', { class: 'wt-speeds', role: 'group', 'aria-label': 'Speed' }, ...speeds), soundPick),
        h('div', { class: 'wt-actions', role: 'group', 'aria-label': 'Download and share' }, exportSel, exportBtn, copyBtn),
        exportBar,
        status,
        ytDetails,
      ),
      h(
        'aside',
        { class: 'wt-side', 'aria-label': 'Chapters' },
        h('h3', null, 'Chapters'),
        chapterList,
      ),
    ),
  );
  closed = true;
  offAudio();
  making?.abort();
  cancelAnimationFrame(raf);
  run?.stop();
  audio.dispose();
}
