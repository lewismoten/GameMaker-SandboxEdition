// The rest of what came in the Game-Maker: Sandbox Edition box, the way a 1995 retail box
// packed it: the program disks (the core software is on two 3½" floppies; the CD-ROM only
// carries the bonus games), the product registration card, the license agreement, a
// keyboard template, a pad of map planning grids and the customer support card. Every phone,
// fax and BBS number and every address on them is made up (555 numbers are kept for fiction).
import './gmInserts.css';
import { h } from '../../editor/core/ui';
import { PRODUCT, SHORT } from '../../edition';
import { BBS_PHONE, hashString, html, sandboxBanner, sandboxLogo, sheet, type Sheet } from './kit';
import { PLAYGAME_KEYS } from './keys';

/** Sandbox Software's (made-up) numbers and addresses, as printed on the support card. */
export const SUPPORT = {
  tech: '(412) 555-0187',
  install: '1-800-555-0176',
  sales: '1-800-555-0133',
  fax: '(412) 555-0164',
  faxback: '(412) 555-0165',
  bbs: BBS_PHONE,
  email: 'support@sandbox.pgh.pa.us',
  ftp: 'ftp.sandbox.pgh.pa.us /pub/gamemaker',
  web: 'http://www.sandbox.pgh.pa.us/gamemaker/',
  address: ['Sandbox Software', 'P.O. Box 000', 'Pittsburgh, PA 15213'],
} as const;

/** The list price printed on the box, and what Bits & Bytes Software marked it down to. */
export const GM_PRICE = { msrp: '$59.95', store: 'Bits & Bytes Software', sale: '$48.00' } as const;

const MADE_UP = 'Every phone, fax and BBS number and every address on this card is make-believe (555 numbers are kept for fiction). Nothing to call: help for this edition is in the Owner’s Guide.';

/** The two program disks: what each one holds. */
export const GM_DISKS: { n: number; name: string; holds: string }[] = [
  { n: 1, name: 'PROGRAM · INSTALL', holds: 'INSTALL, GM, the design tools and their help screens' },
  { n: 2, name: 'PLAYGAME · UTILITIES', holds: 'PLAYGAME, the utilities, the Sound Blaster driver and the SAMPLE game' },
];

/** A 3½" disk with its printed Game-Maker label; sized by its box (sizes in cqw). */
export function gmFloppy(n: number): HTMLElement {
  const d = GM_DISKS[n - 1];
  return h(
    'div',
    { class: 'gmf', 'aria-hidden': 'true' },
    h('div', { class: 'gmf-shutter' }, h('i')),
    h(
      'div',
      { class: 'gmf-label' },
      h('b', null, 'GAME-MAKER'),
      h('span', { class: 'gmf-ed' }, 'SANDBOX EDITION 3.0'),
      h('span', { class: 'gmf-disk' }, `DISK ${n} OF ${GM_DISKS.length}`),
      h('span', { class: 'gmf-name' }, d.name),
      h('small', null, '3½" 1.44 MB · © 1991–1994 RSD · MIT License'),
    ),
    h('i', { class: 'gmf-hub' }),
    h('i', { class: 'gmf-tab' }),
  );
}

/** The program disks in their paper sleeve, with the install steps printed on it. */
export async function diskSleeve(): Promise<Sheet[]> {
  return [
    sheet(
      8.5,
      5.5,
      'gmd',
      h('div', { class: 'gmd-disks' }, ...GM_DISKS.map((d) => h('figure', null, gmFloppy(d.n), h('figcaption', null, h('b', null, `Disk ${d.n}`), ` ${d.holds}.`)))),
      h(
        'div',
        { class: 'gmd-sleeve' },
        h('h3', null, 'INSTALLING GAME-MAKER'),
        h(
          'ol',
          null,
          h('li', null, 'Make backup copies first: ', h('code', null, 'DISKCOPY A: A:'), ' for each disk. Write-protect the originals.'),
          h('li', null, 'Put Disk 1 in drive A:, type ', h('code', null, 'A:INSTALL'), ' and press Enter. Swap disks when asked.'),
          h('li', null, 'Game-Maker installs to ', h('code', null, 'C:\\GM'), '. Type ', h('code', null, 'GM'), ' there to start it.'),
        ),
        h('h3', null, 'THE BONUS GAMES CD-ROM'),
        h(
          'p',
          null,
          'The CD is for extra games, pictures, music and sounds to borrow from: not needed to run Game-Maker. Put it in your CD-ROM drive and copy any game you like to your hard disk.',
        ),
        h('p', { class: 'gmd-need' }, 'Needs a double-spin CD-ROM drive and 3 MB free on the hard disk. See the support card if anything goes wrong.'),
      ),
    ),
  ];
}

