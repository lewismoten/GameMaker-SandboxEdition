// Animations (.FLI), as Autodesk Animator made them: a strip of whole frames shown one
// after another, each for the same time (the speed, in 1/70 s: the VGA's vertical
// retraces). Play, pause and step through it; delete, duplicate and reorder frames, change
// the speed, add frames from pictures, and export frames as PNG. Every change is written
// back as an .FLI with only what changed between frames, as Animator did.
import './animation.css';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { h, clear, download, pickFiles, toast } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { pickFile } from '../../widgets/filePicker';
import { decodeFrames, remap, rgbaOf } from '../../tools/convert';
import { decodeGif, isGif } from '../../../formats/gif';
import { decodeFliFrames, encodeFliFrames, fitPicture, type FliFrame, type FliFrames } from '../../../formats/fliFrames';
import { createZip } from '../../../project/zip';
import { encodeAnimatedGif } from '../../../media/gifEncode';
import { framesToVideo } from '../../../media/frames';

const RETRACE = 70;
const SPEEDS: [number, string][] = [
  [1, 'Fastest'],
  [3, 'Fast'],
  [5, 'Normal'],
  [10, 'Slow'],
  [35, '½ s'],
  [70, '1 s'],
];

/** A frame as a PNG. */
function framePng(f: FliFrame, w: number, hgt: number): Promise<Uint8Array> {
  const c = document.createElement('canvas');
  paintIndexed(c, f.pixels, w, hgt, f.palette);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? void b.arrayBuffer().then((a) => resolve(new Uint8Array(a))) : reject(new Error('PNG failed'))), 'image/png'),
  );
}

