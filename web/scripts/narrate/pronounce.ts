// The pronunciation lexicon (pronounce.json): made-up and unusual words respelled so the voices
// say them as meant. spokenText applies it last, so only what the text-to-speech is handed
// changes; the bubbles and captions keep the written words. Each entry gives the respelling
// ("say"), an optional one for Kokoro's voices ("kokoro", which read spelling differently from
// Pocket TTS), and the sound it should make ("sounds", stressed syllable in capitals) for a
// person checking it. npm run voice:words records and hears each entry (words.ts).
import lexicon from './pronounce.json';
import type { Engine } from './spoken';

export interface Pronunciation {
  /** The respelling handed to Pocket TTS (and to Kokoro, unless `kokoro` is given). */
  say: string;
  /** A respelling only for Kokoro's voices. */
  kokoro?: string;
  /** How it should sound, in plain syllables with the stressed one in capitals: "GRAV-ih-tahss". */
  sounds: string;
  /** Why the entry is there: what the voice said wrong, and what heard it. */
  note?: string;
}

export type Lexicon = Record<string, Pronunciation>;

export const LEXICON: Lexicon = (lexicon as { words: Lexicon }).words;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One pass per engine: longest words first, whole words only, any case. */
function rules(lex: Lexicon, engine: Engine): [RegExp, string][] {
  return Object.keys(lex)
    .sort((a, b) => b.length - a.length)
    .map((word) => [new RegExp(`(?<![\\p{L}\\p{N}])${escape(word)}(?![\\p{L}\\p{N}])`, 'giu'), (engine === 'kokoro' && lex[word].kokoro) || lex[word].say]);
}

const cache = new Map<Engine, [RegExp, string][]>();

/** `text` with every lexicon word swapped for its respelling (whole words, case-insensitive). */
export function applyLexicon(text: string, engine: Engine = 'pocket', lex: Lexicon = LEXICON): string {
  // voice:words -- --compare records the words as written too, with the lexicon off
  if (lex === LEXICON && process.env.NARRATE_LEXICON === 'off') return text;
  let r = lex === LEXICON ? cache.get(engine) : undefined;
  if (!r) {
    r = rules(lex, engine);
    if (lex === LEXICON) cache.set(engine, r);
  }
  // a function, so a $ in a respelling is never read as a group
  for (const [from, to] of r) text = text.replace(from, () => to);
  return text;
}
