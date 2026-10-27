// Tools for palettes (.pal, 256 colors of 0-63 red, green, blue) and the between-scene screens:
// text pages (.txt, 31 columns as DOS shows them), slide lists (.lst) and backdrops (.bkd).
import { defaultPalette, parsePalette, serializePalette } from '../../formats/palette';
import { parseBackdrop, parseSlideList, serializeBackdrop, serializeSlideList, textLines } from '../../formats/graphicScripts';
import { latin1Text, textBytes } from '../../formats/binary';
import { DRY_RUN, commit } from './run';
import { FILE, clampInt, fileName, int, need } from './common';
import { json, ToolError, type ToolDef } from './types';

const getPalette: ToolDef = {
  name: 'get_palette',
  description: 'Palette colors as [red, green, blue], each 0-63 (VGA), from index start (default all 256).',
  inputSchema: { type: 'object', properties: { file: FILE, start: int('First index.', 0, 255), count: int('How many.', 1, 256) }, required: ['file'] },
  async run(a, ctx) {
    const pal = parsePalette(need(ctx, a.file, 'pal'));
    const start = clampInt(a.start, 0, 255, 0);
    const count = Math.min(clampInt(a.count, 1, 256, 256), 256 - start);
    return json({ start, colors: Array.from({ length: count }, (_, i) => [...pal.subarray((start + i) * 3, (start + i) * 3 + 3)]) });
  },
};

const setPalette: ToolDef = {
  name: 'set_palette',
  description: 'Sets palette colors from index start, each [red, green, blue] 0-63. A new .pal starts from the default palette.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      start: int('First index to set (default 0).', 0, 255),
      colors: { type: 'array', maxItems: 256, items: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 63 } } },
      dry_run: DRY_RUN,
    },
    required: ['file', 'colors'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'pal');
    const had = ctx.files.get(name);
    const pal = had ? parsePalette(had) : defaultPalette();
    const start = clampInt(a.start, 0, 255, 0);
    const colors = a.colors as number[][];
    if (start + colors.length > 256) throw new ToolError('Colors run past index 255.');
    colors.forEach((c, i) => {
      if (c.length !== 3) throw new ToolError(`Color ${start + i} needs 3 numbers.`);
      pal.set(c, (start + i) * 3);
    });
    return commit(ctx, a, { summary: `Palette ${name}: ${colors.length} colors from ${start}`, files: { [name]: serializePalette(pal) } });
  },
};

const getText: ToolDef = {
  name: 'get_text',
  description: 'A text screen (.txt): its text, and the lines DOS shows (31 characters each).',
  inputSchema: { type: 'object', properties: { file: FILE }, required: ['file'] },
  async run(a, ctx) {
    const b = need(ctx, a.file, 'txt');
    return json({
      text: latin1Text(b)
        .replace(/\x1a.*$/s, '')
        .replace(/\r\n/g, '\n'),
      lines: textLines(b),
    });
  },
};

const setText: ToolDef = {
  name: 'set_text',
  description: 'Writes a text screen (.txt). Keep lines to 31 characters: DOS wraps longer ones. Plain ASCII.',
  writes: true,
  inputSchema: { type: 'object', properties: { file: FILE, text: { type: 'string' }, dry_run: DRY_RUN }, required: ['file', 'text'] },
  async run(a, ctx) {
    const name = fileName(a.file, 'txt');
    const t = String(a.text).replace(/\r\n/g, '\n');
    const long = t.split('\n').filter((l) => l.length > 31).length;
    return commit(
      ctx,
      a,
      { summary: `Text ${name}: ${t.split('\n').length} lines`, files: { [name]: textBytes(t.replace(/\n/g, '\r\n')) } },
      long ? `${long} lines are over 31 characters and will wrap.` : '',
    );
  },
};

const getSlides: ToolDef = {
  name: 'get_slides',
  description: 'A slide list (.lst: pictures shown one after another, with seconds to wait) or a backdrop (.bkd: a 320x200 window of a GIF).',
  inputSchema: { type: 'object', properties: { file: FILE }, required: ['file'] },
  async run(a, ctx) {
    const name = fileName(a.file);
    const b = need(ctx, name);
    if (name.endsWith('.bkd')) return json(parseBackdrop(b));
    if (name.endsWith('.lst')) return json(parseSlideList(b));
    throw new ToolError(`${name} is not a .lst or .bkd file.`);
  },
};

const setSlides: ToolDef = {
  name: 'set_slides',
  description: 'Writes a slide list (.lst) from slides, or a backdrop (.bkd) from gif, x and y.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      slides: {
        type: 'array',
        maxItems: 100,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'A picture, animation, text or list file.' },
            pause: int('Seconds; leave out to wait for a key.', 0, 3600),
          },
          required: ['name'],
        },
      },
      gif: { type: 'string', description: 'For a .bkd: the GIF to show.' },
      x: int('For a .bkd: left of the window in the GIF.', 0, 32767),
      y: int('For a .bkd: top of the window in the GIF.', 0, 32767),
      dry_run: DRY_RUN,
    },
    required: ['file'],
  },
  async run(a, ctx) {
    const name = fileName(a.file);
    if (name.endsWith('.bkd')) {
      if (typeof a.gif !== 'string') throw new ToolError('A backdrop needs gif.');
      const bytes = serializeBackdrop({ gif: fileName(a.gif, 'gif'), x: clampInt(a.x, 0, 32767, 0), y: clampInt(a.y, 0, 32767, 0) });
      return commit(ctx, a, { summary: `Backdrop ${name}`, files: { [name]: bytes } });
    }
    if (!name.endsWith('.lst')) throw new ToolError(`${name} is not a .lst or .bkd file.`);
    const slides = ((a.slides ?? []) as { name: string; pause?: number }[]).map((s) => ({ name: fileName(s.name), pause: s.pause }));
    return commit(ctx, a, { summary: `Slide list ${name}: ${slides.length} slides`, files: { [name]: serializeSlideList(slides) } });
  },
};

export const SCREEN_TOOLS: ToolDef[] = [getPalette, setPalette, getText, setText, getSlides, setSlides];
