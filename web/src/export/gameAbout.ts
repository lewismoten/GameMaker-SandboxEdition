// What a game says about itself, read from its own files: a few lines of its story or
// instruction screen (for descriptions) and, for shareware, the author's notice (readme /
// order form). Used by the build's game catalog (scripts/cdGames.ts) and by the web
// exports, which put them in the page's description tags and show the notice.

/** The author's readme / order form, by name. */
export const NOTICE_FILES = ['readme.txt', 'order.doc', 'register.txt', 'order.txt'];
const NOTICE_WORDS = /shareware|freeware|regist/i;

/** A DOS text file as plain text: up to the ^Z end mark, no CRs or control characters. */
export function dosText(bytes: Uint8Array): string {
  return new TextDecoder('latin1')
    .decode(bytes)
    .replace(/\x1a[\s\S]*$/, '')
    .replace(/\r/g, '')
    .replace(/[^\n\t\x20-\x7e]/g, '')
    .replace(/^\s*\n/, '')
    .trimEnd();
}

/** The game's story screen ("*s.txt", "*story*"), else its instructions ("*i.txt"), else any text screen. */
export function storyFile(names: string[]): string | undefined {
  const texts = names.filter((n) => n.endsWith('.txt') && n !== 'gmhelp.txt' && !NOTICE_FILES.includes(n) && !/cred|c\d?\.txt$|end/.test(n));
  return texts.find((n) => /(story|str|sl|s\d?)\.txt$/.test(n)) ?? texts.find((n) => /(instr|i\d?)\.txt$/.test(n)) ?? texts[0];
}

/** The first lines of a text screen joined into a sentence or two. */
export function blurbOf(text: string, max = 220): string | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    // Skip rules and letter-spaced headings ("C O N T R O L S").
    .filter((l) => l && !/^[-=*#~ ]+$/.test(l) && !/^(\S ){3,}\S$/.test(l));
  // Rejoin words hyphenated across the 31 column lines.
  const joined = lines.join(' ').replace(/(\w)- (\w)/g, '$1$2');
  if (!joined) return undefined;
  return joined.length > max ? `${joined.slice(0, max - 3).replace(/\s+\S*$/, '')}…` : joined;
}

export interface GameAbout {
  /** From the game's story or instruction screen. */
  blurb?: string;
  /** Shareware: the author's notice, as text. */
  notice?: string;
}

/** What a game's own files say about it (file names are matched in lower case). */
export function gameAbout(entries: [string, Uint8Array][]): GameAbout {
  const files = new Map(entries.map(([n, b]) => [n.toLowerCase(), b]));
  const names = [...files.keys()].sort();
  const story = storyFile(names);
  const blurb = story ? blurbOf(dosText(files.get(story)!)) : undefined;
  // Only text that talks about shareware or registering: a sample game's readme is not a notice.
  const own = NOTICE_FILES.filter((n) => files.has(n))
    .map((n) => dosText(files.get(n)!))
    .filter((t) => NOTICE_WORDS.test(t));
  const screens = names
    .filter((n) => n.endsWith('.txt') && !NOTICE_FILES.includes(n) && n !== 'gmhelp.txt')
    .map((n) => dosText(files.get(n)!))
    .filter((t) => NOTICE_WORDS.test(t));
  const notice = [...own, ...screens].filter(Boolean).join('\n\n----\n\n');
  return { ...(blurb ? { blurb } : {}), ...(notice ? { notice } : {}) };
}
