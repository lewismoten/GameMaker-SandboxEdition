// Pictures, animations, backdrops, text screens, slide shows, music, samples,
// demo recordings and high score tables.
import { registerEditor } from './index';
import { h, clear, selectField, numberField, debounce, pickFiles, toast, download } from '../ui';
import { paintIndexed } from '../draw';
import type { Project } from '../project';
import { Machine, GameAborted } from '../../engine/machine';
import { showGraphic } from '../../engine/showGraphic';
import { AudioEngine } from '../../audio/engine';
import { GameFiles } from '../../project/files';
import { decodeGif, encodeGif, isGif, type IndexedImage } from '../../formats/gif';
import { applyFliFrame, newFliCanvas, parseFli } from '../../formats/fli';
import { parseBackdrop, serializeBackdrop, parseSlideList, serializeSlideList, textLines, type SlideEntry } from '../../formats/graphicScripts';
import { latin1Text, textBytes } from '../../formats/binary';
import { matchColor, parsePalette, type Palette } from '../../formats/palette';
import { parseCmf, CMF_GAMEMAKER_CLOCK } from '../../formats/cmf';
import { decodeVoc } from '../../formats/voc';
import { parseRecording } from '../../formats/recording';
import { parseHighScores, serializeHighScores } from '../../formats/highscore';
import { BLEN, BACKBL, BLOCK_COUNTS, BLOCK_SIZE, parseBlocks, serializeBlocks, type BlockKind } from '../../formats/blocks';
import { scanName } from '../../input/scancodes';
import { GRAPHIC_EXTS } from '../../formats/game';

const audio = new AudioEngine();

/** Shows a graphic file exactly as the game would, in a small embedded screen. */
function gamePreview(project: Project, file: string): { el: HTMLElement; stop: () => void } {
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:640px;aspect-ratio:4/3;background:#000;border-radius:6px' });
  let machine: Machine | undefined;
  const run = async () => {
    machine?.destroy();
    machine = new Machine(canvas, new GameFiles(project.files.entries()), audio);
    machine.keyboard.attach(canvas);
    canvas.tabIndex = 0;
    canvas.focus();
    const pal = project.paletteFor(file).palette;
    machine.screen.setPalette(pal);
    machine.screen.clear();
    try {
      await showGraphic(machine, file, { gamePalette: pal });
    } catch (e) {
      if (!(e instanceof GameAborted)) throw e;
    }
  };
  const el = h('div', { class: 'stack' }, h('div', { class: 'toolbar' }, h('button', { class: 'primary', onclick: () => void audio.resume().then(run) }, '▶ Preview as in the game'), h('span', { class: 'meta' }, 'Press a key or click to move on.')), canvas);
  return { el, stop: () => machine?.destroy() };
}

// ---- pictures -----------------------------------------------------------------

function quantize(img: ImageData, pal: Palette): Uint8Array {
  const out = new Uint8Array(img.width * img.height);
  const cache = new Map<number, number>();
  for (let i = 0; i < out.length; i++) {
    const r = img.data[i * 4] >> 2;
    const g = img.data[i * 4 + 1] >> 2;
    const b = img.data[i * 4 + 2] >> 2;
    const key = (r << 12) | (g << 6) | b;
    let v = cache.get(key);
    if (v === undefined) {
      v = matchColor(pal, r, g, b);
      cache.set(key, v);
    }
    out[i] = v;
  }
  return out;
}

async function importImage(file: File, pal: Palette): Promise<IndexedImage> {
  const bmp = await createImageBitmap(file);
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 200;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, 320, 200);
  return { width: 320, height: 200, pixels: quantize(ctx.getImageData(0, 0, 320, 200), pal), palette: pal.slice() };
}