/** The product registration card: a form on one side, business reply mail on the other. */
export async function registrationCard(): Promise<Sheet[]> {
  const line = (label: string, cls = '') => h('div', { class: `grc-line ${cls}` }, h('span', null, label), h('i'));
  const boxes = (label: string, ...opts: string[]) => h('div', { class: 'grc-row' }, h('span', null, label), ...opts.map((o) => h('span', { class: 'grc-box' }, h('i'), o)));
  const serial = `GMSE-30-${String(hashString('game-maker-se') % 100000).padStart(5, '0')}`;
  const form = sheet(
    7,
    4.25,
    'grc grc-form',
    h('div', { class: 'grc-head' }, h('b', null, 'PRODUCT REGISTRATION'), h('span', null, `${PRODUCT} 3.0`)),
    h('p', { class: 'grc-lead' }, 'Mail this card within 30 days for upgrade notices, free BBS access and 90-day disk replacement.'),
    h('div', { class: 'grc-serial' }, 'Serial no. ', h('b', null, serial)),
    h('div', { class: 'grc-two' }, line('Name'), line('Phone')),
    line('Address'),
    h('div', { class: 'grc-two' }, line('City / State / ZIP'), line('Age')),
    h('div', { class: 'grc-two' }, line('Store where bought'), line('Price paid', 'short')),
    boxes('Computer:', '286', '386', '486', 'Pentium'),
    boxes('Sound:', 'Sound Blaster', 'SB Pro / 16', 'Pro Audio Spectrum', 'none'),
    boxes('Modem:', '2400', '9600', '14,400', 'none'),
    boxes('CD-ROM drive:', 'yes', 'not yet'),
    line('The game I want to make is about'),
  );
  const reply = sheet(
    7,
    4.25,
    'grc grc-reply',
    h('div', { class: 'grc-from' }, h('b', null, 'From:'), h('i'), h('i'), h('i')),
    h('div', { class: 'grc-nopost' }, 'NO POSTAGE', h('br'), 'NECESSARY', h('br'), 'IF MAILED', h('br'), 'IN THE', h('br'), 'UNITED STATES'),
    h('div', { class: 'grc-bars', 'aria-hidden': 'true' }, ...Array.from({ length: 10 }, () => h('i'))),
    h(
      'div',
      { class: 'grc-brm' },
      h('b', null, 'BUSINESS REPLY MAIL'),
      h('span', null, 'FIRST-CLASS MAIL · PERMIT NO. 5550 · PITTSBURGH, PA'),
      h('small', null, 'POSTAGE WILL BE PAID BY ADDRESSEE'),
    ),
    h('div', { class: 'grc-to' }, h('b', null, SUPPORT.address[0].toUpperCase()), h('span', null, 'Attn: Game-Maker Registration'), h('span', null, SUPPORT.address[1]), h('span', null, SUPPORT.address[2])),
    h('p', { class: 'grc-note' }, '(Fictional address and permit. Nothing to post: when Game-Maker asks, fill in the copy of this card beside the monitor and Mail it from there. The reply with your registration number comes right back.)'),
  );
  return [form, reply];
}

