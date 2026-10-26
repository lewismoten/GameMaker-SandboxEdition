// The Play Level menu's model, with no DOM: every way the game's links bring the player into a
// level (integrator/linkSpots.ts), the pick the main part of the button plays (the last one
// chosen, else a way into the level whose map is open, else the first), and the copy of the
// game that starts there. The buttons are playButtons.ts.
import type { Game, Point } from '../../formats/game';
import { waysIn, wayInLabel, type WayIn } from '../editors/integrator/linkSpots';
import { startingAtSpot } from '../editors/integrator/startAt';

/** A Play Level pick: where the hero starts, and the link that brings them there. */
export interface PlayPick {
  to: number;
  at: Point;
  from: number;
  link: number;
}

/** One menu entry. */
export interface PlayChoice extends PlayPick {
  label: string;
}

/** The menu: every way into a level, in the integrator's order. */
export function playChoices(game: Game): PlayChoice[] {
  return waysIn(game).map((w: WayIn) => ({ ...w, label: wayInLabel(game, w) }));
}

/**
 * What the main part plays: `last` as it is now (its link's current spot, if the link still
 * leads there), else the first way into `here` (the open map's level), else the first entry.
 */
export function currentPick(choices: readonly PlayChoice[], last?: PlayPick, here?: number): PlayChoice | undefined {
  if (last) {
    const same = choices.find((c) => c.from === last.from && c.link === last.link && c.to === last.to);
    if (same) return same;
    const spot = choices.find((c) => c.to === last.to && c.at.x === last.at.x && c.at.y === last.at.y);
    if (spot) return spot;
  }
  return (here !== undefined ? choices.find((c) => c.to === here) : undefined) ?? choices[0];
}

/** The game to play for a pick: the game itself for its own start, else a copy starting at the pick. */
export function gameFor(game: Game, pick: PlayPick): Game {
  const start = game.scenes[0]?.links[0];
  if (pick.from === 0 && pick.link === 0 && start?.toScene === pick.to && start.to.x === pick.at.x && start.to.y === pick.at.y) return game;
  return startingAtSpot(game, pick.to, pick.at);
}

/** The pick written into the address (…?play=3.40.12.2.0: scene, x, y, from scene, link), so a reload plays it again. */
export function pickParam(p: PlayPick): string {
  return [p.to, p.at.x, p.at.y, p.from, p.link].join('.');
}

export function parsePick(s: string | undefined): PlayPick | undefined {
  const n = (s ?? '').split('.').map(Number);
  if (n.length !== 5 || n.some((v) => !Number.isInteger(v) || v < 0)) return undefined;
  return { to: n[0], at: { x: n[1], y: n[2] }, from: n[3], link: n[4] };
}
