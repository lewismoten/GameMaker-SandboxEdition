// Backdrops (.BKD): a 320x200 window of a larger GIF picture. The picture is found the way
// PLAYGAME's drawbkd opens it (the name up to a newline, any case, cut to 8.3, or under the
// underscore name the CD gave it); a missing picture is brought in from the library.
import './backdrop.css';
import { registerEditor } from '../registry';
import { fileField } from '../../widgets/filePicker';
import { h, clear, download, numberField, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import { libraryGame, libraryItems, type LibraryItem } from '../../core/library';
import { parseBackdrop, serializeBackdrop } from '../../../formats/graphicScripts';
import { cdName, normalize } from '../../../project/files';
import { SIZEX, SIZEY } from '../../../gfx/screen';
import { gamePreview } from '../../widgets/mediaShared';
import { fileUndo } from '../../core/fileUndo';
import { backdropInfo, blankScreen, pictureScreen, screenCanvas } from '../../widgets/mediaPictures';
import { lut, paintIndexed } from '../../core/draw';
import { encodeAnimatedGif, type GifFrame } from '../../../media/gifEncode';
import { pngOf } from '../../../media/screenCapture';
import { createZip } from '../../../project/zip';
import type { ScreenPicture } from '../../widgets/mediaPictures';

const base = (name: string) => name.replace(/\.[^.]*$/, '');

/** A screen (or any indexed picture) as PNG bytes. */
function pngBytes(pixels: Uint8Array, w: number, hgt: number, palette: Uint8Array): Promise<Uint8Array> {
  const c = document.createElement('canvas');
  paintIndexed(c, pixels, w, hgt, palette);
  return pngOf(c);
}

/** FadeTo from black: 65 steps over 65/70 s, as the game brings a backdrop in; then it holds. */
function fadeInFrames(pic: ScreenPicture, holdMs = 2000): GifFrame[] {
  const steps = 65;
  const frames: GifFrame[] = [];
  for (let step = 0; step <= steps; step++) {
    const palette = pic.palette.map((v) => Math.trunc((v * step) / steps));
    frames.push({ pixels: pic.pixels, palette, ms: step === steps ? holdMs : 1000 / 70 });
  }
  return frames;
}

/** Library pictures with the name a backdrop gives; the ones from a game that has this backdrop first. */
async function libraryMatches(gif: string, bkdName: string): Promise<LibraryItem[]> {
  const want = new Set([normalize(gif), cdName(gif)]);
  const items = (await libraryItems('gif')).filter((i) => want.has(normalize(i.name)));
  const hasBkd = (i: LibraryItem) => i.game.files.some((f) => normalize(f) === normalize(bkdName));
  return items.sort((a, b) => Number(hasBkd(b)) - Number(hasBkd(a)));
}

/** Copies a library picture into the game under the name the backdrop gives. */
async function bring(project: Project, item: LibraryItem, gif: string): Promise<string | undefined> {
  const files = await libraryGame(item.game);
  const bytes = files.get(item.name);
  if (!bytes) return undefined;
  const name = normalize(gif).replace(/[^a-z0-9_.$~!#%&'(){}@^`-]/g, '_');
  project.files.set(name, bytes.slice());
  return name;
}

registerEditor(['bkd'], (host, project, file) => {
  const bkd = parseBackdrop(project.files.get(file)!);
  // Undo takes back a moved window or another picture (steps of the arrow keys held down are one)
  const undo = fileUndo(project.files, () => {
    const now = project.files.get(file);
    if (now) Object.assign(bkd, parseBackdrop(now));
    refresh();
  });
  const stopKeys = undo.listenKeys();
  const save = () => {
    undo.before(file);
    project.files.set(file, serializeBackdrop(bkd));
  };

  const whole = h('canvas', { class: 'pixel bkd-whole', tabIndex: 0, 'aria-label': 'The whole picture: drag the window, or use the arrow keys' });
  const fields = h('div', { class: 'bkd-fields' });
  const status = h('div', { class: 'bkd-status', role: 'status' });
  const size = h('span', { class: 'meta' });
  let searched = '';

  const preview = gamePreview(project, file, {
    className: 'bkd-preview',
    hint: 'The game fades the window in from black.',
    onEnd: () => drawScreen(),
  });

  const drawScreen = () => {
    if (preview.running()) return;
    screenCanvas(pictureScreen(project.files, file) ?? blankScreen(), 'pixel', preview.canvas);
  };

  const drawWhole = () => {
    const info = backdropInfo(project.files, project.files.get(file) ?? serializeBackdrop(bkd));
    const img = info.image;
    const ctx = whole.getContext('2d')!;
    if (!img) {
      whole.width = SIZEX;
      whole.height = SIZEY;
      ctx.fillStyle = '#16161f';
      ctx.fillRect(0, 0, SIZEX, SIZEY);
      ctx.fillStyle = '#8888aa';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${bkd.gif.toUpperCase() || 'No picture'} — missing`, SIZEX / 2, SIZEY / 2);
      size.textContent = '';
      drawScreen();
      return;
    }
    whole.width = img.width;
    whole.height = img.height;
    whole.style.setProperty('--ar', String(img.width / Math.max(1, img.height)));
    const data = ctx.createImageData(img.width, img.height);
    const out = new Uint32Array(data.data.buffer);
    const l = lut(img.palette);
    for (let i = 0; i < img.pixels.length; i++) out[i] = l[img.pixels[i]];
    ctx.putImageData(data, 0, 0);
    // dim what the window leaves out
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, img.width, img.height);
    ctx.rect(bkd.x + SIZEX, bkd.y, -SIZEX, SIZEY);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = Math.max(2, img.width / 300);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(bkd.x, bkd.y, SIZEX, SIZEY);
    size.textContent = `Picture ${img.width}×${img.height} · window at ${bkd.x}, ${bkd.y}`;
    drawScreen();
  };

  const renderStatus = () => {
    const resolved = project.files.resolve(bkd.gif);
    if (!bkd.gif) return clear(status, h('div', { class: 'bkd-note warn' }, 'Choose the picture this backdrop shows.'));
    if (resolved && resolved !== normalize(bkd.gif))
      return clear(
        status,
        h(
          'div',
          { class: 'bkd-note info' },
          `This backdrop names ${bkd.gif.toUpperCase()}, which is ${resolved.toUpperCase()} here (the Game-Maker CD could only use letters, digits and _ in file names). `,
          h('button', { onclick: () => ((bkd.gif = resolved.toUpperCase()), save(), refresh()) }, `Name it ${resolved.toUpperCase()}`),
        ),
      );
    if (resolved) return clear(status);
    const note = h('div', { class: 'bkd-note warn' }, `${bkd.gif.toUpperCase()} is not in this game, so the game would stop with “Error Opening Gif”. `);
    clear(status, note);
    if (searched === bkd.gif) return;
    searched = bkd.gif;
    const gif = bkd.gif;
    note.append(h('span', { class: 'meta' }, 'Looking in the library…'));
    void libraryMatches(gif, file).then(async (items) => {
      if (gif !== bkd.gif) return;
      note.lastChild?.remove();
      if (!items.length) {
        note.append('It is not in the library either: choose another picture.');
        return;
      }
      const first = items[0];
      // The library game this backdrop came from has the picture: bring it in.
      if (first.game.files.some((f) => normalize(f) === normalize(file)) || items.length === 1) {
        const name = await bring(project, first, gif);
        if (name) {
          toast(`Brought ${name.toUpperCase()} from ${first.game.title} into this game.`);
          refresh();
          return;
        }
      }
      note.append(
        'Bring it from the library: ',
        ...items.map((i) => h('button', { onclick: async () => (await bring(project, i, gif)) && refresh() }, `${i.name.toUpperCase()} (${i.game.title})`)),
      );
    });
  };

  const renderFields = () =>
    clear(
      fields,
      fileField(
        project,
        'Picture',
        ['gif'],
        () => project.files.resolve(bkd.gif) ?? bkd.gif.toLowerCase(),
        (v) => ((bkd.gif = v.toUpperCase()), save(), refresh()),
        { allowNone: false },
      ),
      numberField(
        'Left (x)',
        () => bkd.x,
        (v) => ((bkd.x = v), save(), drawWhole()),
        { min: 0, max: 32767 },
      ),
      numberField(
        'Top (y)',
        () => bkd.y,
        (v) => ((bkd.y = v), save(), drawWhole()),
        { min: 0, max: 32767 },
      ),
    );

  const refresh = () => {
    renderFields();
    renderStatus();
    drawWhole();
  };

  const clampTo = (x: number, y: number) => {
    bkd.x = Math.max(0, Math.min(Math.max(0, whole.width - SIZEX), Math.round(x)));
    bkd.y = Math.max(0, Math.min(Math.max(0, whole.height - SIZEY), Math.round(y)));
  };
  let drag: { x: number; y: number; bx: number; by: number } | undefined;
  whole.addEventListener('pointerdown', (e) => {
    whole.setPointerCapture(e.pointerId);
    const r = whole.getBoundingClientRect();
    const k = whole.width / r.width;
    const px = (e.clientX - r.left) * k;
    const py = (e.clientY - r.top) * k;
    // Clicking outside the window moves it there first.
    if (px < bkd.x || py < bkd.y || px > bkd.x + SIZEX || py > bkd.y + SIZEY) {
      clampTo(px - SIZEX / 2, py - SIZEY / 2);
      drawWhole();
    }
    drag = { x: px, y: py, bx: bkd.x, by: bkd.y };
  });
  whole.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = whole.getBoundingClientRect();
    const k = whole.width / r.width;
    clampTo(drag.bx + (e.clientX - r.left) * k - drag.x, drag.by + (e.clientY - r.top) * k - drag.y);
    drawWhole();
  });
  const endDrag = () => {
    if (!drag) return;
    drag = undefined;
    save();
    renderFields();
  };
  whole.addEventListener('pointerup', endDrag);
  whole.addEventListener('pointercancel', endDrag);
  whole.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 20 : 1;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    clampTo(bkd.x + d[0], bkd.y + d[1]);
    save();
    renderFields();
    drawWhole();
  });

  // ---- downloads -------------------------------------------------------------------
  const screenNow = () => pictureScreen(project.files, file);
  const exportScreen = async () => {
    const pic = screenNow();
    if (!pic) return toast('The picture is missing, so there is nothing to save.', 'error');
    download(`${base(file)}.png`, await pngBytes(pic.pixels, SIZEX, SIZEY, pic.palette), 'image/png');
  };
  const exportWhole = async () => {
    const img = backdropInfo(project.files, project.files.get(file) ?? serializeBackdrop(bkd)).image;
    if (!img) return toast('The picture is missing, so there is nothing to save.', 'error');
    download(`${base(bkd.gif.toLowerCase()) || base(file)}-whole.png`, await pngBytes(img.pixels, img.width, img.height, img.palette), 'image/png');
  };
  const exportFade = () => {
    const pic = screenNow();
    if (!pic) return toast('The picture is missing, so there is nothing to save.', 'error');
    download(`${base(file)}-fade-in.gif`, encodeAnimatedGif(SIZEX, SIZEY, fadeInFrames(pic)), 'image/gif');
  };
  /** Every backdrop in the game that can be drawn, in name order. */
  const allScreens = () =>
    project.files
      .byExtension('bkd')
      .sort()
      .flatMap((name) => {
        const pic = pictureScreen(project.files, name);
        return pic ? [{ name, pic }] : [];
      });
  const exportAllPngs = async () => {
    const all = allScreens();
    if (!all.length) return toast('No backdrop here can be drawn.', 'error');
    const entries = await Promise.all(
      all.map(async ({ name, pic }) => ({ name: `${base(name)}.png`, data: await pngBytes(pic.pixels, SIZEX, SIZEY, pic.palette) })),
    );
    download(`${project.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'game'}-backdrops.zip`, await createZip(entries), 'application/zip');
  };
  const exportAllGif = () => {
    const all = allScreens();
    if (!all.length) return toast('No backdrop here can be drawn.', 'error');
    const frames = all.flatMap(({ pic }) => fadeInFrames(pic, 2500));
    download(`${project.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'game'}-backdrops.gif`, encodeAnimatedGif(SIZEX, SIZEY, frames), 'image/gif');
  };
  const exports = h(
    'div',
    { class: 'toolbar bkd-exports' },
    h('span', { class: 'meta' }, 'Download:'),
    h('button', { title: 'The 320×200 screen this backdrop shows, as a PNG', onclick: () => void exportScreen() }, '⬇ Screen (PNG)'),
    h('button', { title: 'The whole picture the window looks into, as a PNG', onclick: () => void exportWhole() }, '⬇ Whole picture (PNG)'),
    h('button', { title: 'The screen fading in from black the way the game shows it, as an animated GIF', onclick: exportFade }, '⬇ Fade-in (GIF)'),
    h('button', { title: 'Every backdrop in this game as 320×200 PNGs in a .zip', onclick: () => void exportAllPngs() }, '⬇ All backdrops (.zip)'),
    h('button', { title: 'Every backdrop in this game, one after another, as an animated GIF', onclick: exportAllGif }, '⬇ All backdrops (GIF)'),
  );

  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      'A backdrop shows a 320×200 window of a larger GIF picture. Drag the window over the picture (or use the arrow keys) to choose which part.',
    ),
    h('div', { class: 'panel bkd-top' }, fields, h('div', { class: 'toolbar bkd-undo' }, undo.undoBtn, undo.redoBtn), status),
    h(
      'div',
      { class: 'bkd-layout' },
      h('div', { class: 'bkd-pane' }, h('h3', null, 'The whole picture'), whole, size),
      h('div', { class: 'bkd-pane' }, h('h3', null, 'On the game screen'), preview.el),
    ),
    exports,
  );
  refresh();
  return () => {
    stopKeys();
    preview.stop();
  };
});
