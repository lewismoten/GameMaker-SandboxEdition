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

const SANDBOX_STORY = 'Sandbox Software, its address and phone numbers, and the registration fee are part of the story: there is nothing to pay.';

/**
 * What LICENSE.TXT says of voice clips cut from a Bard of Bizarre recording. The songs were made
 * on the free plan of Riffusion (now Google Flow Music), whose terms allow free-plan output for
 * "personal, non-commercial uses only", so those clips can't be MIT licensed (see NOTICE.md).
 */
function recordedLines(vocs: readonly string[]): string[] {
  const names = vocs.map((v) => `${v.toUpperCase()}.VOC`).join(', ');
  return [
    'VOICE CLIPS: NOT MIT',
    '',
    ...wrap30(`These ${vocs.length} voice clips are cut from recordings made on the free plan of Riffusion (now Google Flow Music): ${names}.`),
    '',
    ...wrap30(
      'That service\'s terms allow free-plan songs only "personal, non-commercial uses", so these clips are not under the MIT License: don\'t sell them or use them commercially.',
    ),
    '',
    ...wrap30('The rest of the game is MIT licensed: its code, levels, art, text, and FM music arranged by Claude.'),
    '',
  ];
}

/**
 * The disk's LICENSE.TXT for a game; `story` says which parts are make-believe (Sandbox Software's,
 * by default), and `recordedVocs` names the voice clips cut from a free-plan recording, if any.
 */
export function licenseText(title: string, story = SANDBOX_STORY, recordedVocs: readonly string[] = []): string {
  const clips = recordedVocs.length > 0;
  return pages([
    'THIS GAME IS FREE',
    '',
    ...wrap30(title.toUpperCase()),
    ...wrap30(`is a 2026 tribute to mid-90s shareware. ${story}`),
    '',
    ...wrap30('Made in 2026 by Lewis Moten, with AI help from Claude.'),
    '',
    'Built with RSD Game-Maker (C)',
    '1991-95 Recreational Software',
    'Designs, MIT License 2014.',
    '',
    ...wrap30(
      `In 1995 Game-Maker's license let you give a game free to up to ten people; shareware had to ask at least $5 and pay RSD 10% of the fees. Since 2014 Game-Maker is MIT licensed, and so is this game${clips ? ', except its voice clips (below)' : ''}: free to share, change or even sell.`,
    ),
    '',
    ...(clips ? recordedLines(recordedVocs) : []),
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

/** The last credits page of every game: one 16-line text screen. */
const CREDIT_PAGE = [
  'FREE TO SHARE',
  '',
  ...CREDIT_NOTICE,
  '',
  'The shareware page is part',
  'of the 1995 story: there is',
  'no fee and nothing to mail.',
  '',
  'MIT License, (c) 2026',
  'Lewis Moten.',
];

/** The FREE TO SHARE page's last lines in a game whose voice clips come from a free-plan recording. */
const RECORDED_CREDIT = ['', 'The voice clips are for', 'personal, non-commercial use', 'only: see LICENSE.TXT.'];

/** A game's credits text with the FREE TO SHARE page after it, on a page of its own (`recorded`: see recordedLines). */
export function withCreditPage(credits: string, recorded = false): string {
  const lines = credits.replace(/\s+$/, '').split('\n');
  while (lines.length % PAGE) lines.push('');
  const notice = recorded ? [...CREDIT_PAGE, ...RECORDED_CREDIT] : [...CREDIT_PAGE];
  if (notice.length > PAGE) throw new Error('The FREE TO SHARE page is over one screen');
  while (notice.length < PAGE) notice.push('');
  return [...lines, ...notice].join('\n');
}
