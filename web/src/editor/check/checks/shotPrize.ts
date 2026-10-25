// The level check's "shots that destroy prizes": a monster that gives something when the hero
// touches it (points, health, a counter) whose power is below a shot the hero fires. Monsters
// that touch fight by power (engine/monsters.ts doCollision: the stronger kills the weaker), so
// a stray shot blows the prize away, sometimes the one the level needs.
import type { Block } from '../../../formats/blocks';
import type { Monster } from '../../../formats/monster';
import { characterActions } from '../../keymap/keyMap';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';
import { hostile, pictures } from './monsterChecks';

/** Does touching the monster give the hero something? */
const gives = (m: Monster, mbl: Block[]) =>
  pictures(m).some((p) => {
    const b = mbl[p];
    return !!b && (b.scorePts > 0 || b.chHitPt > 0 || (b.effect > 0 && b.eamt > 0));
  });

/** Does it add to a special counter (20 and up), the kind a gate reads? Losing one of those can stop the game. */
const counts = (m: Monster, mbl: Block[]) => pictures(m).some((p) => (mbl[p]?.effect ?? 0) >= 20 && mbl[p].eamt > 0);

export function shotPrize(d: SceneData): Finding[] {
  const shots = new Set(characterActions(d.chr).flatMap(({ action }) => action.fires));
  const strongest = Math.max(-1, ...[...shots].map((n) => d.mon[n]?.power ?? -1));
  if (strongest < 0) return [];
  const placed = new Set(d.map.monsters.map((p) => p.monnum));
  const out: Finding[] = [];
  d.mon.forEach((m, n) => {
    if (!placed.has(n) || shots.has(n) || m.end === -2 || m.power >= strongest || hostile(m, d.mbl) || !gives(m, d.mbl)) return;
    const cells = d.map.monsters.filter((p) => p.monnum === n).map((p) => p.cury * 100 + p.curx);
    out.push({
      check: 'shot-prize',
      // points or health lost to a stray shot is a shame; a counter a gate needs can end the game
      severity: counts(m, d.mbl) ? 'warning' : 'info',
      title: `The hero’s shots destroy prize monster ${n} (power ${m.power}, shots up to ${strongest})`,
      detail: `A shot that touches it kills it, so firing at an enemy nearby can take the prize away for good${counts(m, d.mbl) ? ', and with it a count a gate may need' : ''}. Give the prize a power equal to or above the shot’s (equal powers pass through each other), or make it a block.`,
      where: { scene: d.scene, map: d.names.map, cell: cells[0], cells, monster: { file: d.names.mon ?? '', n } },
    });
  });
  return out;
}
