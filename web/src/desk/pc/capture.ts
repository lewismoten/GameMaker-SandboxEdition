// The desk's "video capture card": a screenshot of what the PC shows, at the resolution
// the VGA card put out (720x400 text, 320x200 mode 13h), and a recording of the screen
// with everything the PC plays (OPL music, Sound Blaster samples, the PC speaker): the
// screen alone, or the whole desk around it (the tab, shared with getDisplayMedia and cut
// down to the desk with Region Capture where the browser has it). A recording can wait
// for the next game to start and stop by itself when the PC is back at the DOS prompt.
import './capture.css';
import { h, toast } from '../../editor/core/ui';
import type { Computer } from '../../retro/computer';
import type { Vga } from '../../vga/shared/vga';
import type { PictureScreen } from '../../retro/view/picture';
import { drawText, drawVga, pngOf, saveBlob, stamp, TEXT_H, TEXT_W, VGA_H, VGA_W } from '../../media/screenCapture';
import type { LiveRecorder } from '../../media/video';
import { AudioMix } from '../../media/audioTap';
import { unlockAchievement } from '../../achievements';

/** What a recording keeps: everything (graphics letterboxed into 720x400) or one mode. */
export type RecordMode = 'all' | 'graphics' | 'text';

type Source = { kind: 'text' } | { kind: 'vga'; draw: (c: HTMLCanvasElement) => void } | { kind: 'none' };

/** Palette-indexed pixels (mode 13h or a VPIC/GIF picture mode) through the DAC, at their own size. */
function drawIndexed(mem: Uint8Array, dac: Uint8Array, width: number, height: number, c: HTMLCanvasElement): void {
  if (c.width !== width || c.height !== height) [c.width, c.height] = [width, height];
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  const out = new Uint32Array(img.data.buffer);
  const v = (x: number) => ((x & 63) << 2) | ((x & 63) >> 4);
  const rgba = new Uint32Array(256);
  for (let i = 0; i < 256; i++) rgba[i] = 0xff000000 | (v(dac[i * 3 + 2]) << 16) | (v(dac[i * 3 + 1]) << 8) | v(dac[i * 3]);
  for (let i = 0; i < width * height; i++) out[i] = rgba[mem[i]];
  ctx.putImageData(img, 0, 0);
}

/** What the monitor shows now, as something that can be drawn at native resolution. */
function sourceOf(pc: Computer): Source {
  const mode = pc.monitor.dataset.mode;
  if (mode === 'text' || mode === 'off') return { kind: 'text' };
  if (mode === 'vga') {
    // Game-Maker's designers and PLAYGAME's screens (mode 13h), or a picture mode (VPIC, the BBS's GIFs)
    const vga = pc['vgaScreen'] as Vga | undefined;
    if (vga) return { kind: 'vga', draw: (c) => drawVga(vga, c) };
    const pic = pc['picture'] as PictureScreen | undefined;
    if (pic) return { kind: 'vga', draw: (c) => drawIndexed(pic.mem, pic.dac, pic.width, pic.height, c) };
  }
  if (mode === 'game') {
    // The game's own 320x200 canvas: the one that takes the keys, not the smoothly scaled
    // copy (exactScale) laid under it at the monitor's size.
    const game = [...pc.monitor.querySelectorAll<HTMLCanvasElement>('.crt-game canvas')].find(
      (c) => c.width === VGA_W && c.height === VGA_H && c.tabIndex >= 0,
    );
    if (game)
      return {
        kind: 'vga',
        draw: (c) => {
          [c.width, c.height] = [VGA_W, VGA_H];
          c.getContext('2d')!.drawImage(game, 0, 0);
        },
      };
  }
  // 'gfx': today's web editors, drawn by the page rather than on the VGA screen
  return { kind: 'none' };
}

/** Draws the screen as it is now; false when there is nothing to draw (today's editors). */
function drawNow(pc: Computer, into: HTMLCanvasElement): Source['kind'] {
  const s = sourceOf(pc);
  if (s.kind === 'text') {
    if (pc.monitor.dataset.mode === 'off') {
      [into.width, into.height] = [TEXT_W, TEXT_H];
      into.getContext('2d')!.fillRect(0, 0, TEXT_W, TEXT_H);
    } else drawText(pc.screen, into);
  } else if (s.kind === 'vga') s.draw(into);
  return s.kind;
}

