// Arrow keys between the home page's tiles (Tab stops once per tile); Home and End go to the
// ends. Up and down find the tile in the next row that way nearest straight above or below.
export function tileArrowKeys(tiles: HTMLElement): void {
  tiles.addEventListener('keydown', (e) => {
    const from = (e.target as HTMLElement).closest<HTMLElement>('.tile-select, .lib-drop-pick');
    if (!from || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const all = [...tiles.querySelectorAll<HTMLElement>('.game-tile:not([hidden]) .tile-select, .lib-drop-pick')];
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
    all[j].scrollIntoView({ block: 'nearest' });
  });
}
