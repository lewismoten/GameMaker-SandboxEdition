// Making Game-Maker pictures and animations from today's files: any picture becomes a
// 320x200, 256-color GIF; an animated GIF (or several pictures) becomes an FLI. You see
// the result before saving, and can fit, fill or stretch it, dither it, and keep the
// colors of one of the game's palettes so it matches the rest of the game.
import { h, modal, pickFiles, toast } from '../core/ui';
import { registerMaker } from './makers';
import { paintIndexed } from '../core/draw';
import { decodeFrames, rgbaOf, toIndexed, type Fit, type Indexed } from './convert';
import { encodeGif } from '../../formats/gif';
import { encodeFli } from '../../formats/fli';
import { parsePalette } from '../../formats/palette';
import { validDosName, type Project } from '../core/project';
import { normalize } from '../../project/files';

async function convertDialog(project: Project, animate: boolean): Promise<string | undefined> {
  const files = await pickFiles({ multiple: animate, accept: 'image/*' });
  if (!files.length) return undefined;
  // all the frames: an animated GIF's own, or one per picture chosen
  const frames: ImageBitmap[] = [];
  const delays: number[] = [];
  for (const f of files) {
    const d = await decodeFrames(f);
    frames.push(...(animate ? d.frames : d.frames.slice(0, 1)));
    delays.push(...(animate ? d.delays : d.delays.slice(0, 1)));
  }
  if (!frames.length) return undefined;
  const base = normalize(files[0].name).replace(/\..*$/, '').replace(/[^a-z0-9_]/g, '').slice(0, 8) || 'picture';
  const ext = animate ? 'fli' : 'gif';

  return modal<string>(animate ? 'Make an animation' : 'Make a picture', (close) => {
    let fit: Fit = 'fit';
    let dither = true;
    let paletteFrom = '';
    let speed = Math.max(1, Math.round(((delays.reduce((a, b) => a + b, 0) / delays.length) * 70) / 1000));
    let result: Indexed[] = [];
    let frame = 0;
    const preview = h('canvas', { class: 'pixel convert-preview', width: 320, height: 200 });
    const info = h('p', { class: 'hint' });
    const nameInput = h('input', { type: 'text', value: project.freeName(base, ext), required: true });

    const render = () => {
      const images = frames.map((f) => rgbaOf(f, 320, 200, fit));
      const palette = paletteFrom ? parsePalette(project.files.get(paletteFrom)!) : undefined;
      result = toIndexed(images, { palette, dither });
      draw();
      info.textContent = `${frames.length} frame${frames.length > 1 ? 's' : ''} · 320×200 · ${paletteFrom ? `colors of ${paletteFrom.toUpperCase()}` : '256 best colors'}${animate ? ` · ${(70 / speed).toFixed(1)} frames a second` : ''}`;
    };
    const draw = () => {
      const r = result[frame % result.length];
      if (r) paintIndexed(preview, r.pixels, r.width, r.height, r.palette);
    };
    let timer = 0;
    if (frames.length > 1) {
      const tick = () => {
        frame++;
        draw();
        timer = window.setTimeout(tick, (speed * 1000) / 70);
      };
      timer = window.setTimeout(tick, 300);
    }

    const choice = <T extends string>(label: string, options: [T, string][], get: () => T, set: (v: T) => void) =>
      h(
        'div',
        { class: 'seg', role: 'group', 'aria-label': label },
        h('span', null, label),
        ...options.map(([v, text]) => {
          const b = h('button', { type: 'button', 'aria-pressed': String(get() === v) }, text);
          b.addEventListener('click', () => {
            set(v);
            [...b.parentElement!.querySelectorAll('button')].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            render();
          });
          return b;
        }),
      );

    const save = () => {
      if (!nameInput.reportValidity()) return;
      clearTimeout(timer);
      let name = normalize(nameInput.value.trim());
      if (!name.includes('.')) name += `.${ext}`;
      if (!validDosName(name)) {
        toast('Use a DOS name: up to 8 letters, a dot and the extension.', 'error');
        return;
      }
      const bytes = animate ? encodeFli(result.map((r) => r.pixels), result[0].palette, { speed }) : encodeGif(result[0]);
      project.files.set(name, bytes);
      toast(`Made ${name.toUpperCase()} (${bytes.length.toLocaleString()} bytes).`);
      close(name);
    };

    const pals = project.files.byExtension('pal');
    const body = h(
      'div',
      { class: 'convert' },
      h('div', { class: 'convert-view' }, preview, info),
      h(
        'div',
        { class: 'stack' },
        choice<Fit>('Size', [['fit', 'Fit'], ['fill', 'Fill'], ['stretch', 'Stretch']], () => fit, (v) => (fit = v)),
        choice<'on' | 'off'>('Dither', [['on', 'Smooth'], ['off', 'Flat']], () => (dither ? 'on' : 'off'), (v) => (dither = v === 'on')),
        pals.length
          ? choice<string>('Colors', [['', 'Best 256'], ...pals.map((p) => [p, p.toUpperCase()] as [string, string])], () => paletteFrom, (v) => (paletteFrom = v))
          : null,
        animate
          ? h(
              'label',
              { class: 'field' },
              h('span', null, 'Speed (delay in 1/70 s)'),
              h('input', {
                type: 'range',
                min: 1,
                max: 35,
                value: speed,
                oninput: (e: Event) => {
                  speed = Number((e.target as HTMLInputElement).value);
                  render();
                },
              }),
            )
          : null,
        h('label', { class: 'field' }, h('span', null, 'File name'), nameInput),
        h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => (clearTimeout(timer), close(undefined)) }, 'Cancel'), h('button', { type: 'button', class: 'primary', onclick: save }, `Save .${ext.toUpperCase()}`)),
      ),
    );
    queueMicrotask(render);
    return body;
  });
}

registerMaker('gif', { label: '🖼 Convert a picture…', run: (p) => convertDialog(p, false) });
registerMaker('fli', { label: '🎞 From an animated GIF or pictures…', run: (p) => convertDialog(p, true) });

export { convertDialog };
