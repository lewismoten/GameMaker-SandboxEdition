// The Programmer's Guide to Game-Maker 3.0: its chapters in reading order. Each is one Markdown file in chapters/, loaded when its page is
// opened (the contents page reads none of them).
export interface Chapter {
  /** The address part (#/programmers-guide/<id>) and the file name. */
  id: string;
  /** '3', or '' for an appendix. */
  no: string;
  title: string;
  /** One line for the contents page. */
  about: string;
}

export const BOOK_TITLE = 'The Programmer’s Guide to Game-Maker 3.0';

export const CHAPTERS: Chapter[] = [
  { id: 'reading', no: '1', title: 'Reading this book', about: 'How the player was built, what the tags mean, how to read a citation.' },
  { id: 'memory', no: '2', title: 'The memory model', about: 'Real mode, the large model and why nothing is bigger than 64 KB.' },
  {
    id: 'screen',
    no: '3',
    title: 'The screen and the blocks',
    about: '320 x 200, 16 x 10 blocks, the 312 x 196 crop while playing, 4-pixel scrolling and the edge cells.',
  },
  { id: 'maps', no: '4', title: 'Maps, scenes and the memory budget', about: '100 x 100 maps, 200 monsters, 20 links and what a game costs in memory.' },
  { id: 'blocks', no: '5', title: 'Background blocks', about: 'The 420-byte block record, field by field.' },
  { id: 'monsters', no: '6', title: 'Monsters', about: '64 types, 20 frames, 10 path corners, 200 placed and 50 drawn.' },
  { id: 'character', no: '7', title: 'The character and its sequences', about: 'The 3,784-byte hero, 20 sequences and the 11-pixel speed cap.' },
  { id: 'touch', no: '8', title: 'Touch and collision', about: 'Five different tests of "touching", and where the surprises come from.' },
  { id: 'counters', no: '9', title: 'Counters and effects', about: 'The thirty counters, infinite repeat and refused touches.' },
  { id: 'sound', no: '10', title: 'Sound', about: 'The speaker, digital sound and music, and why VOC files chopped on a 286.' },
  { id: 'palettes', no: '11', title: 'Palettes and fades', about: '256 six-bit colors, fades and the transparent color.' },
  { id: 'timing', no: '12', title: 'Timing and the game loop', about: 'The timer chip, the tick, skipped ticks and a slow PC.' },
  { id: 'formats', no: '13', title: 'File formats, byte by byte', about: 'Every file Game-Maker writes, with its size and layout.' },
  {
    id: 'quirks',
    no: '14',
    title: 'Quirks kept for fidelity, and fields PLAYGAME ignores',
    about: 'What the player does that looks like a bug, and the fields it never reads.',
  },
  { id: 'tricks', no: '15', title: 'Tips and tricks that use the rules', about: 'Tricks that follow from the earlier chapters.' },
  { id: 'versions', no: '16', title: 'How the player grew, 1.0 to 3.0', about: 'The versions side by side, from the files themselves.' },
  {
    id: 'patching',
    no: '17',
    title: 'Patching the player',
    about: 'XFERPLAY.EXE’s settings by offset, how a patch is applied and spotted, and the line it keeps.',
  },
  { id: 'limits', no: '', title: 'Appendix: limits at a glance', about: 'Every limit in one table: its value, its cause and where to read about it.' },
];

export const chapterById = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id);

const files = import.meta.glob<string>('./chapters/*.md', { query: '?raw', import: 'default' });

/** One chapter's Markdown. */
export async function loadChapter(id: string): Promise<string> {
  const load = files[`./chapters/${id}.md`];
  if (!load) throw new Error(`no chapter ${id}`);
  return load();
}