/** The tab, shared by the user, cut down to `region` where the browser can (Region Capture). */
async function shareTab(region: Element | null): Promise<{ track: MediaStreamTrack; cropped: boolean } | undefined> {
  const md = navigator.mediaDevices;
  if (!md?.getDisplayMedia) {
    toast('This browser can’t record the page: only the PC’s screen.', 'error');
    return undefined;
  }
  let stream: MediaStream;
  try {
    stream = await md.getDisplayMedia({
      video: { frameRate: { ideal: 30 }, displaySurface: 'browser' },
      audio: false, // the PC's sound is taken straight from it, without the rest of the tab
      // Chrome: offer this tab first, and only tabs
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude',
    } as DisplayMediaStreamOptions);
  } catch {
    toast('Not recording: the page wasn’t shared.');
    return undefined;
  }
  const track = stream.getVideoTracks()[0];
  let cropped = false;
  const CropTarget = (window as unknown as { CropTarget?: { fromElement(e: Element): Promise<unknown> } }).CropTarget;
  const crop = (track as MediaStreamTrack & { cropTo?: (t: unknown) => Promise<void> }).cropTo;
  if (region && CropTarget && crop) {
    try {
      await crop.call(track, await CropTarget.fromElement(region));
      cropped = true;
    } catch {
      /* another tab or a window was picked: it is recorded whole */
    }
  }
  return { track, cropped };
}

type Armed = { kind: 'screen'; mode: RecordMode } | { kind: 'desk'; track: MediaStreamTrack };