registerEditor(['gif'], (host, project, file) => {
  const bytes = project.files.get(file)!;
  if (!isGif(bytes)) {
    clear(host, h('p', { class: 'hint' }, 'This file is named .gif but is not a GIF picture (the original game ignores it too).'));
    return;
  }
  let img = decodeGif(bytes);
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:960px;border-radius:6px;cursor:crosshair;image-rendering:pixelated' });
  const overlay = { x: 0, y: 0 };
  const info = h('div', { class: 'meta' });
  const draw = () => {
    paintIndexed(canvas, img.pixels, img.width, img.height, img.palette);
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#ffd400';
    ctx.strokeRect(overlay.x + 0.5, overlay.y + 0.5, BLEN - 1, BLEN - 1);
    info.textContent = `${img.width}×${img.height} pixels. Grab area at (${overlay.x}, ${overlay.y}).`;
  };
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    overlay.x = Math.max(0, Math.min(img.width - BLEN, Math.floor(((e.clientX - r.left) / r.width) * img.width) - BLEN / 2));
    overlay.y = Math.max(0, Math.min(img.height - BLEN, Math.floor(((e.clientY - r.top) / r.height) * img.height) - BLEN / 2));
    if (e.shiftKey) {
      overlay.x -= overlay.x % BLEN;
      overlay.y -= overlay.y % BLEN;
    }
    draw();
  });

  const blockFiles = ['bbl', 'mbl', 'cbl'].flatMap((e) => project.files.byExtension(e));
  let target = blockFiles[0] ?? '';
  let targetBlock = 0;
  let remap = true;
  const grab = () => {
    if (!target) return toast('Create a block set first.', 'error');
    const kind = target.split('.').pop() as BlockKind;
    const raw = project.files.get(target)!;
    const blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS[kind], Math.ceil(raw.length / BLOCK_SIZE)));
    const destPal = project.paletteFor(target).palette;
    const b = blocks[Math.min(targetBlock, blocks.length - 1)];
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const v = img.pixels[(overlay.y + y) * img.width + overlay.x + x];
        b.pixels[y * BLEN + x] = remap ? matchColor(destPal, img.palette[v * 3], img.palette[v * 3 + 1], img.palette[v * 3 + 2]) : v;
      }
    project.files.set(target, serializeBlocks(blocks));
    toast(`Copied into block ${targetBlock} of ${target}.`);
  };

  const pals = project.files.byExtension('pal');
  let replacePal = '';
  const preview = gamePreview(project, file);
  clear(
    host,
    h('p', { class: 'hint' }, 'Click the picture to choose a 20×20 area (Shift-click snaps to the block grid), then copy it into a block — the way Game-Maker’s IMAGE tool grabbed blocks from pictures.'),
    canvas,
    info,
    h(
      'div',
      { class: 'panel toolbar', style: 'margin-top:8px' },
      selectField('Block set', blockFiles.map((f) => [f, f] as [string, string]), () => target, (v) => (target = v)),
      numberField('Block number', () => targetBlock, (v) => (targetBlock = v), { min: 0, max: BACKBL - 1 }),
      selectField('Colors', [[1, 'Match the block set’s palette'], [0, 'Copy color numbers as they are']] as [number, string][], () => (remap ? 1 : 0), (v) => (remap = !!v)),
      h('button', { class: 'primary', onclick: grab }, 'Copy into block'),
    ),
    h(
      'div',
      { class: 'panel toolbar', style: 'margin-top:8px' },
      selectField('Palette for imported pictures', [['', 'This picture’s palette'], ...pals.map((p) => [p, p] as [string, string])], () => replacePal, (v) => (replacePal = v)),
      h(
        'button',
        {
          onclick: async () => {
            const [f] = await pickFiles({ multiple: false, accept: 'image/*' });
            if (!f) return;
            img = await importImage(f, replacePal ? parsePalette(project.files.get(replacePal)!) : img.palette);
            project.files.set(file, encodeGif(img));
            draw();
            toast('Picture replaced (scaled to 320×200).');
          },
        },
        'Replace with an image file…',
      ),
      h(
        'button',
        {
          onclick: () =>
            canvas.toBlob(async (b) => {
              if (b) download(file.replace(/\.gif$/, '.png'), new Uint8Array(await b.arrayBuffer()), 'image/png');
            }),
        },
        'Download as PNG',
      ),
    ),
    h('div', { style: 'height:12px' }),
    preview.el,
  );
  draw();
  return preview.stop;
});

// ---- animations -----------------------------------------------------------------

registerEditor(['fli'], (host, project, file) => {
  const anim = parseFli(project.files.get(file)!);
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:640px;background:#000;border-radius:6px' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const play = () => {
    clearTimeout(timer);
    const c = newFliCanvas(anim);
    let f = 0;
    const step = () => {
      applyFliFrame(anim, f, c);
      paintIndexed(canvas, c.pixels, anim.width, anim.height, c.palette);
      f++;
      if (f < anim.frameCount) timer = setTimeout(step, (Math.max(1, anim.speed) * 1000) / 70);
    };
    step();
  };
  clear(host, h('p', { class: 'hint' }, `${anim.width}×${anim.height}, ${anim.frameCount} frames, ${anim.speed}/70 s per frame. Animations play once, then the game waits for the pause given in a slide show.`), h('div', { class: 'toolbar', style: 'margin-bottom:8px' }, h('button', { class: 'primary', onclick: play }, '▶ Play')), canvas);
  play();
  return () => clearTimeout(timer);
});

