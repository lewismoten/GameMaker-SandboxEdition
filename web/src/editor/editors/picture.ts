// Pictures (.GIF): view, import, and copy 20x20 areas into blocks (IMAGE.EXE).
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { h, clear, selectField, pickFiles, toast, download, confirmDialog } from '../core/ui';
import { blockCanvas, paintBlock, paintIndexed } from '../core/draw';
import './picture.css';
import { isBlankBlock } from './pictureLogic';
import { decodeGif, encodeGif, isGif, type IndexedImage } from '../../formats/gif';
import { matchColor, parsePalette, type Palette } from '../../formats/palette';
import { BLEN, BLOCK_COUNTS, BLOCK_SIZE, parseBlocks, serializeBlocks, type Block, type BlockKind } from '../../formats/blocks';
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
  const canvas = h('canvas', {
    class: 'pixel pic-canvas',
    role: 'img',
    'aria-label': `${file}: click to choose a 20 by 20 area to copy into a block`,
  });
  const overlay = { x: 0, y: 0 };
  const info = h('div', { class: 'meta' });
  const draw = () => {
    paintIndexed(canvas, img.pixels, img.width, img.height, img.palette);
    canvas.style.setProperty('--ar', String(img.width / Math.max(1, img.height)));
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(overlay.x - 0.5, overlay.y - 0.5, BLEN + 1, BLEN + 1);
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
    updatePreview();
  });

  // ---- copy into a block: the set's blocks, the slot being replaced, before → after ----
  const blockFiles = ['bbl', 'mbl', 'cbl'].flatMap((e) => project.files.byExtension(e));
  let target = blockFiles[0] ?? '';
  let targetBlock = 0;
  let remap = true;
  let advance = true;
  let blocks: Block[] = [];
  let destPal: Palette = img.palette;
  let kind: BlockKind = 'bbl';
  const slots = h('div', { class: 'pic-slots', role: 'listbox', 'aria-label': 'Block to replace' });
  const before = h('canvas', { class: 'pixel checker', width: BLEN, height: BLEN });
  const after = h('canvas', { class: 'pixel checker', width: BLEN, height: BLEN });
  const beforeCap = h('figcaption');
  const slotLabel = h('strong');
  const copyBtn = h('button', { class: 'primary', onclick: () => void grab() }, 'Copy into block');

  const loadSet = () => {
    if (!target || !project.files.has(target)) {
      blocks = [];
      return;
    }
    kind = target.split('.').pop() as BlockKind;
    const raw = project.files.get(target)!;
    blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS[kind], Math.ceil(raw.length / BLOCK_SIZE)));
    destPal = project.paletteFor(target).palette;
    targetBlock = Math.min(targetBlock, BLOCK_COUNTS[kind] - 1);
  };
  /** The grabbed 20×20 area as it will be stored in the block. */
  const grabbed = (): Uint8Array => {
    const px = new Uint8Array(BLEN * BLEN);
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const v = img.pixels[(overlay.y + y) * img.width + overlay.x + x];
        px[y * BLEN + x] = remap ? matchColor(destPal, img.palette[v * 3], img.palette[v * 3 + 1], img.palette[v * 3 + 2]) : v;
      }
    return px;
  };
  const sprite = () => kind !== 'bbl';
  const renderSlots = () => {
    clear(
      slots,
      ...blocks.slice(0, BLOCK_COUNTS[kind]).map((b, i) =>
        h(
          'button',
          {
            class: `${i === targetBlock ? 'target' : ''} ${isBlankBlock(b.pixels, sprite()) ? 'blank' : ''}`,
            role: 'option',
            'aria-selected': String(i === targetBlock),
            title: `Block ${i}${isBlankBlock(b.pixels, sprite()) ? ' (empty)' : ''}`,
            onclick: () => ((targetBlock = i), updateTarget()),
          },
          blockCanvas(b.pixels, destPal, { transparent: sprite(), className: sprite() ? 'checker' : '' }),
          h('small', null, i),
        ),
      ),
    );
  };
  const updatePreview = () => {
    if (!blocks.length) return;
    paintBlock(after, grabbed(), destPal, { transparent: sprite() });
  };
  const updateTarget = () => {
    if (!blocks.length) {
      clear(slots, h('p', { class: 'meta' }, 'This game has no block sets yet. Add a background, monster or character block set first.'));
      copyBtn.disabled = true;
      return;
    }
    copyBtn.disabled = false;
    const b = blocks[targetBlock];
    const blank = isBlankBlock(b.pixels, sprite());
    paintBlock(before, b.pixels, destPal, { transparent: sprite() });
    beforeCap.textContent = blank ? 'Now: empty' : 'Now';
    slotLabel.textContent = `Block ${targetBlock} of ${target}`;
    copyBtn.textContent = blank ? `Copy into block ${targetBlock}` : `Replace block ${targetBlock}`;
    [...slots.children].forEach((el, i) => {
      el.classList.toggle('target', i === targetBlock);
      el.setAttribute('aria-selected', String(i === targetBlock));
    });
    // scroll the block list only, never the page around it
    const el = slots.children[targetBlock] as HTMLElement | undefined;
    if (el) {
      const top = el.offsetTop - slots.offsetTop;
      if (top < slots.scrollTop) slots.scrollTop = top;
      else if (top + el.offsetHeight > slots.scrollTop + slots.clientHeight) slots.scrollTop = top + el.offsetHeight - slots.clientHeight;
    }
    updatePreview();
  };
  const reloadSet = () => {
    loadSet();
    if (blocks.length) renderSlots();
    updateTarget();
  };

  const grab = async () => {
    if (!target || !blocks.length) return toast('Create a block set first.', 'error');
    const b = blocks[targetBlock];
    if (
      !isBlankBlock(b.pixels, sprite()) &&
      !(await confirmDialog(
        'Replace this block?',
        `Block ${targetBlock} of ${target} already has a picture. Replace it with the area you chose?`,
        `Replace block ${targetBlock}`,
      ))
    )
      return;
    b.pixels.set(grabbed());
    project.files.set(target, serializeBlocks(blocks));
    toast(`Copied into block ${targetBlock} of ${target}.`);
    const copied = targetBlock;
    if (advance) {
      const next = blocks.findIndex((x, i) => i > copied && i < BLOCK_COUNTS[kind] && isBlankBlock(x.pixels, sprite()));
      if (next >= 0) targetBlock = next;
    }
    renderSlots();
    updateTarget();
    slots.children[copied]?.classList.add('just-copied');
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
    h(
      'div',
      { class: 'pic-layout' },
      h('div', { class: 'pic-main' }, canvas, info),
      h(
        'div',
        { class: 'pic-side' },
        h(
          'section',
          { class: 'panel pic-copy' },
          h('h3', null, 'Copy the area into a block'),
          h(
            'div',
            { class: 'toolbar' },
            fileField(
              project,
              'Block set',
              ['bbl', 'mbl', 'cbl'],
              () => target,
              (v) => v && ((target = v), reloadSet()),
              { allowNone: false },
            ),
            selectField(
              'Colors',
              [
                [1, 'Match the block set’s palette'],
                [0, 'Copy color numbers as they are'],
              ] as [number, string][],
              () => (remap ? 1 : 0),
              (v) => ((remap = !!v), updatePreview()),
            ),
          ),
          h(
            'div',
            { class: 'pic-copy-body' },
            h(
              'div',
              { class: 'pic-swap' },
              slotLabel,
              h(
                'div',
                { class: 'pic-swap-row' },
                h('figure', null, before, beforeCap),
                h('span', { class: 'pic-arrow', 'aria-hidden': 'true' }, '➜'),
                h('figure', null, after, h('figcaption', null, 'After copying')),
              ),
              h(
                'label',
                { class: 'pic-advance' },
                (() => {
                  const c = h('input', { type: 'checkbox', checked: advance });
                  c.addEventListener('change', () => (advance = c.checked));
                  return c;
                })(),
                'Then move on to the next empty block',
              ),
              copyBtn,
            ),
            h(
              'div',
              { class: 'pic-slots-wrap' },
              h(
                'div',
                { class: 'meta' },
                'Click the block to replace. The orange frame is the one you’re about to change; blocks marked “empty” have nothing drawn yet.',
              ),
              slots,
            ),
          ),
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
      ),
    ),
    h('div', { style: 'height:12px' }),
    preview.el,
  );
  draw();
  reloadSet();
  return preview.stop;
});

// ---- animations -----------------------------------------------------------------
