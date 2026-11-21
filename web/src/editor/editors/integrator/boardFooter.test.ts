// A card's footer label keeps a positive width even when song buttons crowd a narrow card.
import { describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../../../project/files';
import { newGame, serializeGame, STARTTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Project } from '../../core/project';
import { drawCard, type BoardView } from './board';

function footerWidth(cardW: number): number | undefined {
  const game = newGame('Footer');
  const s = game.scenes[0];
  s.gametype = STARTTYPE;
  s.desc = 'Title';
  s.files[1] = 'a.cmf';
  s.files[3] = 'b.cmf';
  const files = new GameFiles([
    ['game.gam', serializeGame(game)],
    ['a.cmf', new Uint8Array(1)],
    ['b.cmf', new Uint8Array(1)],
  ]);
  const project = Project.fromFiles(files, 'Footer', 'footer');
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = {
    fillText: (...a: unknown[]) => calls.push(a),
    measureText: () => ({ width: 10 }),
  };
  const ctx = new Proxy(target, { get: (t, k) => (k in t ? t[k as string] : vi.fn()), set: () => true }) as unknown as CanvasRenderingContext2D;
  const v: BoardView = { project, game: project.game(), selected: -1, playing: undefined, screenOf: () => undefined, levelOf: () => undefined };
  drawCard(ctx, 0, true, v, { x: 0, y: 0, w: cardW, h: 150 });
  return calls.find((c) => c[0] === 'start')?.[3] as number | undefined;
}

describe('a card footer', () => {
  it('gets a positive, usable width on a card too narrow for its buttons', () => {
    const w = footerWidth(30);
    expect(w).toBeGreaterThanOrEqual(20);
  });
  it('gets the room the buttons leave on a wide card', () => {
    const w = footerWidth(300)!;
    expect(w).toBeGreaterThan(20);
    expect(w).toBeLessThan(300);
  });
});