/** The license agreement, folded around the disks: the MIT License this fork keeps. */
export async function licenseSheet(): Promise<Sheet[]> {
  return [
    sheet(
      8.5,
      11,
      'gml2',
      h('h3', null, 'SOFTWARE LICENSE AGREEMENT'),
      h('p', { class: 'gml2-read' }, 'Please read this before you open the disk envelope. Opening it means you accept these terms.'),
      h(
        'ol',
        null,
        h(
          'li',
          null,
          h('b', null, 'The program. '),
          'Game-Maker 3.0 ©\u00a01991–1994 Recreational Software Designs. Its author, Andy Stone, released the source code under the MIT License in 2014. ',
          `${PRODUCT} is a modified fork of it, released under the same license.`,
        ),
        h('li', null, h('b', null, 'What you may do. '), 'Install it on as many computers as you own, make backup copies, change it, and give copies away, as long as this notice goes with them.'),
        h('li', null, h('b', null, 'Your games are yours. '), 'Games you make with it are yours to share, sell or upload to any BBS. The PLAYGAME player may go along with them.'),
        h(
          'li',
          null,
          h('b', null, 'Then and now. '),
          'RSD’s 1994 agreement allowed one computer at a time and a game given free to no more than ten people; shareware had to ask at least $5 and pay RSD 10% of the fees, and sales paid royalties. The MIT License below replaced all of that.',
        ),
        h(
          'li',
          null,
          h('b', null, 'Disks. '),
          'If a program disk fails within 90 days, send it back with your registration number for a free replacement. The software itself comes as is (below).',
        ),
      ),
      h(
        'div',
        { class: 'gml2-mit' },
        h('b', null, 'The MIT License (MIT)'),
        h('p', null, 'Copyright (c) 2014 gandrewstone', h('br'), 'Copyright (c) 2026 Lewis Moten (modifications: the web port, the 1994 desk and the Sandbox Software games)'),
        h(
          'p',
          null,
          'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
        ),
        h('p', null, 'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'),
        h(
          'p',
          null,
          'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
        ),
      ),
      h('p', { class: 'gml2-small' }, 'Sandbox Software, its address and its phone numbers are make-believe. Game-Maker is a trademark of its owner.'),
    ),
  ];
}

/** The F-key row of a 101-key keyboard: Esc, then F1–F12 in groups of four. */
const FKEYS = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

/** What each key does while designing and while playing (from the help screens and PLAYGAME). */
export function templateKeys(): { key: string; design?: string; play?: string }[] {
  const play = new Map<string, string>([...PLAYGAME_KEYS.map(([k, v]): [string, string] => [k, v.split(':')[0]]), ['F8', 'Joystick on / off'], ['F10', 'About Game-Maker']]);
  const design = new Map([
    ['Esc', 'Back out of a menu'],
    ['F1', 'Help screen'],
  ]);
  return FKEYS.map((key) => ({ key, design: design.get(key), play: play.get(key) }));
}

/** A cardstock strip that sits above the function keys. */
export async function keyTemplate(): Promise<Sheet[]> {
  const keys = templateKeys();
  const cell = (k: (typeof keys)[number]) =>
    h(
      'div',
      { class: `gkt-key ${k.design || k.play ? '' : 'blank'}` },
      h('span', { class: 'gkt-design' }, k.design ?? ''),
      h('b', null, k.key),
      h('span', { class: 'gkt-play' }, k.play ?? ''),
    );
  return [
    sheet(
      11,
      2.75,
      'gkt',
      h('div', { class: 'gkt-title' }, h('b', null, 'GAME-MAKER'), h('span', null, 'Keyboard template · 101-key Enhanced keyboard'), h('em', null, SHORT)),
      h(
        'div',
        { class: 'gkt-row' },
        cell(keys[0]),
        h('i', { class: 'gkt-gap' }),
        ...[1, 5, 9].map((s) => h('div', { class: 'gkt-group' }, ...keys.slice(s, s + 4).map(cell))),
      ),
      h(
        'div',
        { class: 'gkt-legend' },
        h('span', { class: 'gkt-design' }, '■ Blue: in the design tools'),
        h('span', { class: 'gkt-play' }, '■ Red: while playing a game'),
        h('span', null, 'Cut along the outline and lay it above the function keys.'),
      ),
    ),
  ];
}