// ---- backdrops ------------------------------------------------------------------

registerEditor(['bkd'], (host, project, file) => {
  const bkd = parseBackdrop(project.files.get(file)!);
  const save = () => project.files.set(file, serializeBackdrop(bkd));
  const preview = gamePreview(project, file);
  const gifs = project.files.byExtension('gif');
  clear(
    host,
    h('p', { class: 'hint' }, 'A backdrop shows a 320×200 window of a larger GIF picture, starting at the given corner.'),
    h(
      'div',
      { class: 'panel toolbar' },
      selectField('Picture', [['', '— choose —'], ...gifs.map((g) => [g, g] as [string, string])], () => bkd.gif.toLowerCase(), (v) => ((bkd.gif = v), save())),
      numberField('Left (x)', () => bkd.x, (v) => ((bkd.x = v), save()), { min: 0, max: 32767 }),
      numberField('Top (y)', () => bkd.y, (v) => ((bkd.y = v), save()), { min: 0, max: 32767 }),
    ),
    h('div', { style: 'height:12px' }),
    preview.el,
  );
  return preview.stop;
});

// ---- text screens ---------------------------------------------------------------

registerEditor(['txt'], (host, project, file) => {
  const area = h('textarea', { rows: 22, spellcheck: true, style: 'width:100%;max-width:34ch;font:14px/1.3 ui-monospace,monospace' });
  area.value = latin1Text(project.files.get(file)!).replace(/\x1a.*$/s, '').replace(/\r\n/g, '\n');
  const note = h('div', { class: 'meta' });
  const save = debounce(() => {
    project.files.set(file, textBytes(area.value.replace(/\n/g, '\r\n')));
  }, 300);
  const update = () => {
    const lines = textLines(textBytes(area.value));
    note.textContent = `${lines.length} lines → ${Math.max(1, Math.ceil(lines.length / 16))} page(s) of 16 lines. Lines longer than 31 characters wrap.`;
  };
  area.addEventListener('input', () => {
    update();
    save();
  });
  const preview = gamePreview(project, file);
  update();
  clear(host, h('p', { class: 'hint' }, 'Text screens are shown over the current picture, 31 characters per line and 16 lines per page.'), h('div', { class: 'row' }, h('div', { class: 'stack', style: 'flex:0 0 auto' }, area, note), h('div', { style: 'flex:1 1 420px' }, preview.el)));
  return preview.stop;
});

// ---- slide shows ----------------------------------------------------------------

registerEditor(['lst'], (host, project, file) => {
  const entries: SlideEntry[] = parseSlideList(project.files.get(file)!);
  const save = () => project.files.set(file, serializeSlideList(entries));
  const options = (): [string, string][] => project.files.names().filter((n) => GRAPHIC_EXTS.some((e) => n.endsWith(`.${e}`)) && n !== file).map((n) => [n, n]);
  const table = h('tbody');
  const preview = gamePreview(project, file);
  const render = () =>
    clear(
      table,
      ...entries.map((e, i) =>
        h(
          'tr',
          null,
          h('td', null, i + 1),
          h('td', null, selectField('', [...options(), ...(options().some(([n]) => n === e.name) ? [] : [[e.name, `${e.name} (missing)`] as [string, string]])], () => e.name, (v) => ((e.name = v), save()))),
          h(
            'td',
            null,
            selectField('', [[-1, 'Wait for a key'], [0, 'Don’t wait'], [1, 'Seconds…']] as [number, string][], () => (e.pause === undefined ? -1 : e.pause === 0 ? 0 : 1), (v) => {
              e.pause = v === -1 ? undefined : v === 0 ? 0 : 5;
              save();
              render();
            }),
          ),
          h('td', null, e.pause && e.pause > 0 ? numberField('', () => e.pause!, (v) => ((e.pause = v), save()), { min: 1, max: 32767 }) : ''),
          h(
            'td',
            null,
            h('button', { onclick: () => (i > 0 && ([entries[i - 1], entries[i]] = [entries[i], entries[i - 1]]), save(), render()) }, '↑'),
            h('button', { onclick: () => (entries.splice(i, 1), save(), render()) }, '✕'),
          ),
        ),
      ),
    );
  render();
  clear(
    host,
    h('p', { class: 'hint' }, 'A slide show plays pictures, animations and text screens in order. Esc skips the rest.'),
    h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Show'), h('th', null, 'Then'), h('th', null, ''), h('th', null, ''))), table),
    h('div', { class: 'toolbar', style: 'margin:8px 0' }, h('button', { onclick: () => (entries.push({ name: options()[0]?.[0] ?? '', pause: undefined }), save(), render()) }, '+ Add')),
    preview.el,
  );
  return preview.stop;
});

