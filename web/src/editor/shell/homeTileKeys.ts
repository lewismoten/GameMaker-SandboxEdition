// The home page's tiles as one keyboard grid. A roving tabindex makes the list a single Tab
// stop (the tile last used, else the featured one, else the first). Arrow keys move between
// tiles (up and down find the tile in the next row nearest straight above or below, from the
// real layout), Home and End go to the ends. Each tile says its collection and place
// ("3 of 18") after its title and maker, to screen readers.
const ITEM = '.game-tile:not([hidden]) .tile-select, .lib-drop-pick';

export function tileArrowKeys(tiles: HTMLElement, collection: () => string = () => ''): void {
  let roving: HTMLElement | undefined;
  const items = () => [...tiles.querySelectorAll<HTMLElement>(ITEM)];

  const sync = () => {
    const all = items();
    if (!all.length) return;
    const games = all.filter((el) => el.classList.contains('tile-select'));
    if (!roving || !all.includes(roving)) roving = all.find((el) => el.getAttribute('aria-current') === 'true') ?? all[0];
    const where = collection();
    for (const el of all) {
      el.tabIndex = el === roving ? 0 : -1;
      if (!el.classList.contains('tile-select')) continue;
      // said after the tile's own words, so its name still starts with what is on screen
      let pos = el.querySelector<HTMLElement>('.tile-pos');
      if (!pos) {
        pos = document.createElement('span');
        pos.className = 'vh tile-pos';
        el.append(pos);
      }
      const text = `, ${[where, `${games.indexOf(el) + 1} of ${games.length}`].filter(Boolean).join(', ')}`;
      if (pos.textContent !== text) pos.textContent = text;
    }
  };
  let queued = false;
  const later = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      sync();
    });
  };
  new MutationObserver(later).observe(tiles, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-current'] });
  tiles.addEventListener('focusin', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('.tile-select, .lib-drop-pick');
    if (t && t !== roving) {
      roving = t;
      sync();
    }
  });
  later();

  tiles.addEventListener('keydown', (e) => {
    const from = (e.target as HTMLElement).closest<HTMLElement>('.tile-select, .lib-drop-pick');
    if (!from || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const all = items();
    const i = all.indexOf(from);
    const box = (el: HTMLElement) => el.closest('.card')!.getBoundingClientRect();
    // up and down: the tile in the next row that way nearest straight above or below (the
    // Bard's collections share rows, so the tiles' order is not always row by row)
    const vertical = (down: boolean) => {
      const r = box(from);
      const x = r.left + r.width / 2;
      const way = all.map((el) => ({ el, b: box(el) })).filter(({ b }) => (down ? b.top > r.top + 4 : b.top < r.top - 4));
      if (!way.length) return -1;
      const row = down ? Math.min(...way.map(({ b }) => b.top)) : Math.max(...way.map(({ b }) => b.top));
      const near = way
        .filter(({ b }) => Math.abs(b.top - row) < 4)
        .sort((a, b) => Math.abs(a.b.left + a.b.width / 2 - x) - Math.abs(b.b.left + b.b.width / 2 - x));
      return all.indexOf(near[0].el);
    };
    const j =
      e.key === 'ArrowUp' || e.key === 'ArrowDown'
        ? vertical(e.key === 'ArrowDown')
        : { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: all.length - 1 }[e.key]!;
    if (j < 0 || j >= all.length) return;
    e.preventDefault();
    all[j].focus();
    all[j].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
