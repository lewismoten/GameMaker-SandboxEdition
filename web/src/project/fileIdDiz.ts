// FILE_ID.DIZ: the short description BBS software read out of an uploaded ZIP and showed beside
// the file. At most 10 lines of 45 characters, plain ASCII, CRLF line ends. `fileIdDiz` writes one
// from the About fields (aboutGame.ts); `readFileIdDiz` reads one back from an imported ZIP.
import type { AboutGame } from './aboutGame';

export const DIZ_LINES = 10;
export const DIZ_WIDTH = 45;
/** The file's name in a ZIP. */
export const DIZ_NAME = 'FILE_ID.DIZ';

/** Plain ASCII: accents lose their marks, curly quotes straighten, anything else drops out. */
export function asciiOnly(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word-wraps to `width`, breaking a word longer than a line. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(' ').filter(Boolean)) {
    while (word.length > width) {
      if (line) lines.push(line);
      lines.push(word.slice(0, width));
      word = word.slice(width);
      line = '';
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const cut = (s: string) => (s.length > DIZ_WIDTH ? `${s.slice(0, DIZ_WIDTH - 3).trimEnd()}...` : s);

/** The FILE_ID.DIZ lines for a game (empty when there is nothing to say). */
export function fileIdDizLines(about: AboutGame, fallbackTitle: string, version?: string): string[] {
  const title = asciiOnly(about.title ?? fallbackTitle);
  if (!title) return [];
  const head = [cut(version ? `${title} v${asciiOnly(version)}` : title)];
  const by = asciiOnly([about.author, about.company].filter(Boolean).join(' / '));
  const credit = [by && `by ${by}`, about.year && asciiOnly(about.year)].filter(Boolean).join(', ');
  if (credit) head.push(cut(credit));
  const tail: string[] = [];
  if (about.genre) tail.push(cut(asciiOnly(about.genre)));
  if (about.website) tail.push(cut(asciiOnly(about.website)));
  if (about.license) tail.push(cut(asciiOnly(about.license)));
  const room = Math.max(0, DIZ_LINES - head.length - tail.length);
  let body = wrap(asciiOnly(about.description ?? about.story ?? ''), DIZ_WIDTH);
  if (body.length > room) {
    body = body.slice(0, room);
    if (room) body[room - 1] = cut(`${body[room - 1].slice(0, DIZ_WIDTH - 3)}...`);
  }
  return [...head, ...body, ...tail].slice(0, DIZ_LINES);
}

/** The file's bytes (CRLF lines), or undefined when there is nothing to say. */
export function fileIdDiz(about: AboutGame, fallbackTitle: string, version?: string): Uint8Array | undefined {
  const lines = fileIdDizLines(about, fallbackTitle, version);
  return lines.length ? new TextEncoder().encode(lines.join('\r\n') + '\r\n') : undefined;
}

/** What a FILE_ID.DIZ says, as About fields: the first line is the title (a trailing "v1.2" is the version), "by X / Y, 1994" the credit. */
export function readFileIdDiz(bytes: Uint8Array): { about: AboutGame; version?: string } {
  const text = new TextDecoder('latin1').decode(bytes).replace(/\x1a/g, '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\x20-\x7e]/g, '').trim())
    .filter(Boolean);
  const about: AboutGame = {};
  let version: string | undefined;
  const first = lines.shift();
  if (first) {
    const m = /^(.*\S)\s+v?(\d+(?:\.\d+)+[0-9A-Za-z.+-]*)$/i.exec(first);
    about.title = m ? m[1] : first;
    if (m) version = m[2];
  }
  const rest: string[] = [];
  for (const l of lines) {
    const by = /^by\s+(.+?)(?:,\s*((?:19|20)\d\d))?$/i.exec(l);
    if (by && !about.author && !rest.length) {
      const [author, company] = by[1].split(/\s+\/\s+/);
      about.author = author;
      if (company) about.company = company;
      if (by[2]) about.year = by[2];
    } else if (/^(https?:\/\/|www\.)\S+$/i.test(l)) about.website = l;
    else rest.push(l);
  }
  if (rest.length) about.description = rest.join(' ');
  return { about, version };
}
