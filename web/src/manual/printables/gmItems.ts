// What's in the Game-Maker: Sandbox Edition box besides the Owner's Guide and the bonus-games
// CD: the program disks, The Ultimate Owner's Guide for power users (../ultimate), a quick reference card for Game-Maker's own design tools (from the
// original help screens), the inserts in gmInserts.ts (keyboard template, map grid pad,
// registration card, license, customer support), Sandbox Software's catalog, The Bard of
// Bizarre's (bardCatalog.ts), the BBS ad, a
// poster of games made with Game-Maker and a sticker sheet that mixes every Sandbox game's heroes.
import './gmItems.css';
import { h } from '../../editor/core/ui';
import { PRODUCT, SHORT } from '../../edition';
import type { CatalogEntry } from '../../project/files';
import { sandboxShots } from '../../gfx/sandboxShots';
import type { BoxItem } from './viewer';
import { BBS_PHONE, sandboxBanner, sandboxLogo, sheet, shotCache, type PrintContext, type Sheet } from './kit';
import { bbsAd, catalog } from './gen';
import { bardCatalog } from './bardCatalog';
import { diskSleeve, keyTemplate, licenseSheet, mapGrid, registrationCard, supportCard } from './gmInserts';
import { PLAYGAME_KEYS } from './keys';
import { mixedStickers, stickerScreen } from './stickers';
import { gmStickerSpecs } from './gmStickers';
import { ultimateItem } from '../ultimate/ultimateGuide';

/** Game-Maker SE as if it were one more catalog entry, for the generic cards. */
const GM_ENTRY: CatalogEntry = { id: 'gamemaker-se', title: PRODUCT, kind: 'gameware', path: '', gam: null, files: [], price: '$0.00', year: 1995 };

function contextFor(entry: CatalogEntry, family: CatalogEntry[]): PrintContext {
  return { entry, family, printables: entry.original?.printables ?? {}, manual: { title: entry.title, pages: [] }, shot: shotCache(entry) };
}

/** The keys of Game-Maker's own tools, as the original help screens (code/GM/*.HLP) give them. */
export const DESIGNER_KEYS: [tool: string, keys: [string, string][]][] = [
  [
    'Everywhere',
    [
      ['← → Enter', 'Move the menu bar and choose'],
      ['First letter', 'Choose that menu item'],
      ['Esc', 'Back out of a menu'],
      ['Help', 'Every menu has a help screen'],
      ['MB1 / MB2', 'Left / right mouse button'],
    ],
  ],
  [
    'Block Designer',
    [
      ['E', 'Erase the block to the last color'],
      ['S  F  R', 'Swap, flip, rotate the block'],
      ['C', 'Pick up the color you point at'],
      ['Shift+arrow', 'Shift the pixels of a block'],
      ['I', 'Block info: solid, gravity, objects'],
    ],
  ],
  [
    'Map Maker',
    [
      ['Arrows', 'Scroll the map'],
      ['Z', 'Zoom in on a spot, and out again'],
    ],
  ],
  [
    'Monster Sequencer',
    [
      ['MB1', 'Open a gap in the sequence'],
      ['MB2 drag', 'A blank over a block deletes it'],
      ['MB2 on monster', 'Information screen'],
    ],
  ],
  [
    'Monster paths',
    [
      ['Backspace', 'Erase the last line'],
      ['← →', 'Choose a segment'],
      ['↑ ↓', 'Change its speed'],
    ],
  ],
  [
    'Character Maker',
    [
      ['MB1 / MB2', 'Top / bottom block'],
      ['Backspace', 'Erase the last frame'],
      ['← →', 'Step through the frames'],
      ['↑ ↓', 'Pause length of a frame'],
    ],
  ],
  [
    'Palette Designer',
    [
      ['← →', 'Choose a color'],
      ['MB2 drag', 'Move a color; M move, C copy'],
    ],
  ],
  [
    'Image Reader',
    [
      ['Arrows', 'Size the capture window'],
      ['MB1 / MB2', 'Capture / next block'],
    ],
  ],
  [
    'Sound Editor',
    [
      ['← →', 'Previous / next sound'],
      ['MB1 drag', 'Draw the bars'],
    ],
  ],
  ['Integrator links', [['Arrows', 'Move around the map under the pointer']]],
];

