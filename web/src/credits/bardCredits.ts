// Who and what made each of The Bard of Bizarre's games, for the table on the Credits page:
// one row per game, one column per tool or source. Taken from each game's credits screen and
// LICENSE.TXT (games/<id>/disk/credits.txt, license.txt, written from its SONG_CREDIT) and
// NOTICE.md; bardCredits.test.ts checks every cell against those texts.

export type BardColumn = 'chatgpt' | 'riffusionMusic' | 'riffusionCover' | 'claudeArt' | 'arranged' | 'composed' | 'clips' | 'whisper' | 'photo' | 'logo';

/**
 * Riffusion, Producer.ai and Google Flow Music are one service under three names: Riffusion
 * renamed itself Producer.ai, and Google bought it and made it Google Flow Music. It is one
 * column here, whichever name a game's credits use for when its part was made.
 */
export const RIFFUSION_NAMES = /Riffusion|Producer\.ai|Google Flow Music/;

/** The columns in order: a short header, and the full meaning for the caption's key and screen readers. */
export const BARD_COLUMNS: { key: BardColumn; short: string; long: string }[] = [
  { key: 'chatgpt', short: 'Words: ChatGPT', long: 'Lyrics or monologue shaped by ChatGPT from Lewis’s prompts' },
  { key: 'riffusionMusic', short: 'Recording: Riffusion', long: 'Music and vocals (or the spoken recording) made with Riffusion, now Google Flow Music' },
  { key: 'riffusionCover', short: 'Cover: Riffusion', long: 'Cover art made with Riffusion (Mustard Seed Hustle’s while it was called Producer.ai)' },
  { key: 'claudeArt', short: 'Art: Claude', long: 'Title and cover art drawn for the game by Claude Opus 5.5' },
  { key: 'arranged', short: 'FM arranged: Claude', long: 'FM (CMF) score arranged by Claude from the recording' },
  { key: 'composed', short: 'Music composed: Claude', long: 'Music composed for the game by Claude Opus 5.5' },
  {
    key: 'clips',
    short: 'Voice clips (non-commercial)',
    long: 'Sung or spoken clips cut from the recording, which was made on Riffusion’s free plan: personal, non-commercial use only, not MIT',
  },
  { key: 'whisper', short: 'Timed: Whisper', long: 'Clip cues found with Whisper’s word timings' },
  { key: 'photo', short: 'Photo: Lewis', long: 'Doc Leo photo by Lewis Moten' },
  { key: 'logo', short: 'Logo: DeepAI', long: 'The Bard of Bizarre logo, made with DeepAI' },
];

export interface BardGame {
  id: string;
  title: string;
  made: BardColumn[];
  /** Anything the columns don't say. */
  note?: string;
}

const RECORDED: BardColumn[] = ['chatgpt', 'riffusionMusic', 'arranged', 'clips', 'whisper', 'photo', 'logo'];

export const BARD_GAMES: BardGame[] = [
  { id: 'goat', title: 'Third Goat from the Left', made: [...RECORDED, 'riffusionCover'] },
  {
    id: 'mustard',
    title: 'Mustard Seed Hustle',
    made: [...RECORDED, 'riffusionCover'],
    note: 'Its animated cover was made with Riffusion while it was called Producer.ai; the title cartoon is made from it.',
  },
  {
    id: 'needle',
    title: 'Thread the Needle, Brother Camel',
    made: [...RECORDED, 'riffusionCover'],
    note: 'The animated cover was made with Riffusion; the title cartoon is made from it.',
  },
  { id: 'loaf', title: 'Loaf #13 (Left in the Basket)', made: [...RECORDED, 'claudeArt'] },
  {
    id: 'tickle',
    title: 'Certified Rat Tickler',
    made: ['chatgpt', 'claudeArt', 'composed', 'photo', 'logo'],
    note: 'No recording came with the song, so Claude composed its FM tango and drew the certificate too.',
  },
  { id: 'carl', title: 'A Fly Named Carl', made: [...RECORDED, 'claudeArt'] },
  { id: 'remote', title: 'Where’s the Remote?!', made: [...RECORDED, 'claudeArt'] },
  {
    id: 'reckoning',
    title: 'The Great Dairy Reckoning of 3:17 A.M.',
    made: ['chatgpt', 'riffusionMusic', 'claudeArt', 'composed', 'clips', 'whisper', 'photo', 'logo'],
    note: 'A spoken piece: the recording is a voice alone, so Claude composed the music under it.',
  },
  { id: 'loofah', title: 'Cleanse Me, O Loofah, But Leave My Soul', made: [...RECORDED, 'claudeArt'] },
  { id: 'smirked', title: 'I Screamed, She Smirked', made: [...RECORDED, 'claudeArt'] },
  {
    id: 'sweats',
    title: 'Shakespeare in Sweatpants',
    made: ['chatgpt', 'riffusionMusic', 'claudeArt', 'composed', 'clips', 'whisper', 'photo', 'logo'],
    note: 'Seventeen monologues. Claude composed the FM score from the tempo, key and chords of the recordings’ music beds. The coffee house is inspired by Lewis’s memories of the Beehive in Oakland, Pittsburgh.',
  },
  { id: 'risi', title: 'Veni, Vidi, Risi!', made: [...RECORDED, 'claudeArt'], note: 'Six Latin songs by Lewis’s group Veni, Vidi, Risi!' },
];
