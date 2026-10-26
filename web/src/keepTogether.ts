// Word wrapping's one exception: THE CHEZ, the car's name, is never split across two lines.
// The wrappers on canvases and BBS screens split their text with words() instead of on spaces.

const PHRASE = /\b(THE|The|the)[ \u00a0](CHEZ|Chez)\b/g;

/** `text` split at its spaces into words for wrapping, THE CHEZ kept as one word. */
export function words(text: string): string[] {
  return text
    .replace(PHRASE, '$1\u00a0$2')
    .split(/[^\S\u00a0]+/)
    .map((w) => w.replace(/\u00a0/g, ' '));
}
