// The author's own plays of scenes (takes.ts), kept in the project's companion file (editor-only,
// section "myPlays" of the .gam) a scene each, with whether Make a walkthrough plays it ("mine")
// or lets the bot play that scene ("bot"). autoWalk replays a kept take on the same engine from
// wherever the walkthrough has got to (replayMine); a take that no longer reaches an exit, as
// the map has changed since, is left out and the bot plays the scene.
import type { Project } from '../../core/project';
import type { Game } from '../../../formats/game';
import { decodeKeys } from '../../../walkthrough/format';
import type { Entry } from '../explore';
import { SceneSim, TICKS_PER_SECOND, type FileSource } from '../sim';
import type { Replay } from './autoWalk';
import type { Take } from './takes';

export interface MyPlay extends Take {
  when: string;
  use: 'mine' | 'bot';
}

const SECTION = 'myPlays';

/** The kept plays, by scene number. */
export const myPlays = (project: Project): Record<string, MyPlay> => project.extras<Record<string, MyPlay>>(project.gam, SECTION, {});

/** Keeps a take as the author's play of its scene (replacing one kept before), to be used. */
export function keepPlay(project: Project, take: Take): MyPlay {
  const play: MyPlay = { ...take, when: new Date().toISOString(), use: 'mine' };
  project.setExtras(project.gam, SECTION, { ...myPlays(project), [take.scene]: play });
  return play;
}

/** Plays it in the walkthrough, or lets the bot play that scene. */
export function usePlay(project: Project, scene: number, use: MyPlay['use']): void {
  const all = myPlays(project);
  if (all[scene]) project.setExtras(project.gam, SECTION, { ...all, [scene]: { ...all[scene], use } });
}

export function dropPlay(project: Project, scene: number): void {
  const { [scene]: _gone, ...rest } = myPlays(project);
  project.setExtras(project.gam, SECTION, Object.keys(rest).length ? rest : undefined);
}

/** The keys of the plays to use, by scene (what autoWalk's `mine` takes). */
export const playsToUse = (project: Project): Record<number, string> =>
  Object.fromEntries(
    Object.values(myPlays(project))
      .filter((p) => p.use === 'mine')
      .map((p) => [p.scene, p.keys]),
  );

/** How long a take may go on after its last key before it is given up on (the hero walking on to a link). */
const AFTER_TICKS = Math.round(20 * TICKS_PER_SECOND);

/**
 * Plays a take's keys from the scene's entry (every monster moving, the monsters' numbers
 * seeded as the walkthrough seeds them) until the hero takes a link: the same Replay the bot's
 * paths give, or undefined if the hero dies or no link is taken in time.
 */
export async function replayMine(game: Game, files: FileSource, scene: number, entry: Entry, keys: string, seed = 1): Promise<Replay | undefined> {
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev, seed);
  const events: { tick: number; key: number }[] = [];
  let t = 0;
  for (const k of decodeKeys(keys)) events.push({ tick: (t += k.delta), key: k.key });
  const last = events.length ? events[events.length - 1].tick : 0;
  let next = 0;
  for (let tick = 1; tick <= last + AFTER_TICKS; tick++) {
    // a key is pressed before the tick it was applied on (as replayPath records them)
    for (; next < events.length && events[next].tick <= tick; next++) {
      const k = events[next].key;
      if (k < 0x80) sim.press(k);
      else sim.release(k & 0x7f);
    }
    const r = await sim.tick();
    if (r === 'dead') return undefined;
    if (r) {
      const ci = sim.w.ci;
      return {
        link: r.link,
        events: events.slice(0, next),
        ticks: tick,
        ci: { ...ci, inv: ci.inv.slice(), meter: ci.meter.slice(), seqon: ci.seqon.slice() },
        clock: sim.w.clock,
        world: sim.w,
      };
    }
  }
  return undefined;
}
