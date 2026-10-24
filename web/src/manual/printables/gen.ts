// The paper every Sandbox Software box has, made from the game's catalog entry, manual and
// disk: registration postcard, key card, catalog, BBS ad, warranty card, newsletter, hint
// book offer (the sticker sheet is in stickers.ts).
import { sandboxMarkEl } from './sandboxMark';
import { h } from '../../editor/core/ui';
import { parseCharacter } from '../../formats/character';
import { scanName } from '../../input/scancodes';
import { fetchGameFile, type CatalogEntry } from '../../project/files';
import { storageLine } from '../../project/diskFacts';
import {
  shotCache,
  sheet,
  fictionalNote,
  sandboxLogo,
  sandboxBanner,
  splitTitle,
  html,
  hashString,
  BBS_PHONE,
  mapPicture,
  type PrintContext,
  type Sheet,
} from './kit';
import { CHARBL } from '../../formats/blocks';
import { DIR_ARROW, DIR_PAD, PLAYGAME_KEYS, manualKeyText, splitKeys, type BoundKey, type Dir } from './keys';
import { redCode } from './redFilm';
import { paginate } from './paginate';

const ISSUE_DATE = 'Fall 1995';

/** Games announced in the newsletter until they ship (then their catalog entries take over). */
const COMING: { id: string; title: string; blurb: string; when: string }[] = [
  {
    id: 'year2000',
    title: 'In The Year 2000',
    blurb:
      'Our kids’ guess at the far-off future: flying cars, robots everywhere, teleporters and friendly aliens next door. And of course there will still be phone booths on every corner, pinball in every arcade and a big TV in every living room.',
    when: 'Coming soon',
  },
  {
    id: 'teddy',
    title: "Teddy's Little Big Adventure",
    blurb:
      'Teddy the Pembroke Welsh Corgi knows a ton of tricks. Literally: he will need every one of them on his biggest adventure yet, with his big sister Gwinn making a mess of everything along the way.',
    when: 'Coming soon',
  },
];

function price(g: CatalogEntry): string {
  return g.price ?? '$10';
}

/** The keys bound in the game's .CHR files, as PLAYGAME names them, with the moves they run. */
async function boundKeys(entry: CatalogEntry): Promise<BoundKey[]> {
  const names = entry.files.filter((f) => f.endsWith('.chr'));
  const keys: BoundKey[] = [];
  for (const n of names) {
    const bytes = await fetchGameFile(entry, n);
    if (!bytes) continue;
    try {
      const chr = parseCharacter(bytes);
      for (const s of chr.sequences) {
        if (!(s.key >> 8)) continue;
        const end = s.frames.findIndex((f) => f.pic2 === CHARBL + 1);
        const frames = end < 0 ? s.frames : s.frames.slice(0, end);
        keys.push({
          name: scanName(s.key >> 8),
          dx: frames.reduce((t, f) => t + f.x, 0),
          dy: frames.reduce((t, f) => t + f.y, 0),
          sig: frames.map((f) => [f.x, f.y, f.orient, f.pic1, f.pic2, f.pause].join(',')).join(';'),
        });
      }
    } catch {
      // not a character file after all
    }
  }
  return keys;
}

