// The level check's stakes at the start of a game: so many lives that dying stops mattering, and
// a hero with nothing to fight with who comes in among enemies.
import { BACKBL } from '../../../formats/blocks';
import type { Game } from '../../../formats/game';
import { characterActions } from '../../keymap/keyMap';
import type { Finding } from '../findings';
import { linksInto } from '../sceneLinks';
import type { SceneData } from '../sceneData';
import { firstScene } from './heroStart';
import { hostile } from './monsterChecks';

/** More lives than this make a death cost nothing. */
const MANY_LIVES = 9;

export function stakes(game: Game, scenes: SceneData[]): Finding[] {
  const first = firstScene(game, scenes);
  if (!first) return [];
  const out: Finding[] = [];
  const lives = first.chr.meter[1];
  if (lives > MANY_LIVES)
    out.push({
      check: 'stakes',
      severity: 'warning',
      title: `The hero starts with ${lives} lives`,
      detail: `With more than ${MANY_LIVES}, a death costs nothing and the danger stops meaning much; three to five keeps a mistake worth avoiding. A game for very young players may want more.`,
      where: { scene: first.scene, file: first.names.chr },
    });
  // nothing to fire at the start (no fire key, or one that needs an object not carried)
  const carried = new Set(first.chr.inv);
  const armed = characterActions(first.chr).some(({ action }) => action.kind === 'fire' && (action.needsBlock === undefined || carried.has(action.needsBlock)));
  if (armed) return out;
  const foes = first.map.monsters.filter((p) => hostile(first.mon[p.monnum], first.mbl));
  for (const l of linksInto(game, first.scene)) {
    const near = foes.filter((p) => Math.abs(p.curx - l.to.x) <= 8 && Math.abs(p.cury - l.to.y) <= 5);
    if (near.length < 2) continue;
    out.push({
      check: 'start-threat',
      severity: 'warning',
      title: `The hero starts with nothing to fire, and ${near.length} enemies are on the first screen`,
      detail: `Where the hero comes in, at (${l.to.x}, ${l.to.y}), enemies are within a screen and the hero can’t fight back yet${first.chr.inv.some((b) => b < BACKBL) ? '' : ' (the inventory is empty)'}. Fine if dodging is the game; otherwise give the first screen a weapon to find, or start the enemies further off.`,
      where: { scene: first.scene, map: first.names.map, cell: l.to.y * 100 + l.to.x },
    });
    break;
  }
  return out;
}
