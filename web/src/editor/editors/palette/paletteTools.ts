// The palette editor's helpers beside the colors: a shade ramp from one color; "glowing" colors
// (kept in the companion file) that stay lit in a night or dusk copy; the palette re-lit as a
// new palette file; a level's map shown in this palette next to a variant or another palette;
// and the blocks that paint with the chosen color.
import { h, clear, toast } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { serializePalette, parsePalette, type Palette } from '../../../formats/palette';
import { ADVTYPE } from '../../../formats/game';
import { levelPixels, type LevelPicture } from '../../../gfx/levelPicture';
import { arrival } from '../integrator/board';
import { normalize } from '../../../project/files';
import type { Project } from '../../core/project';
import { colorUses, openInEditor, sceneName } from '../../core/uses';
import { shadeRamp } from './ramps';
import { VARIANTS, relight, range } from './variants';

interface PaletteContext {
  project: Project;
  file: string;
  pal: Palette;
  selected: () => number;
  rangeEnd: () => number | undefined;
  /** Call before changing pal (for undo). */
  remember: () => void;
  /** Call after changing pal: saves and redraws. */
  changed: () => void;
}

type Range = [number, number];

export function paletteTools(c: PaletteContext): { el: HTMLElement; uses: HTMLElement; rampBtn: HTMLElement; refresh: () => void; dispose: () => void } {
  const { project, file, pal } = c;
  const span = (): Range => {
    const a = c.selected();
    const b = c.rangeEnd() ?? a;
    return [Math.min(a, b), Math.max(a, b)];
  };

  // ---- shade ramp ------------------------------------------------------------
  const rampBtn = h(
    'button',
    {
      title: 'Shift-click a second color first: the range becomes shades of the first color, dark to light',
      onclick: () => {
        const [a, b] = span();
        if (a === b) return toast('Shift-click a second color to choose the range for the ramp.', 'error');
        const s = c.selected();
        c.remember();
        shadeRamp(pal, [pal[s * 3], pal[s * 3 + 1], pal[s * 3 + 2]], a, b);
        c.changed();
      },
    },
    'Make a shade ramp',
  );

  // ---- glowing colors (editor-only, in the companion file) ---------------------
  const glows = (): Range[] => project.extras<Range[]>(file, 'glow', []);
  const glowList = h('p', { class: 'meta' });
  const showGlows = () => {
    const g = glows();
    glowList.textContent = g.length
      ? `Glowing (kept as they are): ${g.map(([a, b]) => (a === b ? a : `${a}–${b}`)).join(', ')}`
      : 'No glowing colors: every color is re-lit.';
  };
  const glowBtns = h(
    'div',
    { class: 'toolbar' },
    h(
      'button',
      {
        title: 'Lamps, lit windows, stars, gold: colors that stay bright in a night or dusk copy',
        onclick: () => {
          const [a, b] = span();
          const rest = glows().filter(([x, y]) => y < a || x > b);
          project.setExtras(
            file,
            'glow',
            [...rest, [a, b]].sort((p, q) => p[0] - q[0]),
          );
          showGlows();
          redraw();
        },
      },
      'Mark as glowing',
    ),
    h(
      'button',
      {
        title: 'Re-light every color',
        onclick: () => {
          project.setExtras(file, 'glow', undefined);
          showGlows();
          redraw();
        },
      },
      'Clear glowing',
    ),
  );
  const kept = () => glows().flatMap(([a, b]) => range(a, b));

  // ---- compare: this palette and a variant or another palette, on a level ---------
  const game = project.game();
  const levels = game.scenes.map((_, i) => i).filter((i) => game.scenes[i].gametype === ADVTYPE && game.scenes[i].files[1]);
  const mine = levels.filter((i) => normalize(game.scenes[i].files[0] ?? '') === file);
  const sceneSel = h(
    'select',
    { 'aria-label': 'Level to show' },
    ...(mine.length ? mine : levels).map((i) => h('option', { value: String(i) }, sceneName(project, i))),
  );
  const others = project.files.byExtension('pal').filter((f) => f !== file);
  const compareSel = h(
    'select',
    { 'aria-label': 'Compare with' },
    h('optgroup', { label: 'This palette re-lit' }, ...VARIANTS.map((v) => h('option', { value: `v:${v.id}` }, v.name))),
    others.length ? h('optgroup', { label: 'Another palette' }, ...others.map((f) => h('option', { value: `f:${f}` }, f))) : null,
  );
  const left = h('canvas', { class: 'pixel pal-shot', role: 'img', 'aria-label': 'The level in this palette' });
  const right = h('canvas', { class: 'pixel pal-shot', role: 'img', 'aria-label': 'The level in the palette compared' });
  const rightCap = h('figcaption', { class: 'meta' });
  let shot: LevelPicture | undefined;
  let shotScene = -1;
  const other = (): Palette => {
    const v = compareSel.value;
    if (v.startsWith('f:')) return parsePalette(project.files.get(v.slice(2))!);
    return relight(pal, VARIANTS.find((x) => `v:${x.id}` === v) ?? VARIANTS[0], kept());
  };
  function redraw(): void {
    const i = Number(sceneSel.value);
    if (!levels.length) return;
    if (i !== shotScene) {
      shot = levelPixels(project.files, game.scenes[i], arrival(game, i), 12, 7);
      shotScene = i;
    }
    rightCap.textContent = compareSel.selectedOptions[0]?.textContent ?? '';
    makeBtn.hidden = !compareSel.value.startsWith('v:');
    if (!shot) return;
    paintIndexed(left, shot.pixels, shot.width, shot.height, pal);
    paintIndexed(right, shot.pixels, shot.width, shot.height, other());
  }
  sceneSel.addEventListener('change', redraw);
  compareSel.addEventListener('change', redraw);
  const makeBtn = h(
    'button',
    {
      class: 'primary',
      title: 'Save the re-lit colors as a new palette file (this one is not changed)',
      onclick: () => {
        const v = VARIANTS.find((x) => `v:${x.id}` === compareSel.value);
        if (!v) return;
        // a long name would be cut short: the base name and the mood when they fit, else just the mood
        const base = file.replace(/\.pal$/, '');
        const name = project.freeName(base.length + v.stem.length <= 8 ? `${base}${v.stem}` : v.stem, 'pal');
        project.files.set(name, serializePalette(relight(pal, v, kept())));
        project.setExtras(name, 'glow', glows().length ? glows() : undefined);
        toast(`Made ${name}. Choose it as a scene’s palette in the Game (integrator).`);
        openInEditor(project, name);
      },
    },
    'Save as a new palette',
  );

  // ---- blocks that use the chosen color ------------------------------------------
  const usesHead = h('h3', null);
  const usesList = h('ul', { class: 'pal-uses' });
  let usesTimer: ReturnType<typeof setTimeout> | undefined;
  const listUses = () => {
    const s = c.selected();
    usesHead.textContent = `Blocks painted with color ${s}`;
    const uses = colorUses(project, file, s);
    clear(
      usesList,
      ...(uses.length
        ? uses.map((u) => h('li', null, h('button', { class: 'pal-use-link', title: `Open ${u.file}`, onclick: () => openInEditor(project, u.file) }, u.text)))
        : [h('li', { class: 'meta' }, 'No block shown with this palette uses it.')]),
    );
  };

  const el = h(
    'div',
    { class: 'pal-tools stack' },
    h(
      'details',
      // folded at first, so the colors and the color being edited fit one window
      { class: 'panel pal-compare' },
      h('summary', null, 'Night, dusk, underwater…'),
      h(
        'p',
        { class: 'meta' },
        'The same blocks in a re-lit palette: every color scaled toward the mood, glowing colors kept. Pick a range, then Mark as glowing.',
      ),
      glowList,
      glowBtns,
      levels.length
        ? [
            h(
              'div',
              { class: 'row', style: 'gap:8px;align-items:end' },
              h('label', { class: 'field' }, h('span', null, 'Level'), sceneSel),
              h('label', { class: 'field' }, h('span', null, 'Compare with'), compareSel),
            ),
            h('div', { class: 'pal-shots' }, h('figure', null, left, h('figcaption', { class: 'meta' }, 'This palette')), h('figure', null, right, rightCap)),
          ]
        : h('label', { class: 'field' }, h('span', null, 'Re-light as'), compareSel),
      h('div', { class: 'toolbar' }, makeBtn),
    ),
  );
  // beside the color being edited (palette.ts), where a click on a color shows its uses
  const uses = h('details', { class: 'pal-uses-panel', open: true }, h('summary', null, 'Which blocks use this color'), usesHead, usesList);
  showGlows();
  return {
    el,
    uses,
    rampBtn,
    refresh() {
      redraw();
      clearTimeout(usesTimer);
      usesTimer = setTimeout(listUses, 250);
    },
    dispose: () => clearTimeout(usesTimer),
  };
}