// ------------------------------------------------------------------ registration postcard
export async function postcard(ctx: PrintContext): Promise<Sheet[]> {
  const g = ctx.entry;
  const line = (label: string) => h('div', { class: 'pc-line' }, h('span', null, label), h('i'));
  const box = (label: string) => h('span', { class: 'pc-check' }, h('i'), label);
  const form = sheet(
    6,
    4,
    'pc pc-form',
    h('div', { class: 'pc-head' }, h('b', null, 'REGISTRATION CARD'), h('span', null, g.title)),
    h('p', { class: 'pc-lead' }, `Register ${g.title} and join the Sandbox Software family. Registration ${price(g)} (US funds).`),
    line('Name'),
    line('Address'),
    line('City / State / ZIP'),
    line('BBS handle'),
    h('div', { class: 'pc-row' }, h('span', null, 'Computer:'), box('286'), box('386'), box('486'), box('Pentium')),
    h('div', { class: 'pc-row' }, h('span', null, 'Disks:'), box('3½"'), box('5¼"'), h('span', null, 'Sound:'), box('Sound Blaster'), box('PC speaker')),
    h('div', { class: 'pc-row' }, h('span', null, 'Found my copy on:'), box('a BBS'), box('a friend’s disk'), box('a shareware rack')),
    line('Our next game should be about'),
    h('div', { class: 'pc-stamp-free' }, 'PAID IN FULL', h('small', null, 'registration is free today')),
  );
  const front = sheet(
    6,
    4,
    'pc pc-front',
    h('div', { class: 'pc-from' }, h('b', null, 'From:'), h('i'), h('i'), h('i')),
    h('div', { class: 'pc-stamp' }, h('span', null, 'PLACE', h('br'), 'STAMP', h('br'), 'HERE')),
    h('div', { class: 'pc-cancel', 'aria-hidden': 'true' }, 'NOTHING', h('br'), 'TO MAIL'),
    h(
      'div',
      { class: 'pc-to' },
      h('b', null, sandboxMarkEl('pc-mark'), 'SANDBOX SOFTWARE'),
      h('span', null, `Attn: ${splitTitle(g.title)[0]} Registration`),
      h('span', null, `P.O. Box ${/P\.O\. Box (\d+)/.exec(ctx.manual.pages.map((p) => p.html).join(''))?.[1] ?? '000'}`),
      h('span', null, 'Pittsburgh, PA 15213'),
    ),
    h(
      'div',
      { class: 'pc-bars', 'aria-hidden': 'true' },
      ...Array.from({ length: 52 }, (_, i) => h('i', { class: (hashString(g.id + i) & 3) === 0 ? 'tall' : '' })),
    ),
    fictionalNote(),
  );
  return [form, front];
}

// ------------------------------------------------------------------ key card
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** A little keyboard diagram: rows of [label, direction or undefined]; lit when bound. */
function keyDiagram(cls: string, caption: string, rows: (readonly [string, Dir | undefined, boolean])[][]): HTMLElement {
  return h(
    'figure',
    { class: `kc-dia ${cls}` },
    h(
      'div',
      { class: 'kc-dia-keys' },
      ...rows.map((row) =>
        h(
          'div',
          { class: 'kc-dia-row' },
          ...row.map(([label, dir, on]) =>
            label
              ? h('span', { class: `kc-cap ${on ? 'on' : ''}` }, h('b', null, label), dir ? h('i', null, DIR_ARROW[dir]) : null)
              : h('span', { class: 'kc-cap gap' }),
          ),
        ),
      ),
    ),
    h('figcaption', null, caption),
  );
}