registerEditor(['fli'], (host, project, file) => {
  let anim: FliFrames = decodeFliFrames(project.files.get(file)!);
  const base = file.replace(/\.fli$/, '');
  const undo: FliFrames[] = [];
  const redo: FliFrames[] = [];
  // the address keeps the frame shown once paused, counted from 1 (…/INTRO.FLI?frame=12); a
  // link to a frame opens paused on it, otherwise the animation plays
  const view = viewState(['p', project.id, file]);
  const urlFrame = view.num('frame');
  let paused = urlFrame !== undefined;
  let cur = Math.max(0, Math.min(anim.frames.length - 1, (urlFrame ?? 1) - 1));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let playing = false;
  let loop = false;

  const stage = h('canvas', { class: 'pixel fli-stage' });
  const info = h('div', { class: 'fli-info' });
  const counter = h('span', { class: 'fli-counter' });
  const scrub = h('input', { type: 'range', class: 'fli-scrub', min: 0, value: 0, 'aria-label': 'Frame' });
  const strip = h('div', { class: 'fli-strip', role: 'listbox', 'aria-label': 'Frames' });
  const playBtn = h('button', { class: 'primary fli-play', title: 'Play / pause (Space)' }, '▶ Play');
  const loopBtn = h('button', { 'aria-pressed': 'false', title: 'The game plays an animation once; loop it here to watch it' }, '🔁 Loop');
  const speedInput = h('input', { type: 'number', min: 0, max: 1000, step: 1, value: String(anim.speed), class: 'fli-speed', 'aria-label': 'Speed in 1/70 s' });
  const speedNote = h('span', { class: 'fli-speed-note' });
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', onclick: () => history(undo, redo) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', onclick: () => history(redo, undo) }, '↷ Redo');

  const frameSeconds = () => Math.max(1, anim.speed) / RETRACE;
  const show = (i: number) => {
    cur = Math.max(0, Math.min(anim.frames.length - 1, i));
    const f = anim.frames[cur];
    paintIndexed(stage, f.pixels, anim.width, anim.height, f.palette);
    counter.textContent = `Frame ${cur + 1} / ${anim.frames.length}`;
    if (!playing && paused) view.set({ frame: cur + 1 });
    scrub.max = String(anim.frames.length - 1);
    scrub.value = String(cur);
    const hadFocus = strip.contains(document.activeElement);
    strip.querySelectorAll<HTMLElement>('.fli-frame').forEach((el, j) => {
      el.classList.toggle('current', j === cur);
      el.setAttribute('aria-selected', String(j === cur));
      el.tabIndex = j === cur ? 0 : -1;
      if (hadFocus && j === cur) el.focus({ preventScroll: true });
    });
    const el = strip.children[cur] as HTMLElement | undefined;
    if (el && strip.scrollWidth > strip.clientWidth) {
      const left = el.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft || left + el.offsetWidth > strip.scrollLeft + strip.clientWidth)
        strip.scrollTo({ left: left - strip.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
    }
  };

  const pause = () => {
    playing = false;
    paused = true;
    view.set({ frame: cur + 1 });
    clearTimeout(timer);
    playBtn.textContent = '▶ Play';
  };
  const play = () => {
    clearTimeout(timer);
    playing = true;
    paused = false;
    view.set({ frame: undefined });
    playBtn.textContent = '⏸ Pause';
    // starting on the last frame of a played animation starts it over
    if (cur >= anim.frames.length - 1) show(0);
    else show(cur);
    const tick = () => {
      timer = setTimeout(() => {
        if (cur + 1 < anim.frames.length) show(cur + 1);
        else if (loop) show(0);
        else return pause();
        tick();
      }, frameSeconds() * 1000);
    };
    tick();
  };
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  loopBtn.addEventListener('click', () => {
    loop = !loop;
    loopBtn.setAttribute('aria-pressed', String(loop));
  });
  scrub.addEventListener('input', () => {
    pause();
    show(Number(scrub.value));
  });

  const renderInfo = () => {
    const total = anim.frames.length * frameSeconds();
    clear(
      info,
      h('strong', null, `${anim.width}×${anim.height}`),
      ` · ${anim.frames.length} frame${anim.frames.length === 1 ? '' : 's'} · ${anim.speed}/70 s each · ${total.toFixed(2)} s in all · ${(project.files.get(file)?.length ?? 0).toLocaleString()} bytes`,
    );
    speedNote.textContent = `= ${(frameSeconds() * 1000).toFixed(0)} ms per frame, ${(1 / frameSeconds()).toFixed(1)} frames a second`;
    if (document.activeElement !== speedInput) speedInput.value = String(anim.speed);
    undoBtn.disabled = !undo.length;
    redoBtn.disabled = !redo.length;
  };

  const renderStrip = () => {
    clear(
      strip,
      anim.frames.map((f, i) => {
        const c = h('canvas', { class: 'pixel' });
        paintIndexed(c, f.pixels, anim.width, anim.height, f.palette);
        const el = h(
          'div',
          {
            class: 'fli-frame',
            role: 'option',
            draggable: 'true',
            tabIndex: -1,
            title: `Frame ${i + 1}: shown at ${(i * frameSeconds()).toFixed(2)} s for ${(frameSeconds() * 1000).toFixed(0)} ms. Drag to move it.`,
            onclick: () => (pause(), show(i)),
          },
          c,
          h('span', { class: 'fli-frame-no' }, String(i + 1)),
          h('span', { class: 'fli-frame-time' }, `${anim.speed}/70`),
        );
        el.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/x-fli-frame', String(i));
          el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          el.classList.add('drop');
        });
        el.addEventListener('dragleave', () => el.classList.remove('drop'));
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          el.classList.remove('drop');
          const from = Number(e.dataTransfer?.getData('text/x-fli-frame'));
          if (Number.isFinite(from) && from !== i) move(from, i);
        });
        return el;
      }),
    );
  };

  const render = () => {
    renderInfo();
    renderStrip();
    show(cur);
  };

  /** Saves a changed animation (remembering the old one for undo). */
  const commit = (next: FliFrames, select = cur) => {
    if (!next.frames.length) {
      toast('An animation needs at least one frame.', 'error');
      return;
    }
    undo.push(anim);
    if (undo.length > 50) undo.shift();
    redo.length = 0;
    anim = next;
    cur = Math.max(0, Math.min(next.frames.length - 1, select));
    project.files.set(file, encodeFliFrames(anim));
    render();
  };
  const history = (from: FliFrames[], to: FliFrames[]) => {
    const prev = from.pop();
    if (!prev) return;
    pause();
    to.push(anim);
    anim = prev;
    cur = Math.min(cur, anim.frames.length - 1);
    project.files.set(file, encodeFliFrames(anim));
    render();
  };
  const withFrames = (frames: FliFrame[], select?: number) => commit({ ...anim, frames }, select);

  const move = (from: number, to: number) => {
    const frames = [...anim.frames];
    const [f] = frames.splice(from, 1);
    frames.splice(to, 0, f);
    withFrames(frames, to);
  };
  const duplicate = () => {
    const frames = [...anim.frames];
    frames.splice(cur + 1, 0, frames[cur]);
    withFrames(frames, cur + 1);
  };
  const remove = () => {
    if (anim.frames.length === 1) return toast('An animation needs at least one frame.', 'error');
    withFrames(
      anim.frames.filter((_, i) => i !== cur),
      cur,
    );
  };
  const insert = (added: FliFrame[]) => {
    if (!added.length) return;
    const after = cur + 1;
    const frames = [...anim.frames];
    frames.splice(after, 0, ...added);
    withFrames(frames, after);
    toast(`Added ${added.length} frame${added.length === 1 ? '' : 's'} after frame ${after}.`);
  };

  speedInput.addEventListener('change', () => {
    const v = Math.max(0, Math.min(1000, Math.round(Number(speedInput.value) || 0)));
    if (v !== anim.speed) commit({ ...anim, speed: v });
  });

  const fromGame = async () => {
    const name = await pickFile(project, 'gif', { title: 'Add a picture as a frame' });
    if (!name) return;
    const bytes = project.files.get(name);
    if (!bytes || !isGif(bytes)) return toast('That picture could not be read.', 'error');
    const g = decodeGif(bytes);
    insert([{ pixels: fitPicture(g.pixels, g.width, g.height, anim.width, anim.height), palette: g.palette.slice() }]);
  };
  const fromComputer = async () => {
    const files = await pickFiles({ multiple: true, accept: 'image/*' });
    if (!files.length) return;
    // in this animation's colors (the current frame's), so the palette doesn't jump
    const palette = anim.frames[cur].palette;
    const added: FliFrame[] = [];
    try {
      for (const f of files) {
        const { frames } = await decodeFrames(f);
        for (const bm of frames) added.push({ pixels: remap(rgbaOf(bm, anim.width, anim.height, 'fit'), palette, { dither: true }), palette });
      }
    } catch {
      toast('That picture could not be read.', 'error');
    }
    insert(added);
  };

  const exportFrame = async () =>
    download(`${base}-${String(cur + 1).padStart(2, '0')}.png`, await framePng(anim.frames[cur], anim.width, anim.height), 'image/png');
  const exportAll = async () => {
    const entries = await Promise.all(
      anim.frames.map(async (f, i) => ({ name: `${base}-${String(i + 1).padStart(2, '0')}.png`, data: await framePng(f, anim.width, anim.height) })),
    );
    download(`${base}-frames.zip`, await createZip(entries), 'application/zip');
  };

  /** Runs an export, showing its progress on the button. */
  const busy = async (btn: HTMLButtonElement, work: (progress: (f: number) => void) => Promise<void>) => {
    if (btn.disabled) return;
    const label = btn.textContent;
    btn.disabled = true;
    try {
      await work((f) => (btn.textContent = `${label} ${Math.round(f * 100)}%`));
    } catch (e) {
      toast(`That didn’t work: ${(e as Error).message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  };
  const gifBtn: HTMLButtonElement = h(
    'button',
    { title: `The whole animation as an animated GIF at ${anim.width}×${anim.height}, looping, at its speed` },
    '⬇ Animated GIF',
  );
  gifBtn.addEventListener('click', () =>
    busy(gifBtn, async () => {
      const ms = frameSeconds() * 1000;
      const gif = encodeAnimatedGif(
        anim.width,
        anim.height,
        anim.frames.map((f) => ({ pixels: f.pixels, palette: f.palette, ms })),
      );
      download(`${base}.gif`, gif, 'image/gif');
    }),
  );
  const mp4Btn: HTMLButtonElement = h(
    'button',
    { title: `The whole animation as a video at ${anim.width}×${anim.height}, frame times exact to 1/70 s` },
    '⬇ MP4 video',
  );
  mp4Btn.addEventListener('click', () =>
    busy(mp4Btn, async (progress) => {
      const a = anim;
      const { blob, ext } = await framesToVideo(
        {
          width: a.width,
          height: a.height,
          count: a.frames.length,
          timescale: RETRACE,
          duration: () => Math.max(1, a.speed),
          paint: (i, c) => paintIndexed(c, a.frames[i].pixels, a.width, a.height, a.frames[i].palette),
        },
        progress,
      );
      download(`${base}.${ext}`, new Uint8Array(await blob.arrayBuffer()), blob.type);
      if (ext !== 'mp4') toast('This browser can’t make MP4 video, so it is a WebM.');
    }),
  );

  const keys = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === '.') (pause(), show(cur + 1));
    else if (e.key === 'ArrowLeft' || e.key === ',') (pause(), show(cur - 1));
    else if (e.key === 'Home') (pause(), show(0));
    else if (e.key === 'End') (pause(), show(anim.frames.length - 1));
    else if (e.key === ' ' && t.tagName !== 'BUTTON') playing ? pause() : play();
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') history(...(e.shiftKey ? ([redo, undo] as const) : ([undo, redo] as const)));
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') history(redo, undo);
    else if ((e.key === 'Delete' || e.key === 'Backspace') && t.closest('.fli-strip')) remove();
    else return;
    e.preventDefault();
  };

  clear(
    host,
    h(
      'div',
      { class: 'fli-edit', onkeydown: keys, tabIndex: -1 },
      info,
      h('div', { class: 'fli-monitor' }, stage),
      h(
        'div',
        { class: 'toolbar fli-transport' },
        h('button', { title: 'First frame (Home)', 'aria-label': 'First frame', onclick: () => (pause(), show(0)) }, '⏮'),
        h('button', { title: 'Previous frame (←)', 'aria-label': 'Previous frame', onclick: () => (pause(), show(cur - 1)) }, '◀'),
        playBtn,
        h('button', { title: 'Next frame (→)', 'aria-label': 'Next frame', onclick: () => (pause(), show(cur + 1)) }, '▶'),
        h('button', { title: 'Last frame (End)', 'aria-label': 'Last frame', onclick: () => (pause(), show(anim.frames.length - 1)) }, '⏭'),
        loopBtn,
        counter,
        scrub,
      ),
      h(
        'div',
        { class: 'fli-speed-row' },
        h('label', { class: 'fli-speed-label' }, h('span', null, 'Speed'), speedInput, h('small', null, '/70 s per frame')),
        h(
          'div',
          { class: 'seg fli-presets' },
          ...SPEEDS.map(([v, label]) =>
            h('button', { type: 'button', title: `${v}/70 s per frame`, onclick: () => v !== anim.speed && commit({ ...anim, speed: v }) }, label),
          ),
        ),
        speedNote,
      ),
      strip,
      h(
        'div',
        { class: 'toolbar fli-actions' },
        h('button', { title: 'Copy this frame (show it twice as long)', onclick: duplicate }, '⧉ Duplicate'),
        h('button', { title: 'Move this frame earlier', onclick: () => cur > 0 && move(cur, cur - 1) }, '← Move'),
        h('button', { title: 'Move this frame later', onclick: () => cur < anim.frames.length - 1 && move(cur, cur + 1) }, 'Move →'),
        h('button', { class: 'danger', title: 'Delete this frame (Delete)', onclick: remove }, '🗑 Delete'),
        h('span', { class: 'spacer' }),
        h('button', { title: 'Add a GIF picture from this game or the library after this frame', onclick: () => void fromGame() }, '+ Picture…'),
        h(
          'button',
          { title: 'Add pictures (or the frames of an animated GIF) from your computer, in this animation’s colors', onclick: () => void fromComputer() },
          '+ From my computer…',
        ),
      ),
      h(
        'div',
        { class: 'toolbar fli-actions fli-export' },
        h('button', { onclick: () => void exportFrame() }, '⬇ This frame as PNG'),
        h('button', { onclick: () => void exportAll() }, '⬇ All frames (.zip of PNGs)'),
        gifBtn,
        mp4Btn,
        h('span', { class: 'spacer' }),
        undoBtn,
        redoBtn,
      ),
      h(
        'p',
        { class: 'hint fli-help' },
        'Every frame of an .FLI is shown for the same time. To hold a picture longer, duplicate its frame. In the game an animation plays once, then the slide show waits for its pause. Keys: Space play/pause, ← → step, Home/End.',
      ),
    ),
  );
  render();
  if (urlFrame === undefined) play();
  return () => pause();
});
