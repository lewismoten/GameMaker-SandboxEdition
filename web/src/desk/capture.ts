// The desk's "video capture card": a screenshot of what the PC shows, at the resolution
// the VGA card put out (720x400 text, 320x200 mode 13h), and a recording of the screen
// with everything the PC plays (OPL music, Sound Blaster samples, the PC speaker).
import './capture.css';
import { h, toast } from '../editor/core/ui';
import type { Computer } from '../retro/computer';
import type { Vga } from '../vga/vga';
import { drawText, drawVga, pngOf, saveBlob, stamp, TEXT_H, TEXT_W, VGA_H, VGA_W } from '../media/screenCapture';
import { LiveRecorder, recorderFormat } from '../media/video';
import { AudioMix } from '../media/audioTap';

/** What a recording keeps: everything (graphics letterboxed into 720x400) or one mode. */
export type RecordMode = 'all' | 'graphics' | 'text';

type Source = { kind: 'text' } | { kind: 'vga'; draw: (c: HTMLCanvasElement) => void } | { kind: 'none' };

/** What the monitor shows now, as something that can be drawn at native resolution. */
function sourceOf(pc: Computer): Source {
  const mode = pc.monitor.dataset.mode;
  if (mode === 'text' || mode === 'off') return { kind: 'text' };
  if (mode === 'vga') {
    const vga = pc['vgaScreen'] as Vga | undefined;
    if (vga) return { kind: 'vga', draw: (c) => drawVga(vga, c) };
  }
  if (mode === 'game') {
    const game = pc.monitor.querySelector<HTMLCanvasElement>('.crt-game canvas');
    if (game && game.width === VGA_W && game.height === VGA_H)
      return {
        kind: 'vga',
        draw: (c) => {
          [c.width, c.height] = [VGA_W, VGA_H];
          c.getContext('2d')!.drawImage(game, 0, 0);
        },
      };
  }
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

export function deskCapture(pc: Computer): { el: HTMLElement; dispose(): void } {
  const scratch = document.createElement('canvas');
  let rec:
    | { recorder: LiveRecorder; mix: AudioMix; raf: number; started: number; paused: number; mode: RecordMode; timer: ReturnType<typeof setInterval> }
    | undefined;

  // Buttons that don't take the keyboard focus away from the PC.
  const keepFocus = { onpointerdown: (e: Event) => e.preventDefault() };
  const shotBtn = h(
    'button',
    { class: 'cap-btn', title: 'Screenshot: save what the PC shows as a PNG (720×400 text, 320×200 graphics)', 'aria-label': 'Screenshot', ...keepFocus },
    '📷',
  );
  const recBtn = h('button', { class: 'cap-btn cap-rec', title: 'Record the screen and sound', 'aria-label': 'Record the screen', ...keepFocus }, '⏺');
  const menu = h('div', { class: 'cap-menu', hidden: true, role: 'menu' });
  const el = h('div', { class: 'desk-capture' }, shotBtn, recBtn, menu);

  shotBtn.addEventListener('click', () => void screenshot());
  recBtn.addEventListener('click', () => (rec ? void stop() : toggleMenu()));

  async function screenshot(): Promise<void> {
    if (!pc.powered) return toast('Switch the PC on first.');
    const kind = drawNow(pc, scratch);
    if (kind === 'none') return toast('Today’s editors aren’t on the VGA screen: nothing to capture here.');
    const bytes = await pngOf(scratch);
    saveBlob(`pc-screen-${stamp()}.png`, new Blob([bytes as BlobPart], { type: 'image/png' }));
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 300);
  }

  function toggleMenu(): void {
    if (!menu.hidden) return void (menu.hidden = true);
    const fmt = recorderFormat(true);
    menu.replaceChildren(
      h('strong', null, `Record the screen and sound (${fmt ? fmt.ext.toUpperCase() : 'not available in this browser'})`),
      ...(
        [
          ['all', 'Everything, 720×400', 'Text at its real 720×400; graphics 320×200 doubled to 640×400 between black bars'],
          ['graphics', 'Graphics only, 320×200', 'Pauses while the PC is in text mode'],
          ['text', 'Text only, 720×400', 'Pauses while the PC is in graphics mode'],
        ] as [RecordMode, string, string][]
      ).map(([mode, label, note]) =>
        h('button', { role: 'menuitem', disabled: !fmt, ...keepFocus, onclick: () => ((menu.hidden = true), start(mode)) }, label, h('small', null, note)),
      ),
    );
    menu.hidden = false;
  }

  function start(mode: RecordMode): void {
    if (!pc.powered) return toast('Switch the PC on first.');
    const out = document.createElement('canvas');
    [out.width, out.height] = mode === 'graphics' ? [VGA_W, VGA_H] : [TEXT_W, TEXT_H];
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillRect(0, 0, out.width, out.height);
    const mix = new AudioMix();
    let recorder: LiveRecorder;
    try {
      recorder = new LiveRecorder(out, mix.track, 70);
    } catch (e) {
      mix.dispose();
      return toast((e as Error).message, 'error');
    }
    const r = (rec = { recorder, mix, raf: 0, started: performance.now(), paused: 0, mode, timer: setInterval(() => showTime(), 250) });
    let pausedAt = 0;
    const frame = () => {
      const kind = drawNow(pc, scratch);
      const wanted = kind !== 'none' && (mode === 'all' || (mode === 'graphics') === (kind === 'vga'));
      if (wanted) {
        if (pausedAt) {
          r.paused += performance.now() - pausedAt;
          pausedAt = 0;
          recorder.resume();
        }
        if (mode === 'all' && kind === 'vga') {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, TEXT_W, TEXT_H);
          ctx.drawImage(scratch, (TEXT_W - VGA_W * 2) / 2, 0, VGA_W * 2, VGA_H * 2);
        } else ctx.drawImage(scratch, 0, 0, out.width, out.height);
      } else if (!pausedAt) {
        pausedAt = performance.now();
        recorder.pause();
      }
      el.classList.toggle('paused', !!pausedAt);
      r.raf = requestAnimationFrame(frame);
    };
    frame();
    el.classList.add('recording');
    recBtn.title = 'Stop recording and save the video';
    showTime();
  }

  function showTime(): void {
    if (!rec) return;
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
    recBtn.textContent = '⏺';
    recBtn.title = 'Record the screen and sound';
    const blob = await r.recorder.stop();
    r.mix.dispose();
    const size = r.mode === 'graphics' ? '320x200' : '720x400';
    saveBlob(`pc-recording-${size}-${stamp()}.${r.recorder.ext}`, blob);
    toast(`Saved the recording (${r.recorder.ext.toUpperCase()}, ${(blob.size / 1e6).toFixed(1)} MB).`);
  }

  const onDocClick = (e: MouseEvent) => {
    if (!menu.hidden && !el.contains(e.target as Node)) menu.hidden = true;
  };
  document.addEventListener('click', onDocClick);

  return {
    el,
    dispose() {
      document.removeEventListener('click', onDocClick);
      void stop();
    },
  };
}