export async function keycard(ctx: PrintContext): Promise<Sheet[]> {
  const bound = await boundKeys(ctx.entry);
  const { moves, actions } = splitKeys(bound, manualKeyText(ctx.manual.pages.map((p) => p.html)), ctx.printables.keys);
  const dirKeys = new Map<string, Dir>();
  for (const m of moves) for (const k of m.keys) dirKeys.set(k, m.dir);
  const padOn = new Set(moves.filter((m) => m.pad || m.keys.some((k) => ['Up', 'Down', 'Left', 'Right'].includes(k))).map((m) => m.dir));
  const lit = (k: string) => dirKeys.has(k);
  const arrowRows = [
    [
      ['', undefined, false],
      ['↑', undefined, lit('Up')],
      ['', undefined, false],
    ],
    [
      ['←', undefined, lit('Left')],
      ['↓', undefined, lit('Down')],
      ['→', undefined, lit('Right')],
    ],
  ] as const;
  const letter = (k: string) => [k, dirKeys.get(k), lit(k)] as const;
  const letters = ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'C'].filter(lit);
  const pad = (n: string, d: Dir | undefined) => [n, d, !!d && padOn.has(d)] as const;
  const diagrams = [
    keyDiagram(
      'arrows',
      'Arrow keys',
      arrowRows.map((r) => [...r]),
    ),
    letters.length
      ? keyDiagram('letters', 'Letter keys', [
          ['Q', 'W', 'E'].map(letter),
          ['A', 'S', 'D'].map(letter),
          ...(lit('Z') || lit('C') ? [['Z', '', 'C'].map((k) => (k ? letter(k) : (['', undefined, false] as const)))] : []),
        ])
      : null,
    keyDiagram('pad', padOn.size > 4 ? 'Number pad: the corners go diagonally' : 'Number pad', [
      [pad('7', 'up-left'), pad('8', 'up'), pad('9', 'up-right')],
      [pad('4', 'left'), pad('5', undefined), pad('6', 'right')],
      [pad('1', 'down-left'), pad('2', 'down'), pad('3', 'down-right')],
    ]),
  ];
  // directions that do the same thing share a line
  const merged: { arrows: string; keys: string[]; does: string }[] = [];
  for (const m of moves) {
    const same = merged.find((x) => x.does === m.does);
    const keys = m.keys.filter((k) => !['Up', 'Down', 'Left', 'Right', 'Home', 'PgUp', 'End', 'PgDn'].includes(k));
    if (m.pad && !m.keys.some((k) => ['Up', 'Down', 'Left', 'Right'].includes(k))) keys.unshift(`Pad ${DIR_PAD[m.dir]}`);
    if (same) {
      same.arrows += DIR_ARROW[m.dir];
      same.keys.push(...keys);
    } else merged.push({ arrows: DIR_ARROW[m.dir], keys, does: m.does });
  }
  const moveList = h(
    'div',
    { class: 'kc-moves' },
    ...merged.map((m) =>
      h(
        'div',
        { class: 'kc-item' },
        h('kbd', { class: 'kc-arrows' }, m.arrows),
        m.keys.length ? h('kbd', null, m.keys.join(' ')) : null,
        h('span', null, cap(m.does)),
      ),
    ),
  );
  const own = actions.filter((a) => !PLAYGAME_KEYS.some(([k]) => k === a.key));
  // number keys in number order, in the places the number keys already hold
  const digits = own.filter((a) => /^\d$/.test(a.key)).sort((a, b) => a.key.localeCompare(b.key));
  own.forEach((a, i) => /^\d$/.test(a.key) && (own[i] = digits.shift()!));
  const always = actions.filter((a) => PLAYGAME_KEYS.some(([k]) => k === a.key));
  return [
    sheet(
      8.5,
      4.75,
      'kc',
      h(
        'div',
        { class: 'kc-head' },
        h('b', { class: splitTitle(ctx.entry.title)[0].length > 16 ? 'long' : '' }, splitTitle(ctx.entry.title)[0].toUpperCase()),
        h('span', null, 'QUICK REFERENCE CARD'),
      ),
      h(
        'div',
        { class: 'kc-body' },
        h('section', { class: 'kc-move' }, h('h3', null, 'MOVING'), h('div', { class: 'kc-dias' }, ...diagrams)),
        moveList,
        h(
          'section',
          { class: `kc-act ${own.length > 9 ? 'two' : ''}` },
          h('h3', null, 'ACTIONS'),
          h('div', { class: 'kc-list' }, ...own.map((r) => h('div', { class: 'kc-item' }, h('kbd', null, r.key), h('span', null, cap(r.does))))),
        ),
      ),
      h(
        'div',
        { class: 'kc-always' },
        h('h3', null, 'EVERY GAME'),
        ...always.map((r) => h('div', { class: 'kc-chip' }, h('kbd', null, r.key), h('span', null, cap(r.does)))),
      ),
      h(
        'p',
        { class: 'kc-foot' },
        'Read from the game’s own character files. One key at a time: Game-Maker follows the last key pressed. A joystick works too.',
      ),
    ),
  ];
}

