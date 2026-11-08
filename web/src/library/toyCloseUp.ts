// A close look at one of the toy box's trinkets (toyBox.ts): a dialog over the toy box with the trinket
// large and turning (desk/boxes/trinketTurntable.ts: drag it, or the arrow keys), its colors / one color
// switch and files, and Previous / Next (or PageUp / PageDown) through the rest of that game's trinkets.
// Loaded when a trinket is first chosen, with the desk's viewer it uses.
import { h, modal } from '../editor/core/ui';
import { trinketDownload, trinketMesh, type TrinketItem } from '../desk/boxes/trinketData';
import { trinketTurntable } from '../desk/boxes/trinketTurntable';

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

/** Opens trinket `start` of a game's `items` (their files under `base`); resolves when it is closed. */
export async function toyCloseUp(game: string, base: string, items: TrinketItem[], start: number): Promise<void> {
  let at = start;
  let colors = true;
  const step = (dir: 1 | -1) => void choose((at + dir + items.length) % items.length);
  const table = trinketTurntable((e) => {
    if (e.key !== 'PageDown' && e.key !== 'PageUp') return false;
    step(e.key === 'PageDown' ? 1 : -1);
    return true;
  });
  const { canvas, status } = table;
  canvas.classList.add('toy-big-canvas');
  canvas.setAttribute('aria-describedby', 'toy-big-help');
  const heading = h('strong', { class: 'toy-big-name' });
  const blurb = h('span', { class: 'toy-big-blurb' });
  const size = h('span', { class: 'toy-size' });
  const count = h('span', { class: 'toy-big-count' });
  const swatches = h('span', { class: 'toy-swatches', 'aria-hidden': 'true' });
  // the file links are made again for each trinket (a packed file is made on its link's first click: trinketData.ts)
  const links = h('span', { class: 'toy-links' });
  const mode = (label: string, on: boolean) =>
    h('button', { class: 'toy-btn', type: 'button', 'aria-pressed': String(on), onclick: () => setColors(on) }, label);
  const modeColors = mode('3MF: colors', true);
  const modeOne = mode('STL: one color', false);
  const many = items.length > 1;
  const prev = h('button', { class: 'toy-btn', type: 'button', hidden: !many, onclick: () => step(-1) }, '◀ Previous');
  const next = h('button', { class: 'toy-btn', type: 'button', hidden: !many, onclick: () => step(1) }, 'Next ▶');

  function setColors(on: boolean) {
    colors = on;
    modeColors.setAttribute('aria-pressed', String(on));
    modeOne.setAttribute('aria-pressed', String(!on));
    void table.show(() => trinketMesh(base, items[at], colors));
  }
  function choose(i: number) {
    at = i;
    const item = items[i];
    const dims = item.mm.map((v) => Math.round(v)).join(' × ');
    heading.textContent = item.title;
    blurb.textContent = item.blurb;
    size.textContent = `${dims} mm`;
    count.textContent = many ? `${i + 1} of ${items.length} from ${game}` : `From ${game}`;
    links.replaceChildren(
      trinketDownload(h('a', { class: 'toy-dl', title: `${item.file}: ${mb(item.bytes)}, one color` }, 'STL'), base, item, item.file),
      trinketDownload(
        h(
          'a',
          { class: 'toy-dl', title: `${item.colors.file}: about ${mb(item.colors.bytes)}, one body for each of ${item.colors.palette.length} colors` },
          '3MF',
        ),
        base,
        item,
        item.colors.file,
      ),
      swatches,
    );
    swatches.replaceChildren(...item.colors.palette.map((c) => h('i', { style: `background: rgb(${c.join(',')})` })));
    canvas.setAttribute('aria-label', `${item.title}: ${item.blurb} A plastic trinket, ${dims} millimeters.`);
    void table.show(() => trinketMesh(base, item, colors), { fresh: true, spin: true });
  }

  await modal<void>('A closer look', () => {
    choose(start);
    requestAnimationFrame(() => canvas.isConnected && canvas.focus({ preventScroll: true }));
    return h(
      'div',
      { class: 'toy-big' },
      h('div', { class: 'toy-big-stage' }, canvas, status),
      h(
        'div',
        { class: 'toy-big-info' },
        heading,
        count,
        blurb,
        size,
        h('div', { class: 'toy-mode', role: 'group', 'aria-label': 'Show it as' }, modeColors, modeOne),
        links,
        h('div', { class: 'toy-big-steps' }, prev, next),
        h(
          'p',
          { class: 'toy-big-help', id: 'toy-big-help' },
          many
            ? 'Drag it, or use the arrow keys, to turn it; Home puts it back; PageUp and PageDown change trinket.'
            : 'Drag it, or use the arrow keys, to turn it; Home puts it back.',
        ),
      ),
    );
  });
  table.clear();
}
