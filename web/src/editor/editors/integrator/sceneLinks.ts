// Validated integrator links: destinations, exit blocks, and arrivals typed or picked on a map.
import { h, numberField, selectField, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, type Game, type Point, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { pickOnMap } from './pickOnMap';
import { canLink, removeLink, retarget, setFrom, setTo } from './linkEdits';
import { entranceConflict, exitConflict } from './linkConflicts';
import { sceneName } from './linkSpots';

interface LinksContext {
  project: Project;
  game: Game;
  scene: number;
  sceneOptions(): [number, string][];
  changed(): void;
  rerender(): void;
}

const conflictMessage = 'Choose a free block: entrances cannot overlap exits, and each exit needs its own block.';

/** New links choose free defaults; an explicitly edited position is never silently moved. */
function freeBlock(preferred: Point, blocked: (at: Point) => boolean): Point | undefined {
  if (!blocked(preferred)) return { ...preferred };
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) if (!blocked({ x, y })) return { x, y };
  return undefined;
}

function destination(ctx: LinksContext, s: Scene, index: number, target: number): void {
  if (target === NOSCENE) {
    removeLink(ctx.game, ctx.scene, index);
    ctx.changed();
    return ctx.rerender();
  }
  const link = s.links[index];
  const previous = { ...link };
  if (link.toScene === NOSCENE && canLink(ctx.game, ctx.scene, target)) {
    const from = freeBlock(link.from, (at) => exitConflict(ctx.game, ctx.scene, at, index));
    const to = from && freeBlock(link.to, (at) => entranceConflict(ctx.game, target, at) || (target === ctx.scene && at.x === from.x && at.y === from.y));
    if (from && to) {
      link.from = from;
      link.to = to;
    }
  }
  if (retarget(ctx.game, ctx.scene, index, target)) ctx.changed();
  else {
    Object.assign(link, previous);
    toast(canLink(ctx.game, ctx.scene, target) ? conflictMessage : 'The start must lead to a level. Choose a valid destination scene.', 'error');
  }
  ctx.rerender();
}

/** Coordinate fields commit through the same validation as map markers. */
function pointField(ctx: LinksContext, point: Point, label: string, sceneForMap: number, commit: (at: Point) => boolean): HTMLElement {
  const apply = (at: Point) => {
    if (commit(at)) ctx.changed();
    else toast(conflictMessage, 'error');
    ctx.rerender();
  };
  return h(
    'span',
    { class: 'row', style: 'gap:4px;align-items:center;flex-wrap:nowrap' },
    numberField(
      `${label} x`,
      () => point.x,
      (x) => apply({ ...point, x }),
      { min: 0, max: MLEN - 1 },
    ),
    numberField(
      `${label} y`,
      () => point.y,
      (y) => apply({ ...point, y }),
      { min: 0, max: MWID - 1 },
    ),
    h(
      'button',
      {
        title: `Pick ${label.toLowerCase()} block on the map`,
        onclick: async () => {
          const pick = await pickOnMap(ctx.project, ctx.game, sceneForMap, point, `${label}: click a map block`);
          if (pick) apply(pick);
        },
      },
      '⌖',
    ),
  );
}

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
        : 'Each exit needs its own block, separate from entrances. Link to Game Won to end the game; an ending has no arrival block.',
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
          ...s.links.slice(0, kind === 'start' ? 1 : MAXSCENELINKS).map((link, index) => {
            const options = ctx.sceneOptions().filter(([target]) => target === NOSCENE || canLink(ctx.game, ctx.scene, target));
            if (!options.some(([target]) => target === link.toScene))
              options.push([link.toScene, `${sceneName(ctx.game, link.toScene)} (invalid destination)`]);
            return h(
              'tr',
              null,
              h('td', null, index + 1),
              h(
                'td',
                null,
                selectField(
                  '',
                  options,
                  () => link.toScene,
                  (target) => destination(ctx, s, index, target),
                  `Link ${index + 1} goes to`,
                ),
              ),
              kind === 'start'
                ? null
                : h('td', null, link.toScene === NOSCENE ? '' : pointField(ctx, link.from, 'From', ctx.scene, (at) => setFrom(ctx.game, ctx.scene, index, at))),
              h(
                'td',
                null,
                ctx.game.scenes[link.toScene]?.gametype === ADVTYPE
                  ? pointField(ctx, link.to, 'To', link.toScene, (at) => setTo(ctx.game, ctx.scene, index, at))
                  : link.toScene === NOSCENE
                    ? ''
                    : '—',
              ),
            );
          }),
        ),
      ),
    ),
  );
}
