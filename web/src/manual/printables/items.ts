// Everything in the box besides the manual, in tray order: the game's own extras from
// printables.json first, then the generated ones every Sandbox Software game gets.
import './items.css';
import type { PrintContext } from './kit';
import type { BoxItem } from './viewer';
import type { GeneratedKind, PrintableItem } from './types';
import { foldOut, renderItem } from './story';
import { bbsAd, catalog, hintOffer, keycard, newsletter, postcard, stickers, warranty } from './gen';

const ICONS: Record<PrintableItem['kind'], string> = {
  map: '🗺️',
  hintbook: '🔍',
  letter: '✉️',
  newspaper: '📰',
  journal: '📓',
  idcard: '🪪',
  chart: '📋',
  starchart: '🌌',
};

export function boxItems(ctx: PrintContext): BoxItem[] {
  const own = ctx.printables.items ?? [];
  const skip = new Set<GeneratedKind>(ctx.printables.skip ?? []);
  const items: BoxItem[] = own.map((it, i) => ({
    id: `own${i}`,
    title: it.title,
    note: it.note,
    promised: it.promised,
    icon: ICONS[it.kind],
    render: () => renderItem(ctx, it),
    screen: it.kind === 'starchart' ? foldOut : undefined,
    redFilm: it.kind === 'hintbook',
  }));
  const book = own.find((i) => i.kind === 'hintbook');
  const gen: (BoxItem & { kind: GeneratedKind })[] = [
    { kind: 'keycard', id: 'keycard', title: 'Key card', note: 'Quick reference for your keyboard', icon: '⌨️', render: () => keycard(ctx) },
    { kind: 'postcard', id: 'postcard', title: 'Registration card', note: 'Postcard, already marked paid', icon: '📮', render: () => postcard(ctx) },
    { kind: 'warranty', id: 'warranty', title: 'License & warranty', note: 'Keep this card', icon: '📜', render: () => warranty(ctx) },
    { kind: 'newsletter', id: 'newsletter', title: 'The Sandbox Scoop', note: 'Newsletter: our next games', icon: '🗞️', render: () => newsletter(ctx) },
    { kind: 'catalog', id: 'catalog', title: 'Sandbox Software catalog', note: 'Every game we make', icon: '🗂️', render: () => catalog(ctx) },
    { kind: 'bbs', id: 'bbs', title: 'BBS ad', note: 'Call the Sandbox BBS', icon: '📞', render: () => bbsAd() },
    ...(book
      ? [{ kind: 'hintoffer' as const, id: 'hintoffer', title: 'Hint book offer', note: 'Order slip', icon: '💡', render: () => hintOffer(ctx, book.title) }]
      : []),
    { kind: 'stickers', id: 'stickers', title: 'Sticker sheet', note: 'Cut them out', icon: '⭐', render: () => stickers(ctx) },
  ];
  return [...items, ...gen.filter((g) => !skip.has(g.kind))];
}
