// The author's own plays of scenes (takes.ts), kept in the project's companion file (editor-only,
// section "myPlays" of the .gam) a scene each, with whether Make a walkthrough plays it ("mine")
// or lets the bot play that scene ("bot"). autoWalk replays a kept take on the same engine from
// wherever the walkthrough has got to; a take that no longer reaches an exit, as
// the map has changed since, is left out and the bot plays the scene (replayMine.ts, apart so
// the editor's dialogs that list the plays don't load the simulator).
import type { Project } from '../../core/project';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import type { Take } from './takes';

interface MyPlay extends Take {
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

/** A walkthrough of one scene alone (the game started there, as the play test starts it): its keys, from the scene's entry. */
export function oneScene(game: string, scene: number, title: string, keys: string, won: boolean, bot: boolean): Walkthrough {
  return {
    version: 1,
    game,
    rand: { seed: 1, per: 'scene' },
    hold: 2,
    story: false,
    bot: bot || undefined,
    partial: !won || undefined,
    segments: [{ scene, keys }],
    chapters: [{ scene, title }],
    timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] },
  };
}
