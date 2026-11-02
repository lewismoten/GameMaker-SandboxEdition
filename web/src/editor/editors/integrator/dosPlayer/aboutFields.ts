// The DOS player panel's About (F10) tab, above its frame and colors: the page's words, read-only
// (RSD's attribution, or the original author's from the player the game was imported with), with
// a switch between the page as the DOS player shows it and as Play on the web does, and which page.
import { h } from '../../../core/ui';
import type { PlayerAbout } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { PlayerOrigin } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';
import { originText, playerAbout } from '../../../../dosPlayer/playerOrigin';

export type AboutView = 'dos' | 'web';

/**
 * GMabout's words in XFERPLAY 3.00 (code/GM/PLAYGAME.C), where it writes them. The order line's
 * phone number is left out here; the DOS player shows it.
 */
const DOS_ABOUT: [number, string][][] = [
  [
    [40, '      G A M E - M A K E R'],
    [48, '          Version 3.00   '],
    [64, 'Recreational Software Designs'],
    [72, 'Box 1163,  Amherst, NH, 03031'],
    [88, 'This game was made with GAME-'],
    [96, 'MAKER.  No programming needed!'],
    [104, 'Design your own worlds, mon-  '],
    [112, 'sters, characters, sounds...  '],
    [128, 'Game-Maker software, documen- '],
    [136, 'tation, and data files are    '],
    [144, 'COPYRIGHTED and may be copied '],
    [152, 'only as allowed by the license'],
    [160, 'agreement.'],
    [168, '                      MORE... '],
  ],
  [
    [40, 'Order from your local         '],
    [48, 'computer store or:            '],
    [64, ' KD Software                  '],
    [72, ' Rochester, NH, 03867         '],
    [80, '      (phone number left out) '],
    [96, '            Visa/MC           '],
    [104, ' Call for the latest price!   '],
  ],
];

/** What the preview's About page shows in each view. */
export function aboutLookOf(view: AboutView, origin: PlayerOrigin | undefined): PlayerAbout | undefined {
  if (view === 'web') return playerAbout(origin);
  return { pages: playerAbout(origin)?.pages ?? DOS_ABOUT };
}

interface AboutOpts {
  id: string;
  view: AboutView;
  page: number;
  origin: PlayerOrigin | undefined;
  change: (view: AboutView, page: number) => void;
}

function radios(name: string, legend: string, options: [string, string][], on: string, pick: (v: string) => void): HTMLElement {
  return h(
    'fieldset',
    { class: 'dp-about-switch' },
    h('legend', null, legend),
    ...options.map(([v, label]) =>
      h('label', { class: 'dp-about-choice' }, h('input', { type: 'radio', name, value: v, checked: v === on, onchange: () => pick(v) }), label),
    ),
  );
}

/** The About tab's own section: the switch, the words and why they can't be edited. */
export function aboutFields(o: AboutOpts): HTMLElement {
  const look = aboutLookOf(o.view, o.origin);
  const own = !!o.origin?.about?.length;
  const pages = look?.pages ?? [];
  const lines = o.view === 'web' && !own ? ['(this edition’s words, with RSD’s notice)'] : pages.flat().map(([, t]) => t);
  const why =
    o.view === 'web'
      ? 'Play on the web shows this page; it isn’t a setting, so it can’t be edited.'
      : own
        ? `Read-only: this is the original author’s attribution${o.origin?.aboutAuthor ? ` (${o.origin.aboutAuthor})` : ''}, kept from the player this game was imported with.`
        : 'Read-only: this is Recreational Software Designs’ attribution, which the DOS player keeps.';
  return h(
    'section',
    { class: 'dp-section dp-about', 'aria-labelledby': `${o.id}-about-h` },
    h('h3', { id: `${o.id}-about-h` }, 'Its words'),
    radios(
      `${o.id}-about-view`,
      'Show the page',
      [
        ['dos', 'As in DOS'],
        ['web', 'As on the web'],
      ],
      o.view,
      (v) => o.change(v as AboutView, o.page),
    ),
    radios(
      `${o.id}-about-page`,
      'Page',
      pages.map((_, i): [string, string] => [String(i), `Page ${i + 1}`]),
      String(o.page),
      (v) => o.change(o.view, Number(v)),
    ),
    h('p', { class: 'dp-about-why' }, why),
    o.origin ? h('p', { class: 'dp-about-why' }, `Originally made with ${originText(o.origin)} (${o.origin.confidence} confidence).`) : null,
    h('pre', { class: 'dp-about-text', tabindex: '0', 'aria-label': 'The About page’s words (read-only)' }, lines.join('\n')),
  );
}