// ------------------------------------------------------------------ catalog
export async function catalog(ctx: PrintContext): Promise<Sheet[]> {
  const family = ctx.family.length ? ctx.family : [ctx.entry];
  const entries = await Promise.all(
    family.map(async (g) => {
      const shot = g.original?.box?.shots?.[0];
      const pic = shot ? await mapPicture({ ...ctx, shot: shotCache(g) }, { map: shot[0], x: shot[1], y: shot[2], w: 16, h: 10 }, 'cat-pic') : null;
      return h(
        'article',
        { class: `cat-game ${g.id === ctx.entry.id ? 'this' : ''}` },
        pic,
        h(
          'div',
          null,
          h('h3', null, g.title),
          h(
            'p',
            { class: 'cat-meta' },
            `${g.year ?? 1995} · ${g.original?.sound === 'sb' ? 'Sound Blaster' : 'PC speaker'} · ${storageLine(g)} · register ${price(g)}`,
          ),
          h('p', null, g.original?.printables?.pitch ?? g.blurb ?? ''),
          h('ul', null, ...(g.original?.box?.features ?? []).slice(0, 3).map((f) => h('li', null, f))),
        ),
      );
    }),
  );
  const coming = COMING.filter((c) => !family.some((g) => g.id === c.id));
  const order = h(
    'div',
    { class: 'cat-order' },
    h('h3', null, 'ORDER FORM'),
    h(
      'table',
      null,
      h('tr', null, h('th', null, 'Qty'), h('th', null, 'Title'), h('th', null, 'Registration')),
      ...family.map((g) => h('tr', null, h('td', null, '___'), h('td', null, g.title), h('td', null, price(g)))),
      h('tr', null, h('td', null, ''), h('td', null, 'Shipping & handling'), h('td', null, '$3.00')),
    ),
    h(
      'p',
      { class: 'cat-price-note' },
      'These are the registration fees, paid to the author. The few dollars a store asks for a shareware disk (Bits & Bytes Software: $4.99) pay for the disk and the copying, not the registration.',
    ),
    fictionalNote(),
  );
  const head = (page: string) =>
    h(
      'header',
      { class: 'cat-head' },
      sandboxLogo('cat-logo'),
      h('div', null, h('b', null, 'GAMES CATALOG'), h('span', null, `${ISSUE_DATE} · Pittsburgh, PA · ${page}`)),
    );
  const blocks: HTMLElement[] = [
    h('p', { class: 'cat-lead' }, 'Every Sandbox Software game is shareware: try it free, share it with friends, and register the ones you love.'),
    ...entries,
    ...(coming.length
      ? [h('div', { class: 'cat-coming' }, h('h3', null, 'COMING SOON'), ...coming.map((c) => h('p', null, h('b', null, c.title), ` (${c.when}). ${c.blurb}`)))]
      : []),
    h(
      'div',
      { class: 'cat-bbs' },
      h('h3', null, 'GET THEM FIRST ON THE BBS'),
      h('p', null, 'New games and updates go up on ', sandboxBanner(), ` before anywhere else. Call ${BBS_PHONE}, 14,400 baud.`),
    ),
    order,
  ];
  // as many pages as the games need, measured on a real catalog page
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  let pages: HTMLElement[][];
  try {
    pages = paginate(blocks, () => {
      const flow = h('div', { class: 'cat-flow' });
      const page = sheet(8.5, 11, 'cat', head('page 1'), flow);
      page.el.style.width = '850px';
      host.replaceChildren(page.el);
      const inner = page.el.firstElementChild as HTMLElement;
      const cs = getComputedStyle(inner);
      const top = flow.getBoundingClientRect().top - inner.getBoundingClientRect().top;
      return { flow, limit: (inner.clientHeight - top - parseFloat(cs.paddingBottom)) * 0.97 };
    });
  } finally {
    host.remove();
  }
  return pages.map((els, i) => sheet(8.5, 11, 'cat', head(`page ${i + 1} of ${pages.length}`), h('div', { class: 'cat-flow' }, ...els)));
}

