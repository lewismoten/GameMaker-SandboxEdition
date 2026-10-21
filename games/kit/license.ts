// LICENSE.TXT on every Sandbox Software disk: what's real and what's part of the story,
// who made the game, and the MIT License it's shared under. Laid out for Game-Maker's text
// screens: 30 columns, pages of 16 lines.
const COLS = 30;
const PAGE = 16;

/** Word-wraps a paragraph to 30 columns. */
function wrap30(text: string): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > COLS) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** Pads lines out to whole 16-line pages, never starting a page with a blank line. */
function pages(lines: string[]): string {
  const out: string[] = [];
  for (const l of lines) {
    if (l.length > COLS) throw new Error(`License line over ${COLS} columns: "${l}"`);
    if (!l && out.length % PAGE === 0) continue;
    out.push(l);
  }
  while (out.length % PAGE) out.push('');
  return out.join('\n');
}

const MIT = [
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
];

/** The disk's LICENSE.TXT for a game. */
export function licenseText(title: string): string {
  return pages([
    'THIS GAME IS FREE',
    '',
    ...wrap30(title.toUpperCase()),
    ...wrap30(
      'is a 2026 tribute to mid-90s shareware. Sandbox Software, its address and phone numbers, and the registration fee are part of the story: there is nothing to pay.',
    ),
    '',
    ...wrap30('Made in 2026 by Lewis Moten, with AI help from Claude.'),
    '',
    'Built with RSD Game-Maker (C)',
    '1991-95 Recreational Software',
    'Designs, MIT License 2014.',
    '',
    'MIT License',
    '',
    'Copyright (c) 2026',
    'Lewis Moten',
    '',
    ...MIT.flatMap((p) => [...wrap30(p), '']),
  ]);
}

/** The lines every game's credits end with (30 columns or less). */
export const CREDIT_NOTICE = ['Made in 2026 by Lewis Moten', 'with Claude. Free to share:', 'see LICENSE.TXT on the disk.'];
