// One graduation game, as data: the stage it closes, the hall it is held in and the words on its signs
// and pages. graduationBuild.ts turns it into the game's disk; the levels, bot and checks read it too.
import type { CameoName } from './graduationCameo';
import type { HallTheme } from './graduationTheme';

export interface Graduation {
  /** The game id and folder: "graduation-basics". */
  id: string;
  /** The stage's name: "First Steps". */
  stage: string;
  /** Names of the STARTER_GROUPS whose helpers sit in the audience. */
  groups: string[];
  /** Guests from the Cast who sit in the audience beside the helpers. */
  cameos: CameoName[];
  /** The hall's look. */
  theme: HallTheme;
  /** The game's title as the .GAM and the cards name it (19 characters at most); GRADUATION when left out. */
  title?: string;
  /** The title under GRADUATION on the cards: "FIRST STEPS". */
  upper: string;
  /** The ending's first line: HONORS! when left out. */
  endTitle?: string;
  /** The ending's second line: "IN FIRST STEPS". */
  honors: string;
  /** Signs along the carpet and the banner over the lectern. */
  signs: { start: string; helpers: string; cheer: string; doc: string; banner: string };
  /** The level's title and hint (its card). */
  level: { title: string; hint: string };
  /** The song's tempo, lead voice and transposition (graduationSong.ts). */
  song: { bpm: number; lead: 'lead' | 'brass' | 'organ' | 'bell' | 'strings'; transpose: number };
  /** The pages: the story, the win and the credits (graduationText.ts). */
  text: { story: string; won: string; credits: string };
}