// ------------------------------------------------------------------ BBS ad
export async function bbsAd(): Promise<Sheet[]> {
  const ans = (cls: string, ...t: (string | HTMLElement)[]) => h('div', { class: `ansi ${cls}` }, ...t);
  return [
    sheet(
      7,
      5,
      'bbs',
      h(
        'div',
        { class: 'bbs-screen' },
        ans('c-gray', '┌──────────────────────────────────────────┐'),
        ans('big', sandboxBanner()),
        ans('c-gray', '└──────────────────────────────────────────┘'),
        ans('c-cyan', 'CALL NOW!  ', h('b', { class: 'c-yellow' }, BBS_PHONE)),
        ans('c-white', '14,400 baud · 8-N-1 · open 24 hours'),
        ans('c-green', '► Shareware files: new Sandbox games first'),
        ans('c-green', '► Message bases: hints, maps, high scores'),
        ans('c-green', '► Door games & online Game-Maker help'),
        ans('c-magenta', '► Upload your own Game-Maker games!'),
        ans('c-gray', 'NEW USERS WELCOME · Sysop: the Sandbox crew'),
        ans('c-red blink', 'NO CARRIER?  Try again after 11pm.'),
      ),
      h('p', { class: 'bbs-note' }, 'A 555 number, like in the movies: this BBS lives only in our games. Look for it in Sandcastle Knight.'),
    ),
  ];
}

// ------------------------------------------------------------------ warranty / license
export async function warranty(ctx: PrintContext): Promise<Sheet[]> {
  const g = ctx.entry;
  const serial = `SBX-${String(hashString(g.id) % 100000).padStart(5, '0')}-95`;
  return [
    sheet(
      7,
      5,
      'war',
      h('div', { class: 'war-frame' }, h('h3', null, 'Shareware License & Limited Warranty'), h('p', { class: 'war-title' }, g.title)),
      h(
        'ol',
        { class: 'war-text' },
        h(
          'li',
          null,
          'You may copy this program and give it away, upload it to bulletin boards and include it in shareware libraries, as long as every file stays together and unchanged. You may not sell it.',
        ),
        h(
          'li',
          null,
          'If you play it and like it, register. Registered players get everything this box promises (and, today, everything is already in the box).',
        ),
        h(
          'li',
          null,
          'Sandbox Software warrants the disk to be free of defects in materials and workmanship for 90 days. If your disk will not read, return it and we will send a new one.',
        ),
        h(
          'li',
          null,
          'The game is provided “as is.” We are not responsible for lost sleep, missed homework, or a little brother who now wants the computer every evening.',
        ),
      ),
      h('div', { class: 'war-foot' }, h('span', null, `Serial no. ${serial}`), h('span', null, 'KEEP THIS CARD')),
      fictionalNote(),
    ),
  ];
}

