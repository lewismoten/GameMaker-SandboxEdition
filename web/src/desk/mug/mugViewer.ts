// A closer look at the Sandbox BBS mug: it turns slowly (drag to turn it yourself), and you
// choose the picture printed on it (the BBS's ANSI art, or a Sandbox Software game's title
// screen), the size and the color inside. "Make your own" opens the sublimation order form.
import { h } from '../../editor/core/ui';
import { MUG_DESIGNS, designCanvas, loadDesign, type MugDesign } from './mugArt';
import { MUG_SIZES, printPlacement } from './mugSizes';
import { MUG_COLORS, drawMug, wrapAngle, wrapCanvas } from './mug3d';
import { colorsOf, loadMug, saveMug, sizeOf, type MugChoice } from './mug';
import { openSublimation } from './mugPrint';

export function openMugViewer(): Promise<void> {
  return new Promise((resolve) => {
    let choice: MugChoice = loadMug();
    let texture = wrapCanvas(choice.design, sizeOf(choice.size), 120);
    /** Turned so the picture's front copy faces us, the handle round to the left. */
    const facing = () => {
      const art = designCanvas(choice.design);
      return -wrapAngle(sizeOf(choice.size), printPlacement(sizeOf(choice.size), art.width / art.height).centers[0]);
    };
    let rot = facing();
    // radians a second; none with reduced motion asked for (drag to turn it)
    let spin = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.5;
    let drag: { x: number; rot: number } | undefined;
    let raf = 0;
    let last = performance.now();
    const canvas = h('canvas', { class: 'mugv-canvas', role: 'img', 'aria-label': 'The mug, turning' });
    const stage = h('div', { class: 'mugv-stage' }, canvas, h('p', { class: 'mugv-hint' }, 'Drag to turn it'));

    const draw = () => {
      const r = stage.getBoundingClientRect();
      const k = window.devicePixelRatio || 1;
      const w = Math.max(200, Math.round(r.width));
      const hh = Math.max(200, Math.round(r.height));
      if (canvas.width !== w * k || canvas.height !== hh * k) {
        canvas.width = w * k;
        canvas.height = hh * k;
      }
      const g = canvas.getContext('2d')!;
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, w, hh);
      const size = sizeOf(choice.size);
      // fit the mug (body plus handle) in the stage
      const bodyH = size.height / size.diameter; // per unit of diameter
      const radius = Math.min((w * 0.62) / 2 / 1.35, (hh * 0.72) / (2 * bodyH + 0.5));
      const H = radius * 2 * bodyH;
      const top = (hh - H) / 2 + radius * 0.1;
      // shadow on the table
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.ellipse(w / 2 + radius * 0.1, top + H + radius * 0.12, radius * 1.35, radius * 0.24, 0, 0, Math.PI * 2);
      g.fill();
      drawMug(g, { texture, size, colors: colorsOf(choice.color), rot, cx: w / 2, top, radius });
    };
    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (!drag) rot += spin * dt;
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, rot };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (drag) rot = drag.rot + ((e.clientX - drag.x) / Math.max(100, canvas.clientWidth)) * Math.PI * 2;
    });
    const endDrag = () => {
      if (drag) spin = 0; // leave it where it was put
      drag = undefined;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    const retexture = () => (texture = wrapCanvas(choice.design, sizeOf(choice.size), 120));
    const update = (patch: Partial<MugChoice>) => {
      const newDesign = patch.design && patch.design !== choice.design;
      choice = { ...choice, ...patch };
      retexture();
      if (newDesign) rot = facing(); // show off the new picture
      saveMug(choice);
      paintPicks();
    };

    const designPick = (d: MugDesign) => {
      const art = designCanvas(d.id);
      const img = h('img', { src: art.toDataURL(), alt: '', width: art.width, height: art.height });
      // a game's picture comes from its files on the CD
      void loadDesign(d.id).then((c) => {
        if (c === art) return;
        img.src = c.toDataURL();
        img.width = c.width;
        img.height = c.height;
        if (d.id === choice.design) retexture();
      });
      return h(
        'button',
        { type: 'button', class: 'mugv-design', dataset: { id: d.id, group: d.group }, onclick: () => update({ design: d.id }), title: d.note },
        img,
        h('span', null, d.name),
      );
    };
    const designPicks = MUG_DESIGNS.map(designPick);
    const sizePicks = MUG_SIZES.map((s) =>
      h('button', { type: 'button', class: 'mugv-chip', dataset: { id: s.id }, onclick: () => update({ size: s.id }) }, s.name),
    );
    const colorPicks = MUG_COLORS.map((c) =>
      h(
        'button',
        { type: 'button', class: 'mugv-swatch', dataset: { id: c.id }, onclick: () => update({ color: c.id }), title: c.name, 'aria-label': c.name },
        h('i', { style: `background:${c.colors.accent}` }),
      ),
    );
    const paintPicks = () => {
      for (const b of designPicks) b.setAttribute('aria-pressed', String(b.dataset.id === choice.design));
      for (const b of sizePicks) b.setAttribute('aria-pressed', String(b.dataset.id === choice.size));
      for (const b of colorPicks) b.setAttribute('aria-pressed', String(b.dataset.id === choice.color));
    };
    paintPicks();

    // the keyboard goes into the viewer, and back to the mug on the desk when it closes
    const opener = document.activeElement as HTMLElement | null;
    const close = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      opener?.focus({ preventScroll: true });
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!document.body.contains(overlay) || document.querySelector('.subl')) return;
      if (e.key === 'Escape') (e.preventDefault(), close());
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        spin = 0;
        rot += e.key === 'ArrowLeft' ? -0.2 : 0.2;
        e.preventDefault();
      }
      e.stopImmediatePropagation(); // not for the PC underneath
    };
    window.addEventListener('keydown', onKey, true);

    const overlay = h(
      'div',
      { class: 'mugv', role: 'dialog', 'aria-label': 'The Sandbox mug' },
      h(
        'header',
        { class: 'mugv-bar' },
        h('strong', null, 'The Sandbox mug'),
        h('span', { class: 'mugv-spacer' }),
        h('button', { type: 'button', onclick: close }, 'Close (Esc)'),
      ),
      h(
        'div',
        { class: 'mugv-main' },
        stage,
        h(
          'aside',
          { class: 'mugv-side' },
          h('h3', null, 'Picture'),
          h('p', { class: 'mugv-note' }, 'The same picture on the front and the back. ANSI art from the board itself, in the VGA text font and its 16 colors:'),
          h('div', { class: 'mugv-designs' }, ...designPicks.filter((b) => b.dataset.group === 'bbs')),
          h('p', { class: 'mugv-note' }, 'Or a Sandbox Software game: its title screen and its hero, from the game’s own files:'),
          h('div', { class: 'mugv-designs' }, ...designPicks.filter((b) => b.dataset.group === 'game')),
          h('h3', null, 'Mug'),
          h('div', { class: 'mugv-chips' }, ...sizePicks),
          h('h3', null, 'Inside and handle'),
          h('div', { class: 'mugv-chips' }, ...colorPicks),
          h(
            'button',
            { type: 'button', class: 'mugv-make', onclick: () => void openSublimation({ design: choice.design, size: choice.size }) },
            '🖨 Make your own: print a sublimation page',
          ),
          h('p', { class: 'mugv-note' }, 'Choose each mug’s front and back, at the real size, on Letter or Legal. Press it onto a sublimation mug.'),
        ),
      ),
    );
    document.body.append(overlay);
    (overlay.querySelector<HTMLElement>('.mugv-designs [aria-pressed="true"]') ?? overlay.querySelector<HTMLElement>('.mugv-designs button'))?.focus({
      preventScroll: true,
    });
  });
}
