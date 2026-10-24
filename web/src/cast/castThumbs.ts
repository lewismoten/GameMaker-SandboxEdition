// "Seen in": a small picture of each game a regular appears in, linking to the game. Each
// game's picture is drawn once (the built site has it drawn already, games/shots/; the dev
// server draws it from the game's files) and only when its row scrolls into view.
import { h } from '../editor/core/ui';
import { loadGameList, type CatalogEntry } from '../project/files';
import { CAST_GAMES, type Appearance } from './castData';

const COLS = 8;
const ROWS = 5;
const pictures = new Map<string, Promise<HTMLCanvasElement | undefined>>();
let catalog: Promise<CatalogEntry[]> | undefined;

function picture(id: string): Promise<HTMLCanvasElement | undefined> {
  let p = pictures.get(id);
  if (!p) {
    catalog ??= loadGameList().catch(() => []);
    p = catalog.then(async (list) => {
      const entry = list.find((g) => g.id === id);
      if (!entry) return undefined;
      const { renderShot } = await import('../gfx/gameShots');
      const canvas = document.createElement('canvas');
      return (await renderShot(entry, canvas, COLS, ROWS).catch(() => false)) ? canvas : undefined;
    });
    pictures.set(id, p);
  }
  return p;
}

const watcher =
  typeof IntersectionObserver === 'undefined'
    ? undefined
    : new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            watcher!.unobserve(e.target);
            fill(e.target as HTMLElement);
          }
        },
        { rootMargin: '200px' },
      );

function fill(row: HTMLElement): void {
  for (const c of row.querySelectorAll<HTMLCanvasElement>('canvas[data-game]'))
    void picture(c.dataset.game!).then((pic) => {
      if (!pic) return;
      c.width = pic.width;
      c.height = pic.height;
      c.getContext('2d')!.drawImage(pic, 0, 0);
      c.classList.add('drawn');
    });
}

/** The row of pictures, drawn when it comes into view. */
export function seenIn(appears: Appearance[]): HTMLElement {
  const row = h(
    'ul',
    { class: 'cast-seen', 'aria-label': 'Seen in' },
    appears.map((a) => {
      const title = CAST_GAMES[a.game][0];
      return h(
        'li',
        { class: `fam-${CAST_GAMES[a.game][1]}` },
        h(
          'a',
          { href: `#/game/cd:${a.game}`, title: `${title}: ${a.as}` },
          h('canvas', { width: COLS * 20, height: ROWS * 20, dataset: { game: a.game }, 'aria-hidden': 'true' }),
          h('span', { class: 'cast-seen-title' }, title),
        ),
      );
    }),
  );
  if (watcher) watcher.observe(row);
  else fill(row);
  return row;
}