export function deskCapture(pc: Computer): { el: HTMLElement; dispose(): void } {
  const scratch = document.createElement('canvas');
  let rec:
    | {
        recorder: LiveRecorder;
        mix: AudioMix;
        raf: number;
        started: number;
        paused: number;
        name: string;
        /** Started by an armed recorder: stops by itself back at DOS. */
        auto: boolean;
        timer: ReturnType<typeof setInterval>;
      }
    | undefined;
  /** Waiting for the next game. */
  let armed: Armed | undefined;
  /** The menu's "wait for the next game" box. */
  let waitForGame = false;

  // Buttons that don't take the keyboard focus away from the PC.
  const keepFocus = { onpointerdown: (e: Event) => e.preventDefault() };
  const shotBtn = h(
    'button',
    { class: 'cap-btn', title: 'Screenshot: save what the PC shows as a PNG (720×400 text, 320×200 graphics)', 'aria-label': 'Screenshot', ...keepFocus },
    '📷',
  );
  const recBtn = h(
    'button',
    { class: 'cap-btn cap-rec', title: 'Record the screen and sound', 'aria-label': 'Record', 'aria-haspopup': 'menu', 'aria-expanded': 'false', ...keepFocus },
    '⏺',
  );
  const menu = h('div', { class: 'cap-menu', hidden: true, role: 'menu', 'aria-label': 'Record' });
  const el = h('div', { class: 'desk-capture' }, shotBtn, recBtn, menu);

  shotBtn.addEventListener('click', () => void screenshot());
  recBtn.addEventListener('click', (e) => {
    if (rec) return void stop();
    if (armed) return disarm('Disarmed: the next game won’t be recorded.');
    void toggleMenu(e.detail === 0); // 0: Enter or Space, so the focus goes into the menu
  });

  async function screenshot(): Promise<void> {
    if (!pc.powered) return toast('Switch the PC on first.');
    const kind = drawNow(pc, scratch);
    if (kind === 'none') return toast('Today’s editors aren’t on the VGA screen: nothing to capture here.');
    const bytes = await pngOf(scratch);
    saveBlob(`pc-screen-${stamp()}.png`, new Blob([bytes as BlobPart], { type: 'image/png' }));
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 300);
  }

  /** The recorder, loaded when the record menu is first opened. */
  let video: typeof import('../../media/video') | undefined;

  function closeMenu(focusButton = false): void {
    menu.hidden = true;
    recBtn.setAttribute('aria-expanded', 'false');
    if (focusButton) recBtn.focus();
  }

  const items = () => [...menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];

  async function toggleMenu(byKeyboard: boolean): Promise<void> {
    if (!menu.hidden) return closeMenu();
    video ??= await import('../../media/video');
    const fmt = video.recorderFormat(true);
    const canShare = !!navigator.mediaDevices?.getDisplayMedia;
    const choose = (pick: () => void) => () => (closeMenu(), pick());
    const wait = h(
      'button',
      { role: 'menuitemcheckbox', 'aria-checked': String(waitForGame), class: 'cap-wait', disabled: !fmt, ...keepFocus },
      h('span', null, `${waitForGame ? '☒' : '☐'} Wait for the next game`),
      h('small', null, 'Starts when a game starts (disk, CD or C:\\GM) and stops back at DOS'),
    );
    wait.addEventListener('click', () => {
      waitForGame = !waitForGame;
      wait.setAttribute('aria-checked', String(waitForGame));
      wait.firstElementChild!.textContent = `${waitForGame ? '☒' : '☐'} Wait for the next game`;
    });
    menu.replaceChildren(
      h(
        'strong',
        null,
        !fmt
          ? 'Recording isn’t available in this browser'
          : fmt.ext === 'mp4'
            ? 'Record with sound · MP4'
            : 'Record with sound · WebM (this browser can’t make MP4)',
      ),
      wait,
      h('span', { class: 'cap-sep', role: 'presentation' }, 'The PC’s screen'),
      ...(
        [
          ['all', 'Everything, 720×400', 'Text at its real 720×400; graphics 320×200 doubled to 640×400 between black bars'],
          ['graphics', 'Graphics only, 320×200', 'Pauses while the PC is in text mode'],
          ['text', 'Text only, 720×400', 'Pauses while the PC is in graphics mode'],
        ] as [RecordMode, string, string][]
      ).map(([mode, label, note]) =>
        h(
          'button',
          { role: 'menuitem', disabled: !fmt, ...keepFocus, onclick: choose(() => (waitForGame ? arm({ kind: 'screen', mode }) : startScreen(mode, false))) },
          label,
          h('small', null, note),
        ),
      ),
      h('span', { class: 'cap-sep', role: 'presentation' }, 'Around it'),
      h(
        'button',
        { role: 'menuitem', disabled: !fmt || !canShare, ...keepFocus, onclick: choose(() => void deskChosen()) },
        'The whole desk',
        h(
          'small',
          null,
          canShare
            ? 'The desk and everything on it, with the PC’s sound. Your browser asks what to share: pick this tab.'
            : 'This browser can’t share a page: only the PC’s screen.',
        ),
      ),
    );
    menu.hidden = false;
    recBtn.setAttribute('aria-expanded', 'true');
    place();
    if (byKeyboard) items()[0]?.focus();
  }

  /** Keeps the open menu on screen: below the buttons when there's no room above, nudged in from the sides. */
  function place(): void {
    menu.classList.remove('below');
    menu.style.translate = '';
    if (menu.getBoundingClientRect().top < 8) menu.classList.add('below');
    const r = menu.getBoundingClientRect();
    const scale = r.width / (menu.offsetWidth || 1); // the desk may be scaled to fit the window
    const dx = r.left < 8 ? 8 - r.left : r.right > innerWidth - 8 ? innerWidth - 8 - r.right : 0;
    if (dx) menu.style.translate = `${dx / scale}px 0`;
  }

  menu.addEventListener('keydown', (e) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => list[(i + list.length) % list.length]?.focus();
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
    else if (e.key === 'Escape') closeMenu(true);
    else if (e.key === 'Tab') return closeMenu();
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  async function deskChosen(): Promise<void> {
    if (!pc.powered && !waitForGame) return toast('Switch the PC on first.');
    const shared = await shareTab(el.closest('.desk'));
    if (!shared) return;
    if (!shared.cropped) toast('Recording the whole tab (this browser can’t cut it down to the desk).');
    if (waitForGame) arm({ kind: 'desk', track: shared.track });
    else startDesk(shared.track, false);
  }

  function arm(a: Armed): void {
    armed = a;
    if (a.kind === 'desk') a.track.addEventListener('ended', () => armed === a && disarm('Disarmed: the page is no longer shared.'), { once: true });
    el.classList.add('armed');
    recBtn.textContent = '⏺ Armed';
    recBtn.title = 'Armed: the next game will be recorded until it quits to DOS. Click to disarm.';
    recBtn.setAttribute('aria-label', 'Armed for the next game: disarm');
    toast(`Armed: the next game will be recorded (${a.kind === 'desk' ? 'the whole desk' : 'the screen'}) until it quits to DOS.`);
  }

  function disarm(message?: string): void {
    const a = armed;
    armed = undefined;
    if (a?.kind === 'desk') a.track.stop();
    el.classList.remove('armed');
    resetButton();
    if (message) toast(message);
  }

  function resetButton(): void {
    recBtn.textContent = '⏺';
    recBtn.title = 'Record the screen and sound';
    recBtn.setAttribute('aria-label', 'Record');
  }

  // An armed recorder starts as the monitor switches to a game.
  const watch = new MutationObserver(() => {
    const a = armed;
    if (!a || rec || pc.monitor.dataset.mode !== 'game') return;
    armed = undefined;
    el.classList.remove('armed');
    if (a.kind === 'desk') startDesk(a.track, true);
    else startScreen(a.mode, true);
  });
  watch.observe(pc.monitor, { attributes: true, attributeFilter: ['data-mode'] });

  /** Begins recording a canvas or a shared tab, with the PC’s sound. */
  function begin(source: HTMLCanvasElement | MediaStreamTrack, name: string, auto: boolean): typeof rec {
    const mix = new AudioMix();
    let recorder: LiveRecorder;
    try {
      recorder = new video!.LiveRecorder(source, mix.track, 70);
    } catch (e) {
      mix.dispose();
      if (source instanceof MediaStreamTrack) source.stop();
      toast((e as Error).message, 'error');
      return undefined;
    }
    rec = { recorder, mix, raf: 0, started: performance.now(), paused: 0, name, auto, timer: setInterval(() => tick(), 250) };
    el.classList.add('recording');
    recBtn.title = auto ? 'Recording this game: stops by itself back at DOS. Click to stop now.' : 'Stop recording and save the video';
    recBtn.setAttribute('aria-label', 'Stop recording and save');
    tick();
    return rec;
  }

  function startDesk(track: MediaStreamTrack, auto: boolean): void {
    const r = begin(track, 'desk-recording', auto);
    // "Stop sharing" in the browser's bar stops the recording too
    if (r) track.addEventListener('ended', () => rec === r && void stop(), { once: true });
  }

  function startScreen(mode: RecordMode, auto: boolean): void {
    if (!pc.powered) return toast('Switch the PC on first.');
    const out = document.createElement('canvas');
    [out.width, out.height] = mode === 'graphics' ? [VGA_W, VGA_H] : [TEXT_W, TEXT_H];
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillRect(0, 0, out.width, out.height);
    const r = begin(out, `pc-recording-${mode === 'graphics' ? '320x200' : '720x400'}`, auto);
    if (!r) return;
    let pausedAt = 0;
    const frame = () => {
      const kind = drawNow(pc, scratch);
      const wanted = kind !== 'none' && (mode === 'all' || (mode === 'graphics') === (kind === 'vga'));
      if (wanted) {
        if (pausedAt) {
          r.paused += performance.now() - pausedAt;
          pausedAt = 0;
          r.recorder.resume();
        }
        if (kind === 'vga' && (scratch.width !== out.width || scratch.height !== out.height)) {
          // graphics in a bigger frame: the largest whole multiple, centered between black bars
          const k = Math.max(1, Math.floor(Math.min(out.width / scratch.width, out.height / scratch.height)));
          const [w, h] = scratch.width * k <= out.width && scratch.height * k <= out.height ? [scratch.width * k, scratch.height * k] : fit(scratch, out);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(scratch, (out.width - w) / 2, (out.height - h) / 2, w, h);
        } else ctx.drawImage(scratch, 0, 0, out.width, out.height);
      } else if (!pausedAt) {
        pausedAt = performance.now();
        r.recorder.pause();
      }
      el.classList.toggle('paused', !!pausedAt);
      r.raf = requestAnimationFrame(frame);
    };
    frame();
  }

  /** The clock on the button; an armed recording ends when the PC is back at DOS (or off). */
  function tick(): void {
    if (!rec) return;
    if (rec.auto && !pc.busy) return void stop();
    const s = Math.floor((performance.now() - rec.started - rec.paused) / 1000);
    recBtn.textContent = `⏹ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  async function stop(): Promise<void> {
    const r = rec;
    if (!r) return;
    rec = undefined;
    cancelAnimationFrame(r.raf);
    clearInterval(r.timer);
    el.classList.remove('recording', 'paused');
    resetButton();
    const blob = await r.recorder.stop();
    r.mix.dispose();
    if (!blob.size) return toast('The recording came out empty: nothing was shown while it ran.', 'error');
    saveBlob(`${r.name}-${stamp()}.${r.recorder.ext}`, blob);
    unlockAchievement('record-video');
    const fmt = r.recorder.ext === 'mp4' ? 'MP4' : 'WebM, as this browser can’t make MP4';
    toast(`Saved the recording (${fmt}, ${(blob.size / 1e6).toFixed(1)} MB).`);
  }

  const onDocClick = (e: MouseEvent) => {
    if (!menu.hidden && !el.contains(e.target as Node)) closeMenu();
  };
  document.addEventListener('click', onDocClick);

  return {
    el,
    dispose() {
      document.removeEventListener('click', onDocClick);
      watch.disconnect();
      disarm();
      void stop();
    },
  };
}

/** The size of `src` scaled to fit inside `box`, keeping its shape. */
function fit(src: { width: number; height: number }, box: { width: number; height: number }): [number, number] {
  const k = Math.min(box.width / src.width, box.height / src.height);
  return [Math.round(src.width * k), Math.round(src.height * k)];
}
