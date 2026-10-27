// Every line of the tour as plain data, for the narration script that records a voice clip
// per line (public/tour/voice/<chapter>/<id>.ogg) and lists them in that folder's README. No
// DOM: it runs under vite-node.
//
//   import { tourLines } from '../src/tour/lines';
import { CHAPTERS } from './chapters/index';
import { HOSTS, type Action, type Chapter, type HostVoice, type TourStep } from './steps';

export interface TourLine {
  /** The step's id, and the clip's file name without .ogg. */
  id: string;
  /** The chapter's id, the clip's folder. */
  chapter: string;
  /** Where it is used, in plain words: "Home: points at the New game button". */
  where: string;
  /** Who says it. */
  speaker: string;
  /** What the bubble says (the words to record). */
  text: string;
  /** The speaker's recorded voice. */
  voice: HostVoice;
}

const DOING: Record<Action, string> = {
  enter: 'comes on',
  walk: 'walks to',
  point: 'points at',
  press: 'presses',
  say: 'talks',
  exit: 'says goodbye and walks off',
};

/** Where a step is used: the page, what the host does, and the control. */
export function whereOf(chapter: Chapter, step: TourStep): string {
  const who = HOSTS[step.actor ?? chapter.actor].name;
  const label = step.target?.label;
  const aimed = step.action === 'walk' || step.action === 'point' || step.action === 'press';
  return `${chapter.place}: ${who} ${DOING[step.action]}${label ? (aimed ? ` ${label}` : `, by ${label}`) : ''}`;
}

/** The lines to record: every step a voiced host says (a barking host's are left to its sound). */
export function tourLines(): TourLine[] {
  return CHAPTERS.flatMap((c) =>
    c.steps
      .filter((s) => HOSTS[s.speaker ?? c.speaker].voiced)
      .map((s) => {
        const host = HOSTS[s.speaker ?? c.speaker];
        return { id: s.id, chapter: c.id, where: whereOf(c, s), speaker: host.name, text: s.say, voice: host.voice };
      }),
  );
}