// ------------------------------------------------------------------ newsletter
export async function newsletter(ctx: PrintContext): Promise<Sheet[]> {
  const family = ctx.family.length ? ctx.family : [ctx.entry];
  const next = await Promise.all(
    COMING.map(async (c) => {
      const real = family.find((g) => g.id === c.id);
      const shot = real?.original?.box?.shots?.[0];
      const pic = real && shot ? await mapPicture({ ...ctx, shot: shotCache(real) }, { map: shot[0], x: shot[1], y: shot[2], w: 16, h: 10 }) : null;
      return h(
        'article',
        { class: 'nl-next' },
        h('h3', null, real ? `Out now: ${real.title}` : `Next: ${c.title}`),
        pic,
        h('p', null, real?.blurb ?? c.blurb),
        h('p', { class: 'nl-when' }, real ? `${storageLine(real)}. Register for ${price(real)}.` : `${c.when}. Registered players hear first.`),
      );
    }),
  );
  const waiting = COMING.filter((c) => !family.some((g) => g.id === c.id)).length;
  const nextHead = waiting === 2 ? 'TWO NEW GAMES ON THE WAY' : waiting === 1 ? 'ONE NEW GAME OUT, ONE ON THE WAY' : 'TWO NEW GAMES OUT NOW';
  const own = (ctx.printables.news ?? []).map((n) => h('article', { class: 'nl-story' }, h('h3', null, n.head), html('div', '', n.html)));
  const others = family
    .filter((g) => g.id !== ctx.entry.id && !COMING.some((c) => c.id === g.id))
    .flatMap((g) =>
      (g.original?.printables?.news ?? [])
        .filter((n) => n.everywhere)
        .slice(0, 1)
        .map((n) => h('article', { class: 'nl-story small' }, h('h3', null, n.head), html('div', '', n.html))),
    );
  const issue = 3 + (hashString(ctx.entry.id) % 5);
  const book = ctx.printables.items?.find((i) => i.kind === 'hintbook');
  const tips = book?.kind === 'hintbook' ? book.sections.flatMap((x) => x.hints) : [];
  const tip = tips.length ? tips[hashString(ctx.entry.id) % tips.length] : undefined;
  const stories = [
    ...next,
    ...own,
    ...others,
    tip
      ? h(
          'article',
          { class: 'nl-story small' },
          h('h3', null, 'Tip of the month'),
          h('p', null, h('b', null, 'Q. '), tip.q),
          h('p', null, redCode(tip.a)),
          h('p', { class: 'nl-when' }, 'Use the red film from your hint book.'),
        )
      : null,
    h(
      'article',
      { class: 'nl-story small' },
      h('h3', null, 'Letters'),
      h(
        'p',
        null,
        h('i', null, '“I beat every Sandbox game on my dad’s 286 with the sound turned down so nobody would know I was still up. When is the next one?”'),
      ),
      h('p', null, '— A loyal player, by modem. ', h('b', null, 'The Scoop replies:'), ' Read the front page! And go to bed.'),
    ),
    h(
      'article',
      { class: 'nl-story small' },
      h('h3', null, 'Sysop’s corner'),
      h('p', null, 'Call ', sandboxBanner(), ` at ${BBS_PHONE} for hints, high scores and the newest uploads. 14,400 baud, 24 hours.`),
    ),
    h(
      'article',
      { class: 'nl-story small' },
      h('h3', null, 'Make your own'),
      h(
        'p',
        null,
        'Every Sandbox game is made with GAME-MAKER by Recreational Software Designs. If you can draw a block, you can make a game. Send us yours on the BBS!',
      ),
    ),
  ].filter((x): x is HTMLElement => !!x);
  const foot = () => h('footer', { class: 'nl-foot' }, 'The Sandbox Scoop is printed for the people in our games. ', fictionalNote());
  const cols = h(
    'div',
    { class: 'nl-cols' },
    h('h2', { class: 'nl-lead' }, nextHead),
    h(
      'p',
      { class: 'nl-intro' },
      'The sandbox is busy this year. Here is what is new on our workbench, and as a registered player you get to hear about it first.',
    ),
    ...stories,
  );
  const front = sheet(
    8.5,
    11,
    'nl',
    h(
      'header',
      { class: 'nl-mast' },
      h('div', { class: 'nl-title' }, sandboxMarkEl('nl-mark'), 'The Sandbox Scoop'),
      h(
        'div',
        { class: 'nl-sub' },
        h('span', null, `Vol. 1, No. ${issue}`),
        h('span', null, 'News for registered players of Sandbox Software games'),
        h('span', null, ISSUE_DATE),
      ),
    ),
    cols,
    foot(),
  );
  // the stories that don't fit above the front page's foot continue on page 2
  const more = overflowStories(front, cols, stories);
  if (!more.length) return [front];
  return [
    front,
    sheet(
      8.5,
      11,
      'nl',
      h(
        'header',
        { class: 'nl-mast' },
        h('div', { class: 'nl-sub' }, h('span', null, 'The Sandbox Scoop'), h('span', null, `Vol. 1, No. ${issue} · page 2`), h('span', null, ISSUE_DATE)),
      ),
      h('div', { class: 'nl-cols' }, ...more),
      foot(),
    ),
  ];
}

