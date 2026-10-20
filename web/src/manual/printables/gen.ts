// The paper every Sandbox Software box has, made from the game's catalog entry, manual and
// disk: registration postcard, key card, catalog, BBS ad, warranty card, newsletter, hint
// book offer and a sticker sheet.
import { h } from '../../editor/ui';
import { parseCharacter } from '../../formats/character';
import { scanName } from '../../input/scancodes';
import type { CatalogEntry } from '../../project/files';
import {
  shotCache,
  sheet,
  fictionalNote,
  sandboxLogo,
  sandboxBanner,
  splitTitle,
  html,
  hashString,
  rng,
  BBS_PHONE,
  mapPicture,
  type PrintContext,
  type Sheet,
} from './kit';
import { cardKeys, manualKeyText } from './keys';
import { redCode } from './redFilm';
import type { StickerSpec } from './types';

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
      'Teddy the Pembroke Welsh Corgi knows a ton of tricks. Literally: he will need every one of them on his biggest adventure yet, with his big sister Gwin making a mess of everything along the way.',
    when: 'Coming soon',
  },
];

function price(g: CatalogEntry): string {
  return g.price ?? '$10';
}

/** The keys bound in the game's .CHR files, as PLAYGAME names them. */
async function boundKeys(entry: CatalogEntry): Promise<string[]> {
  const names = entry.files.filter((f) => f.endsWith('.chr'));
  const keys: string[] = [];
  for (const n of names) {
    const r = await fetch(`./${entry.path}${n}`).catch(() => undefined);
    if (!r?.ok) continue;
    try {
      const chr = parseCharacter(new Uint8Array(await r.arrayBuffer()));
      for (const s of chr.sequences) if (s.key >> 8) keys.push(scanName(s.key >> 8));
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
      h('b', null, 'SANDBOX SOFTWARE'),
      h('span', null, `Attn: ${splitTitle(g.title)[0]} Registration`),
      h('span', null, `P.O. Box ${/P\.O\. Box (\d+)/.exec(ctx.manual.pages.map((p) => p.html).join(''))?.[1] ?? '4217'}`),
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
const KEY_ROWS = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
  ['Ctrl', 'Alt', 'Space', 'Left', 'Up', 'Down', 'Right'],
];
const ARROWS: Record<string, string> = { Left: '←', Up: '↑', Down: '↓', Right: '→' };

export async function keycard(ctx: PrintContext): Promise<Sheet[]> {
  const bound = await boundKeys(ctx.entry);
  const rows = cardKeys(bound, manualKeyText(ctx.manual.pages.map((p) => p.html)), ctx.printables.keys);
  const used = new Set(rows.map((r) => r.key));
  const pad = h(
    'div',
    { class: 'kc-keys', 'aria-hidden': 'true' },
    ...KEY_ROWS.map((row) =>
      h(
        'div',
        { class: 'kc-row' },
        ...row.map((k) =>
          h(
            'span',
            { class: `kc-key ${used.has(k) ? 'on' : ''} ${k === 'Space' ? 'wide' : ''} ${k.length > 2 && k !== 'Space' ? 'mid' : ''}` },
            ARROWS[k] ?? k,
          ),
        ),
      ),
    ),
  );
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const list = h(
    'div',
    { class: 'kc-list' },
    ...rows.map((r) => h('div', { class: 'kc-item' }, h('kbd', null, ARROWS[r.key] ? `${ARROWS[r.key]} ${r.key}` : r.key), h('span', null, cap(r.does)))),
  );
  return [
    sheet(
      8.5,
      5.5,
      'kc',
      h('div', { class: 'kc-head' }, h('b', null, splitTitle(ctx.entry.title)[0].toUpperCase()), h('span', null, 'QUICK REFERENCE CARD')),
      h('div', { class: 'kc-body' }, pad, list),
      h('p', { class: 'kc-foot' }, 'Keys read from the game’s own character files. A joystick works too. Keep this card by your keyboard.'),
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
            `${g.year ?? 1995} · ${g.original?.sound === 'sb' ? 'Sound Blaster' : 'PC speaker'} · ${g.files.length} files · register ${price(g)}`,
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
      h('tr', null, h('th', null, 'Qty'), h('th', null, 'Title'), h('th', null, 'Price')),
      ...family.map((g) => h('tr', null, h('td', null, '___'), h('td', null, g.title), h('td', null, price(g)))),
      h('tr', null, h('td', null, ''), h('td', null, 'Shipping & handling'), h('td', null, '$3.00')),
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
  return [
    sheet(
      8.5,
      11,
      'cat',
      head('page 1'),
      h('p', { class: 'cat-lead' }, 'Every Sandbox Software game is shareware: try it free, share it with friends, and register the ones you love.'),
      h('div', { class: 'cat-games' }, ...entries),
    ),
    sheet(
      8.5,
      11,
      'cat',
      head('page 2'),
      coming.length
        ? h('div', { class: 'cat-coming' }, h('h3', null, 'COMING SOON'), ...coming.map((c) => h('p', null, h('b', null, c.title), ` (${c.when}). ${c.blurb}`)))
        : null,
      h(
        'div',
        { class: 'cat-bbs' },
        h('h3', null, 'GET THEM FIRST ON THE BBS'),
        h('p', null, 'New games and updates go up on ', sandboxBanner(), ` before anywhere else. Call ${BBS_PHONE}, 14,400 baud.`),
      ),
      order,
    ),
  ];
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
        ans('c-green', '► Shareware files: the newest Sandbox games first'),
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
        h('p', { class: 'nl-when' }, real ? `Register for ${price(real)}.` : `${c.when}. Registered players hear first.`),
      );
    }),
  );
  const own = (ctx.printables.news ?? []).map((n) => h('article', { class: 'nl-story' }, h('h3', null, n.head), html('div', '', n.html)));
  const others = family
    .filter((g) => g.id !== ctx.entry.id && !COMING.some((c) => c.id === g.id))
    .flatMap((g) =>
      (g.original?.printables?.news ?? []).slice(0, 1).map((n) => h('article', { class: 'nl-story small' }, h('h3', null, n.head), html('div', '', n.html))),
    );
  const issue = 3 + (hashString(ctx.entry.id) % 5);
  const book = ctx.printables.items?.find((i) => i.kind === 'hintbook');
  const tips = book?.kind === 'hintbook' ? book.sections.flatMap((x) => x.hints) : [];
  const tip = tips.length ? tips[hashString(ctx.entry.id) % tips.length] : undefined;
  return [
    sheet(
      8.5,
      11,
      'nl',
      h(
        'header',
        { class: 'nl-mast' },
        h('div', { class: 'nl-title' }, 'The Sandbox Scoop'),
        h(
          'div',
          { class: 'nl-sub' },
          h('span', null, `Vol. 1, No. ${issue}`),
          h('span', null, 'News for registered players of Sandbox Software games'),
          h('span', null, ISSUE_DATE),
        ),
      ),
      h(
        'div',
        { class: 'nl-cols' },
        h('h2', { class: 'nl-lead' }, 'TWO NEW GAMES ON THE WAY'),
        h(
          'p',
          { class: 'nl-intro' },
          'The sandbox is busy this year. Two new Game-Maker games are coming together on our workbench, and as a registered player you get to hear about them first.',
        ),
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
      ),
      h('footer', { class: 'nl-foot' }, 'The Sandbox Scoop is printed for the people in our games. ', fictionalNote()),
    ),
  ];
}

