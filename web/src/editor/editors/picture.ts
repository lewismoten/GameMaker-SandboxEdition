// Pictures (.GIF): view, import, and copy 20x20 areas into blocks (IMAGE.EXE).
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { h, clear, selectField, numberField, pickFiles, toast, download } from '../ui';
import { paintIndexed } from '../draw';
import { decodeGif, encodeGif, isGif, type IndexedImage } from '../../formats/gif';
import { matchColor, parsePalette, type Palette } from '../../formats/palette';
import { BLEN, BACKBL, BLOCK_COUNTS, BLOCK_SIZE, parseBlocks, serializeBlocks, type BlockKind } from '../../formats/blocks';
import { gamePreview } from './mediaShared';

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

  let replacePal = '';
  const preview = gamePreview(project, file);
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      'Click the picture to choose a 20×20 area (Shift-click snaps to the block grid), then copy it into a block — the way Game-Maker’s IMAGE tool grabbed blocks from pictures.',
    ),
    canvas,
    info,
    h(
      'div',
      { class: 'panel toolbar', style: 'margin-top:8px' },
      fileField(
        project,
        'Block set',
        ['bbl', 'mbl', 'cbl'],
        () => target,
        (v) => v && (target = v),
        { allowNone: false },
      ),
      numberField(
        'Block number',
        () => targetBlock,
        (v) => (targetBlock = v),
        { min: 0, max: BACKBL - 1 },
      ),
      selectField(
        'Colors',
        [
          [1, 'Match the block set’s palette'],
          [0, 'Copy color numbers as they are'],
        ] as [number, string][],
        () => (remap ? 1 : 0),
        (v) => (remap = !!v),
      ),
      h('button', { class: 'primary', onclick: grab }, 'Copy into block'),
    ),
    h(
      'div',
      { class: 'panel toolbar', style: 'margin-top:8px' },
      fileField(
        project,
        'Palette for imported pictures',
        ['pal'],
        () => replacePal,
        (v) => (replacePal = v),
        { noneLabel: ['This picture’s palette', 'keep the colors it has'] },
      ),
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
