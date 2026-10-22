// Everything the game is made of, compiled in memory: the reading room and Stacks, the
// wings, Joe, and the scene graph. build.ts writes it to disk; the tools play it.
import { buildJoe } from './characters/joe';
import { buildGame } from './game';
import { compileHub } from './levels/hub';
import { compileWing } from './levels/wing';
import { WING_SPECS } from './levels/wings';
import { buildJoeBlocks } from './sprites/joe';

export function compileAll() {
  const cb = buildJoeBlocks();
  const chr = buildJoe(cb);
  const wings = WING_SPECS.map((spec, i) => compileWing(spec, i));
  const hub = compileHub(WING_SPECS);
  const game = buildGame(hub, wings);
  return { cb, chr, wings, hub, game };
}

export type Compiled = ReturnType<typeof compileAll>;