async function keyCard(): Promise<Sheet[]> {
  const table = (rows: [string, string][]) =>
    h('table', null, ...rows.map(([k, what]) => h('tr', null, h('th', null, ...k.split(/\s{2,}| \/ /).map((x) => h('kbd', null, x))), h('td', null, what))));
  const half = 4; // Everywhere, Block, Map and Monster on the left; the rest on the right
  const col = (list: typeof DESIGNER_KEYS) =>
    h('div', { class: 'gmk-col' }, ...list.map(([tool, rows]) => h('section', null, h('h3', null, tool), table(rows))));
  const front = sheet(
    8.5,
    5.5,
    'gmk',
    h('header', { class: 'gmk-head' }, h('b', null, 'GAME-MAKER'), h('span', null, 'Quick Reference Card'), h('em', null, SHORT)),
    h('div', { class: 'gmk-cols' }, col(DESIGNER_KEYS.slice(0, half)), col(DESIGNER_KEYS.slice(half))),
    h('p', { class: 'gmk-foot' }, 'From the help screens of Game-Maker 3.0 by Recreational Software Designs. Press the HELP! button in any tool for more.'),
  );
  const back = sheet(
    8.5,
    5.5,
    'gmk gmk-back',
    h('header', { class: 'gmk-head' }, h('b', null, 'PLAYGAME'), h('span', null, 'Keys in every game'), h('em', null, SHORT)),
    h(
      'div',
      { class: 'gmk-cols' },
      h(
        'div',
        { class: 'gmk-col' },
        h(
          'section',
          null,
          h('h3', null, 'Playing'),
          table([['Arrows', 'Move your character'], ...PLAYGAME_KEYS, ['F8', 'Joystick on / off'], ['F10', 'About Game-Maker']]),
        ),
      ),
      h(
        'div',
        { class: 'gmk-col' },
        h(
          'section',
          null,
          h('h3', null, 'At the DOS prompt'),
          table([
            ['GM', 'Start Game-Maker'],
            ['PLAYGAME', 'Play a game without the menus'],
            ['TERMINAL', 'Call the BBS'],
            ['DIR  CD', 'List files, change folder'],
            ['↑', 'The last command again'],
          ]),
        ),
        h('div', { class: 'gmk-order' }, h('b', null, 'Your first game'), ' Palette → Block → Monster → Character → Map → Sound → Integrator → Play'),
      ),
    ),
  );
  return [front, back];
}

/** A poster of the games Sandbox Software made with Game-Maker. */
async function poster(): Promise<Sheet[]> {
  const shots = await sandboxShots();
  return [
    sheet(
      11,
      17,
      'gmp',
      h('div', { class: 'gmp-top' }, h('span', null, 'MADE WITH'), h('b', null, 'GAME-MAKER'), h('em', null, 'Sandbox Edition')),
      h(
        'div',
        { class: 'gmp-grid' },
        ...shots.map((s) =>
          h(
            'figure',
            null,
            h('img', { src: s.canvas.toDataURL(), alt: s.title, width: s.canvas.width, height: s.canvas.height }),
            h('figcaption', null, h('b', null, s.title), h('span', null, s.feature)),
          ),
        ),
      ),
      h(
        'div',
        { class: 'gmp-bottom' },
        sandboxLogo('gmp-logo'),
        h('p', null, 'No programming. Just blocks, monsters, maps and your imagination.', h('br'), 'Download them all on ', sandboxBanner(), ` ${BBS_PHONE}`),
      ),
    ),
  ];
}

/** The paper in the Game-Maker SE box, in tray order. */
export function gmBoxItems(family: CatalogEntry[]): BoxItem[] {
  const ctx = contextFor(GM_ENTRY, family);
  return [
    { id: 'disks', title: 'Program disks', note: 'Two 3½" disks in their sleeve', icon: '💾', render: diskSleeve },
    ultimateItem(),
    { id: 'gmkeys', title: 'Quick reference card', note: 'Keys for every design tool', icon: '⌨️', render: keyCard },
    { id: 'template', title: 'Keyboard template', note: 'Sits above the function keys', icon: '🎹', render: keyTemplate },
    { id: 'mapgrid', title: 'Map grid pad', note: 'Graph paper for planning maps', icon: '📐', render: mapGrid },
    { id: 'regcard', title: 'Registration card', note: 'Business reply mail', icon: '📮', render: registrationCard },
    { id: 'license', title: 'License agreement', note: 'MIT License', icon: '📜', render: licenseSheet },
    { id: 'support', title: 'Customer support', note: 'Phone, fax, BBS, Internet; troubleshooting', icon: '☎️', render: supportCard },
    { id: 'catalog', title: 'Sandbox Software catalog', note: 'Games made with Game-Maker', icon: '🗂️', render: () => catalog(ctx) },
    { id: 'bard', title: 'The Bard of Bizarre catalog', note: 'Bizarre gospels, mundane epics & more', icon: '🎸', render: () => bardCatalog() },
    { id: 'poster', title: 'Poster', note: 'Games made with Game-Maker', icon: '🖼️', render: poster },
    { id: 'bbs', title: 'BBS ad', note: 'Call the Sandbox BBS', icon: '📞', render: () => bbsAd() },
    {
      id: 'stickers',
      title: 'Sticker sheet',
      note: 'Heroes from every Sandbox game',
      icon: '⭐',
      render: () =>
        mixedStickers(
          gmStickerSpecs(family, (g) => contextFor(g, family)),
          'game-maker-se',
        ),
      screen: stickerScreen,
    },
  ];
}
