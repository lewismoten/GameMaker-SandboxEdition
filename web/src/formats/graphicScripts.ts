// Text-based "graphic" files used between scenes:
//  .bkd  { int xstart; int ystart; } followed by a GIF file name: show a 320x200 window of a GIF.
//  .lst  one file name per line with an optional pause in seconds: a slide show.
//  .txt  text shown 32 columns wide on the current screen.
import { Reader, latin1Text, textBytes } from './binary';

export interface Backdrop {
  x: number;
  y: number;
  gif: string;
}

export function parseBackdrop(bytes: Uint8Array): Backdrop {
  const r = new Reader(bytes);
  const x = r.i16();
  const y = r.i16();
  // drawbkd reads with fgets(…, 40) and cuts at the first newline.
  const rest = latin1Text(bytes.subarray(4, 4 + 39));
  const gif = rest.split(/[\r\n\0]/)[0].trim();
  return { x, y, gif };
}

export function serializeBackdrop(b: Backdrop): Uint8Array {
  const name = textBytes(b.gif);
  const out = new Uint8Array(4 + name.length);
  out[0] = b.x & 0xff;
  out[1] = (b.x >> 8) & 0xff;
  out[2] = b.y & 0xff;
  out[3] = (b.y >> 8) & 0xff;
  out.set(name, 4);
  return out;
}

export interface SlideEntry {
  name: string;
  /** Seconds to wait; undefined = the caller's default. */
  pause?: number;
}

/** Port of FileEntry/FileListClass: "name [pause]" per line, names up to 15 chars. */
export function parseSlideList(bytes: Uint8Array): SlideEntry[] {
  const out: SlideEntry[] = [];
  for (const raw of latin1Text(bytes).split('\n')) {
    const line = raw.replace(/[\r\x1a]/g, '');
    const m = /^([^ ]{0,15})[^ ]* *(.*)$/.exec(line);
    if (!m || !m[1]) continue;
    const pauseText = m[2].trim();
    out.push({ name: m[1].toLowerCase(), pause: pauseText ? parseInt(pauseText, 10) || 0 : undefined });
  }
  return out;
}

export function serializeSlideList(entries: SlideEntry[]): Uint8Array {
  return textBytes(entries.map((e) => (e.pause === undefined ? e.name : `${e.name} ${e.pause}`)).join('\r\n') + '\r\n');
}

/** Splits a .txt file into the 31 character lines Display_File shows (fgets with a 32 byte buffer). */
export function textLines(bytes: Uint8Array): string[] {
  // Text mode: CRLF -> LF and Ctrl-Z ends the file.
  const text = latin1Text(bytes).replace(/\x1a.*$/s, '').replace(/\r\n/g, '\n');
  const lines: string[] = [];
  // fgets(buf, 32, fp): up to 31 chars, stopping after (and keeping) a newline.
  for (let i = 0; i < text.length; ) {
    let end = i;
    while (end < text.length && end - i < 31) {
      if (text[end++] === '\n') break;
    }
    lines.push(text.slice(i, end).replace(/\n$/, ''));
    i = end;
  }
  return lines;
}
