// Everything in the box besides the manual, in tray order: the game's own extras from
// printables.json first, then the generated ones every Sandbox Software game gets.
import './items.css';
import type { PrintContext } from './kit';
import type { BoxItem } from './viewer';
import type { GeneratedKind, PrintableItem } from './types';
import { foldOut, renderItem } from './story';
import { bbsAd, catalog, hintOffer, keycard, newsletter, postcard, warranty } from './gen';
import { stickerScreen, stickers } from './stickers';
import { worldMap, worldMapScreen } from './worldMap';
import { levelMaps } from './levelMaps';

const ICONS: Record<PrintableItem['kind'], string> = {
  map: '🗺️',
  hintbook: '🔍',
  letter: '✉️',
  newspaper: '📰',
  journal: '📓',
  idcard: '🪪',
  chart: '📋',
  starchart: '🌌',
  recipe: '🥄',
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
  const levels = levelMaps(ctx);
  const gen: (BoxItem & { kind: GeneratedKind })[] = [
    {
      kind: 'worldmap',
      id: 'worldmap',
      title: 'World Map',
      note: 'Fold-out: every scene and the ways between them',
      icon: '🗺️',
      render: () => worldMap(ctx),
      screen: worldMapScreen,
    },
    ...(levels
      ? [
          {
            kind: 'levelmaps' as const,
            id: 'levelmaps',
            title: 'Level Maps',
            note: 'Every level’s real map, start and ways out marked',
            icon: '🧭',
            render: () => levels.render(),
            live: () => levels.live(),
          },
        ]
      : []),
    { kind: 'keycard', id: 'keycard', title: 'Key card', note: 'Quick reference for your keyboard', icon: '⌨️', render: () => keycard(ctx) },
    { kind: 'postcard', id: 'postcard', title: 'Registration card', note: 'Postcard, already marked paid', icon: '📮', render: () => postcard(ctx) },
    { kind: 'warranty', id: 'warranty', title: 'License & warranty', note: 'Keep this card', icon: '📜', render: () => warranty(ctx) },
    {
      kind: 'newsletter',
      id: 'newsletter',
      title: 'The Sandbox Scoop',
      note: 'Newsletter: the next games',
      icon: '🗞️',
      render: () => newsletter(ctx),
      redFilm: !!book,
    },
    { kind: 'catalog', id: 'catalog', title: 'Sandbox Software catalog', note: 'Every Sandbox Software game', icon: '🗂️', render: () => catalog(ctx) },
    { kind: 'bbs', id: 'bbs', title: 'BBS ad', note: 'Call the Sandbox BBS', icon: '📞', render: () => bbsAd() },
    ...(book
      ? [
          {
            kind: 'hintoffer' as const,
            id: 'hintoffer',
            title: 'Hint book postcard',
            note: 'Stuck? Get the hint book',
            icon: '💡',
            render: () => hintOffer(ctx, book.title),
            redFilm: true,
          },
        ]
      : []),
    { kind: 'stickers', id: 'stickers', title: 'Sticker sheet', note: 'Cut them out', icon: '⭐', render: () => stickers(ctx), screen: stickerScreen },
  ];
  return [...items, ...gen.filter((g) => !skip.has(g.kind))];
}