/** Takes stories off the end of `cols` until the rest end above the sheet's foot; returns them in order. */
function overflowStories(front: Sheet, cols: HTMLElement, stories: HTMLElement[]): HTMLElement[] {
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  const moved: HTMLElement[] = [];
  try {
    front.el.style.width = '850px';
    host.replaceChildren(front.el);
    const foot = front.el.querySelector('.nl-foot')!;
    const over = () => cols.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 6;
    for (let i = stories.length - 1; i > 0 && over(); i--) {
      stories[i].remove();
      moved.unshift(stories[i]);
    }
  } finally {
    host.remove();
    front.el.style.width = '';
  }
  return moved;
}

// ------------------------------------------------------------------ hint book postcard
/** A promotional postcard for the hint book: a picture side and a mailing side. */
export async function hintOffer(ctx: PrintContext, bookTitle: string): Promise<Sheet[]> {
  const g = ctx.entry;
  const box = g.original?.box;
  const [main] = splitTitle(g.title);
  const shot = box?.shots?.[1] ?? box?.shots?.[0];
  const bg = shot ? await ctx.shot({ map: shot[0], x: shot[1], y: shot[2], w: 16, h: 10 }) : undefined;
  const book = ctx.printables.items?.find((i) => i.kind === 'hintbook');
  const hints = book?.kind === 'hintbook' ? book.sections.flatMap((x) => x.hints) : [];
  const sample = hints[hashString(g.id + 'card') % Math.max(1, hints.length)];
  const style = `--ho-bg:${box?.background ?? '#18150f'};--ho-accent:${box?.accent ?? '#f2b632'};--ho-ink:${box?.ink ?? '#fff'}`;
  const front = sheet(
    6,
    4,
    'ho ho-front',
    h('div', { class: 'ho-shot', style: `${style};${bg ? `background-image:url(${bg})` : ''}` }),
    h(
      'div',
      { class: 'ho-book', style, 'aria-hidden': 'true' },
      h('span', { class: 'ho-book-band' }, 'OFFICIAL'),
      h('b', null, main),
      h('span', null, 'HINT BOOK'),
      h('i', { class: 'ho-book-film' }),
    ),
    h('div', { class: 'ho-burst' }, 'STUCK?'),
    h(
      'div',
      { class: 'ho-pitch', style },
      h('h3', null, `The Official ${main} Hint Book`),
      h('p', null, 'Every secret. Every shortcut. Every answer hidden under red noise, so you only see the one you need.'),
      h('p', { class: 'ho-film-note' }, 'RED FILM INCLUDED!'),
    ),
  );
  const back = sheet(
    6,
    4,
    'ho ho-back',
    h(
      'div',
      { class: 'ho-msg' },
      h('h3', null, 'Can’t get past it?'),
      h('p', null, `Our ${main} hint book answers your questions without spoiling the rest. Try it on this one:`),
      sample ? h('p', { class: 'ho-sample' }, h('b', null, 'Q. '), sample.q, h('br'), redCode(sample.a)) : null,
      h('p', { class: 'ho-price' }, h('s', null, '$5.95'), ' ', h('b', null, 'FREE with registration')),
      h('p', { class: 'ho-in' }, `It’s already in this box: look for “${bookTitle}”.`),
    ),
    h(
      'div',
      { class: 'ho-mail' },
      h('div', { class: 'ho-indicia' }, 'BULK RATE', h('br'), 'U.S. POSTAGE', h('br'), 'PAID', h('br'), h('small', null, 'Sandbox Software')),
      h('div', { class: 'ho-to' }, h('b', null, 'TO A REGISTERED PLAYER'), h('i'), h('i'), h('i')),
      fictionalNote(),
    ),
  );
  return [front, back];
}