/** An SVG grid: cols × rows squares of `cell` units, a heavier line every `major`. */
function gridSvg(cols: number, rows: number, cell: number, major: number, labels: boolean, extra = ''): string {
  const pad = labels ? 4 : 0.5;
  const W = cols * cell;
  const H = rows * cell;
  let lines = '';
  for (let i = 0; i <= cols; i++) lines += `<line x1="${i * cell}" y1="0" x2="${i * cell}" y2="${H}" class="${i % major ? 'mn' : i % (major * 2) ? 'md' : 'mj'}"/>`;
  for (let j = 0; j <= rows; j++) lines += `<line x1="0" y1="${j * cell}" x2="${W}" y2="${j * cell}" class="${j % major ? 'mn' : j % (major * 2) ? 'md' : 'mj'}"/>`;
  let nums = '';
  if (labels)
    for (let i = 0; i < Math.max(cols, rows); i += major) {
      if (i < cols) nums += `<text x="${i * cell + 0.3}" y="-1">${i}</text>`;
      if (i < rows) nums += `<text x="-0.8" y="${i * cell + 1.6}" text-anchor="end">${i}</text>`;
    }
  return `<svg viewBox="${-pad} ${-pad} ${W + pad + 0.5} ${H + pad + 0.5}" role="img" aria-label="${cols} by ${rows} grid">${lines}${nums}${extra}</svg>`;
}

/** A sheet from the pad of map planning grids: a quarter of a 100 × 100 map, and two block sketches. */
export async function mapGrid(): Promise<Sheet[]> {
  // one VGA screen is 16 × 10 blocks: drawn dashed in the corner as a size guide
  const screen = `<rect x="0" y="0" width="${16 * 2}" height="${10 * 2}" class="scr"/><text x="1" y="${10 * 2 - 1}" class="scr-t">ONE SCREEN · 16 × 10</text>`;
  const check = (label: string) => h('span', { class: 'gmg-box' }, h('i'), label);
  return [
    sheet(
      8.5,
      11,
      'gmg',
      h('header', { class: 'gmg-head' }, h('b', null, 'MAP PLANNING GRID'), h('span', null, `${SHORT} · Map Maker`)),
      h(
        'div',
        { class: 'gmg-fields' },
        h('span', { class: 'gmg-field' }, 'Map name ', h('i')),
        h('span', null, 'Quarter:', check('top left'), check('top right'), check('bottom left'), check('bottom right')),
      ),
      html('div', 'gmg-map', gridSvg(50, 50, 2, 5, true, screen)),
      h(
        'p',
        { class: 'gmg-how' },
        'Each square is one 20 × 20 picture block. A map is 100 × 100 blocks: four sheets taped together make a whole map (add 50 to the numbers on the right and bottom quarters). Pencil in walls, doors, monsters and where the character starts, then build it in Map Maker.',
      ),
      h(
        'div',
        { class: 'gmg-bottom' },
        ...[1, 2].map((n) => h('figure', null, html('div', 'gmg-block', gridSvg(20, 20, 2, 5, false)), h('figcaption', null, `Block sketch ${n} · 20 × 20 pixels`))),
        h(
          'ul',
          { class: 'gmg-key' },
          h('li', null, h('b', null, '■'), ' solid block'),
          h('li', null, h('b', null, '↓'), ' gravity'),
          h('li', null, h('b', null, '★'), ' object to pick up'),
          h('li', null, h('b', null, 'M'), ' monster'),
          h('li', null, h('b', null, '☺'), ' character starts'),
          h('li', null, h('b', null, 'D'), ' door to another scene'),
        ),
      ),
    ),
  ];
}

