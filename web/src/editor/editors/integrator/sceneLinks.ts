// The integrator's "Links to other scenes" panel for the selected scene (a start scene's
// one link picks the first level and where the hero starts): for each link, the scene it
// goes to, the block on this map that leads there and the block it arrives at, typed or
// picked on the map. integrator.ts shows it under the scene's files.
import { h, numberField, selectField } from '../../core/ui';
import type { Project } from '../../core/project';
import { MAXSCENELINKS, NOSCENE, type Game, type Point, type Scene } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { pickOnMap } from './pickOnMap';

/** What the links panel needs from the integrator. */
export interface LinksContext {
  project: Project;
  game: Game;
  /** The selected scene: the one whose links these are. */
  scene: number;
  /** The scenes a link can go to, for its drop-down. */
  sceneOptions(): [number, string][];
  /** A link changed: save the .gam and redraw the board. */
  changed(): void;
  /** Redraw the panel (a link's target changed, or a block was picked on the map). */
  rerender(): void;
}

/** A block's x and y, with a button to pick it on the map of `sceneForMap`. */
const pointField = (ctx: LinksContext, p: Point, label: string, sceneForMap: number) =>
  h(
    'span',
    { class: 'row', style: 'gap:4px;align-items:center;flex-wrap:nowrap' },
    numberField(
      `${label} x`,
      () => p.x,
      (v) => ((p.x = v), ctx.changed()),
      { min: 0, max: MLEN - 1 },
    ),
    numberField(
      'y',
      () => p.y,
      (v) => ((p.y = v), ctx.changed()),
      { min: 0, max: MWID - 1 },
    ),
    h(
      'button',
      {
        title: 'Pick on the map',
        onclick: async () => {
          const pick = await pickOnMap(ctx.project, ctx.game, sceneForMap, p, `${label}: click a map block`);
          if (pick) {
            p.x = pick.x;
            p.y = pick.y;
            ctx.changed();
            ctx.rerender();
          }
        },
      },
      '⌖',
    ),
  );

/** The links table, as a panel. */
export function linksPanel(ctx: LinksContext, s: Scene, kind: 'start' | 'adventure' | 'unused'): HTMLElement {
  return h(
    'div',
    { class: 'panel' },
    h('h2', { style: 'margin-top:0' }, kind === 'start' ? 'Where the game starts' : 'Links to other scenes'),
    h(
      'p',
      { class: 'hint' },
      kind === 'start'
        ? 'Link 1 picks the first level and the block where the character starts in it.'
        : 'When the character touches the “from” block, play continues in the linked scene at its “to” block. Link to “Game Won” to end the game.',
    ),
    h(
      'div',
      { class: 'grator-links' },
      h(
        'table',
        { class: 'data' },
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, '#'),
            h('th', null, 'Go to scene'),
            kind === 'start' ? null : h('th', null, 'From block (this map)'),
            h('th', null, 'To block (its map)'),
          ),
        ),
        h(
          'tbody',
          null,
          ...s.links.slice(0, kind === 'start' ? 1 : MAXSCENELINKS).map((l, i) =>
            h(
              'tr',
              null,
              h('td', null, i + 1),
              h(
                'td',
                null,
                selectField(
                  '',
                  ctx.sceneOptions(),
                  () => l.toScene,
                  (v) => ((l.toScene = v), ctx.changed(), ctx.rerender()),
                  `Link ${i + 1} goes to`,
                ),
              ),
              kind === 'start' ? null : h('td', null, l.toScene === NOSCENE ? '' : pointField(ctx, l.from, 'From', ctx.scene)),
              h('td', null, l.toScene === NOSCENE ? '' : pointField(ctx, l.to, 'To', l.toScene)),
            ),
          ),
        ),
      ),
    ),
  );
}