// ------------------------------------------------------------------ hint book offer
export async function hintOffer(ctx: PrintContext, bookTitle: string): Promise<Sheet[]> {
  return [
    sheet(
      6,
      4,
      'ho',
      h('div', { class: 'ho-burst' }, 'STUCK?'),
      h('h3', null, `The Official ${splitTitle(ctx.entry.title)[0]} Hint Book`),
      h('p', null, 'Every secret, every vault and every shortcut, with answers hidden under red noise so you only see the hint you need. Red film included!'),
      h('p', { class: 'ho-price' }, h('s', null, '$5.95'), ' ', h('b', null, 'FREE with registration')),
      h('p', { class: 'ho-in' }, `It’s already in this box: look for “${bookTitle}”.`),
      fictionalNote(),
    ),
  ];
}

// ------------------------------------------------------------------ stickers
export async function stickers(ctx: PrintContext): Promise<Sheet[]> {
  const g = ctx.entry;
  const box = g.original?.box;
  const [main] = splitTitle(g.title);
  const r = rng(hashString(g.id));
  const specs: StickerSpec[] = [
    { text: main.toUpperCase(), sub: splitTitle(g.title)[1], shape: 'badge', color: box?.background, ink: box?.accent },
    ...(box?.shots ?? [])
      .slice(0, 3)
      .map(([map, x, y], i): StickerSpec => ({ text: '', shape: i === 1 ? 'circle' : 'rect', shot: { map, x: x + 4, y: y + 2, w: 8, h: 6 } })),
    { text: 'I ♥ SHAREWARE', shape: 'rect', color: '#d81e1e', ink: '#fff' },
    { text: 'SANDBOX', sub: 'SOFTWARE', shape: 'circle', color: '#f2b632', ink: '#1a1208' },
    { text: 'REGISTERED', sub: 'PLAYER', shape: 'star', color: '#1f9a3a', ink: '#fff' },
    { text: '14,400', sub: 'BAUD', shape: 'circle', color: '#111', ink: '#55ffff' },
    ...(ctx.printables.stickers ?? []),
  ];
  const els = await Promise.all(
    specs.map(async (s) => {
      const tilt = (r() - 0.5) * 8;
      const style = `--c:${s.color ?? '#fff'};--ink:${s.ink ?? '#111'};--tilt:${tilt.toFixed(1)}deg`;
      const pic = s.shot ? await ctx.shot(s.shot) : undefined;
      return h(
        'div',
        { class: `pp-st st-${s.shape ?? 'rect'} ${pic ? 'st-pic' : ''}`, style },
        pic ? h('img', { src: pic, alt: '' }) : null,
        s.text ? h('b', null, s.text) : null,
        s.sub ? h('small', null, s.sub) : null,
      );
    }),
  );
  return [
    sheet(
      8.5,
      11,
      'stk',
      h(
        'header',
        { class: 'stk-head' },
        h('b', null, 'STICKERS'),
        h('span', null, 'Cut along the dotted lines. Stick on your disk box, your folder, your little brother.'),
      ),
      h('div', { class: 'stk-grid' }, ...els),
      h('p', { class: 'stk-foot' }, 'Printed on plain paper here; use a glue stick, or print on label paper.'),
    ),
  ];
}
