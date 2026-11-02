// Word wrap for BBS screens: words (kept together by keepTogether) packed into lines of at most `width` characters.
import { words } from '../../keepTogether';

export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of words(text)) {
    if ((line + ' ' + word).trim().length > width) {
      out.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out;
}
