// Render the actual links panel with plain node records: no DOM or browser is needed.
import { expect, it, vi } from 'vitest';
import { ADVTYPE, STARTTYPE, NOSCENE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { linksPanel } from './sceneLinks';
import type { Project } from '../../core/project';

vi.mock('../../core/ui', () => ({
  h: (tag: string, attrs: unknown, ...children: unknown[]) => ({ tag, attrs, children }),
  selectField: () => null,
  numberField: () => null,
}));
vi.mock('./pickOnMap', () => ({ pickOnMap: vi.fn() }));

it.each(['start', 'adventure'] as const)('explains a full %s links panel without changing game bytes', (kind) => {
  const game = newGame('Test');
  const scene = emptyScene(kind === 'start' ? STARTTYPE : ADVTYPE);
  game.scenes.push(scene);
  const max = kind === 'start' ? 1 : 20;
  const ctx = { project: {} as Project, game, scene: game.scenes.length - 1, sceneOptions: () => [], changed: vi.fn(), rerender: vi.fn() };
  const render = () => JSON.stringify(linksPanel(ctx, scene, kind));
  expect(render()).not.toContain('this one is full');
  for (let i = 0; i < max; i++) scene.links[i].toScene = 1;
  const bytes = serializeGame(game);
  expect(render()).toContain(`DOS Game-Maker holds ${max} ${kind === 'start' ? 'starting link in a start scene' : 'links in a scene'}; this one is full.`);
  expect(serializeGame(game)).toEqual(bytes);
  expect(ctx.changed).not.toHaveBeenCalled();
  scene.links[0].toScene = NOSCENE;
  expect(render()).not.toContain('this one is full');
});