/** The customer support card: numbers on the front, setup and Sound Blaster troubleshooting on the back. */
export async function supportCard(): Promise<Sheet[]> {
  const num = (what: string, n: string, when: string) => h('div', { class: 'gsc-num' }, h('span', null, what), h('b', null, n), h('small', null, when));
  const front = sheet(
    5.5,
    8.5,
    'gsc',
    h('header', { class: 'gsc-head' }, sandboxLogo('gsc-logo'), h('div', null, h('b', null, 'CUSTOMER SUPPORT'), h('span', null, `${PRODUCT} 3.0`))),
    h('p', { class: 'gsc-lead' }, 'Stuck? Try the checklist on the back first: most setup problems are memory or Sound Blaster settings.'),
    h('h3', null, 'CALL US'),
    num('Technical support', SUPPORT.tech, 'Mon–Fri 9 AM–6 PM Eastern'),
    num('Installation & disk replacement', SUPPORT.install, 'Toll free · Mon–Fri 9 AM–6 PM Eastern'),
    num('Sales & upgrades', SUPPORT.sales, 'Toll free · Mon–Sat 9 AM–9 PM Eastern'),
    h('h3', null, 'FAX'),
    num('Fax support', SUPPORT.fax, '24 hours · answered next business day'),
    num('FaxBack documents', SUPPORT.faxback, 'Call from your fax handset · 101 Installing · 102 Memory · 103 Sound Blaster · 104 Mouse · 105 Windows'),
    h('h3', null, 'ONLINE'),
    h('div', { class: 'gsc-num' }, h('span', null, 'The official BBS ', sandboxBanner()), h('b', null, SUPPORT.bbs), h('small', null, '24 hours · 2400–14,400 baud · 8-N-1 · updates, patches and new games')),
    h(
      'dl',
      { class: 'gsc-net' },
      h('dt', null, 'Internet e-mail'),
      h('dd', null, SUPPORT.email),
      h('dt', null, 'FTP'),
      h('dd', null, SUPPORT.ftp),
      h('dt', null, 'World Wide Web (new!)'),
      h('dd', null, SUPPORT.web),
    ),
    h('p', { class: 'gsc-mail' }, 'By mail: ', SUPPORT.address.join(', ')),
    h('p', { class: 'gsc-fake' }, MADE_UP),
  );
  const back = sheet(
    5.5,
    8.5,
    'gsc gsc-back',
    h('header', { class: 'gsc-head plain' }, h('div', null, h('b', null, 'TROUBLESHOOTING'), h('span', null, 'Before you call'))),
    h('h3', null, 'SETUP'),
    h(
      'ul',
      null,
      h('li', null, h('b', null, 'Out of memory? '), 'Game-Maker needs 512K free. Type ', h('code', null, 'MEM'), '. Take TSRs out of AUTOEXEC.BAT and CONFIG.SYS, or start MS-DOS 6 clean (press F5 at “Starting MS-DOS…”).'),
      h('li', null, h('b', null, 'Won’t start? '), 'You need MS-DOS 4.1 or later on a 286 or better. Quit Windows and run it from the DOS prompt. Turn off QEMM’s Stealth mode.'),
      h('li', null, h('b', null, 'No pointer? '), 'Load your mouse driver first (', h('code', null, 'MOUSE'), ' or ', h('code', null, 'C:\\DOS\\MOUSE'), ').'),
      h('li', null, h('b', null, 'Menus freeze? '), 'Some PCs can’t start one program from another: type ', h('code', null, 'GMBAT'), ' instead of ', h('code', null, 'GM'), '.'),
      h('li', null, h('b', null, 'Screen breaks up? '), 'Game-Maker needs standard VGA (256 colors). Choose Auto-Detect VGA on the Configuration screen.'),
    ),
    h('h3', null, 'SOUND BLASTER'),
    h(
      'table',
      { class: 'gsc-sb' },
      h('tr', null, h('th', null, 'Setting'), h('th', null, 'Factory'), h('th', null, 'Try instead')),
      h('tr', null, h('td', null, 'Port (I/O address)'), h('td', null, '220h'), h('td', null, '240h')),
      h('tr', null, h('td', null, 'IRQ (interrupt)'), h('td', null, '7'), h('td', null, '5 or 2')),
      h('tr', null, h('td', null, 'DMA channel'), h('td', null, '1'), h('td', null, '3 (SB 16: high DMA 5)')),
    ),
    h(
      'ul',
      null,
      h('li', null, 'Match the card’s jumpers. Your AUTOEXEC.BAT should say so: ', h('code', null, 'SET BLASTER=A220 I7 D1 T4'), '. Then set the same numbers on Game-Maker’s Configuration screen.'),
      h('li', null, h('b', null, 'Locks up or no sound? '), 'IRQ 7 is shared with the printer port; a network card often sits at IRQ 5 or port 240h. Pick a free one.'),
      h('li', null, h('b', null, 'Sound stops after a blip? '), 'Wrong DMA channel.'),
      h('li', null, h('b', null, 'Pro Audio Spectrum 16? '), 'Load MVSOUND.SYS in CONFIG.SYS and set its Sound Blaster side to IRQ 2, DMA 1.'),
    ),
    h('h3', null, 'WHEN YOU CALL'),
    h('p', null, 'Be at your computer with the serial number from your registration card, your DOS version (', h('code', null, 'VER'), '), what ', h('code', null, 'MEM'), ' says, and your sound card’s settings.'),
  );
  return [front, back];
}