// ---- music and samples ------------------------------------------------------------

registerEditor(['cmf'], (host, project, file) => {
  const bytes = project.files.get(file)!;
  const cmf = parseCmf(bytes);
  const ok = cmf.clockTicks === CMF_GAMEMAKER_CLOCK;
  clear(
    host,
    h('p', { class: 'hint' }, `Sound Blaster FM music: ${cmf.instruments.length} instruments, ${cmf.music.length.toLocaleString()} bytes of notes, ${cmf.clockTicks} ticks per second.`),
    ok ? null : h('p', { class: 'hint', style: 'color:var(--danger)' }, 'This song was not converted for Game-Maker (it needs 146 ticks per second), so games will not play it.'),
    h(
      'div',
      { class: 'toolbar' },
      h(
        'button',
        {
          class: 'primary',
          onclick: async () => {
            await audio.resume();
            if (!(await audio.playSong(bytes))) toast('This song cannot be played.', 'error');
          },
        },
        '▶ Play',
      ),
      h('button', { onclick: () => audio.stopSong() }, '■ Stop'),
    ),
  );
  return () => audio.stopSong();
});

registerEditor(['voc'], (host, project, file) => {
  const bytes = project.files.get(file)!;
  const voc = decodeVoc(bytes);
  clear(
    host,
    h('p', { class: 'hint' }, `Sound Blaster sample: ${(voc.samples.length / voc.sampleRate).toFixed(2)} s at ${voc.sampleRate} Hz. Sound sets refer to it as “${file.replace(/\.voc$/, '')}”.`),
    h('button', { class: 'primary', onclick: async () => (await audio.resume(), audio.playVoc(bytes)) }, '▶ Play'),
  );
  return () => audio.stopVoc();
});

registerEditor(['rec'], (host, project, file) => {
  const keys = parseRecording(project.files.get(file)!);
  const ticks = keys.reduce((n, k) => n + k.delta, 0);
  clear(
    host,
    h('p', { class: 'hint' }, `A recorded game: ${keys.length} key events over about ${(ticks / 18.2).toFixed(0)} seconds. Set it as the start scene’s demo recording to play it when the menu sits idle.`),
    h(
      'table',
      { class: 'data' },
      h('thead', null, h('tr', null, h('th', null, 'After (ticks)'), h('th', null, 'Key'))),
      h('tbody', null, ...keys.slice(0, 200).map((k) => h('tr', null, h('td', null, k.delta), h('td', null, `${scanName(k.key & 0x7f)} ${k.key & 0x80 ? 'up' : 'down'}`)))),
    ),
  );
});

registerEditor(['his'], (host, project, file) => {
  const scores = parseHighScores(project.files.get(file)!);
  const save = () => project.files.set(file, serializeHighScores(scores));
  const body = h('tbody');
  const render = () =>
    clear(
      body,
      ...scores.map((s, i) =>
        h(
          'tr',
          null,
          h('td', null, i + 1),
          h('td', null, numberField('', () => s.score, (v) => ((s.score = v), save()), { min: 0 })),
          h(
            'td',
            null,
            (() => {
              const input = h('input', { type: 'text', value: s.name, maxLength: 22 });
              input.addEventListener('change', () => ((s.name = input.value), save()));
              return input;
            })(),
          ),
        ),
      ),
    );
  render();
  clear(
    host,
    h('p', { class: 'hint' }, 'The top ten scores shipped with the game.'),
    h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Score'), h('th', null, 'Name'))), body),
    h('div', { class: 'toolbar', style: 'margin-top:8px' }, h('button', { onclick: () => (scores.forEach((s) => ((s.score = 0), (s.name = ''))), save(), render()) }, 'Clear all')),
  );
});
