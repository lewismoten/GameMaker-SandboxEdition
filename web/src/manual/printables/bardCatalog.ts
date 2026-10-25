// The Bard of Bizarre's little catalog, tucked into the Game-Maker SE box (gmItems.ts): a
// half-letter flyer of his song-games (every "series": "bizarre" game in the catalog, so new
// ones turn up by themselves, sorted into his collections below; one he hasn't filed yet goes
// last, told by its blurb), how to get them from The Sofa BBS, a registration coupon (in the
// story only) and the honest small print about how the songs and pictures were made (the same
// words as the site's credits, manual/webManual.ts).
import './paper.css'; // first: this piece's own styles build on the paper's
import './bardCatalog.css';
import { h } from '../../editor/core/ui';
import { fetchGameFile, loadCatalog, type CatalogEntry } from '../../project/files';
import { byCollection, COLLECTIONS, isBizarreGame } from '../../project/bizarre';

export { byCollection };
import { SOFA_PHONE } from '../../retro/bbs/sofaPhone';
import { downloadLine, hardDiskLine, sizeText, zipBytes, zipName } from '../../project/diskFacts';
import { sheet, type Sheet } from './kit';

const ISSUE = 'Winter 1995';

/** The credits page's words for the Bard's songs and pictures (manual/webManual.ts). */
export const BARD_CREDIT =
  'The Bard of Bizarre, his persona and the prompts behind each song are Lewis’s. Each song’s words were shaped by ChatGPT from Lewis’s prompts (Certified Rat Tickler’s after much back and forth), and each recording was made with Riffusion (now Google Flow Music). Certified Rat Tickler came with no recording, so its music was composed for the game by Claude Opus 5.5. The Great Dairy Reckoning of 3:17 A.M. is a spoken piece from Lewis’s own struggle (he is lactose intolerant, and he loves cheesecake): its voice was made with Riffusion, and its music was composed for the game by Claude Opus 5.5. Shakespeare in Sweatpants is seventeen spoken monologues, shaped with ChatGPT from Lewis’s prompts, with audio and vocals made with Riffusion (now Google Flow Music); its code, art and music were made by Claude Opus 5.5, and its coffee house, The Hive, is inspired by Lewis’s memories of the Beehive in Oakland, Pittsburgh (drawn from memory, not an official picture of it). Veni, Vidi, Risi! is Lewis’s group of comic songs in Latin: its lyrics were shaped with ChatGPT from Lewis’s prompts and its music and vocals made with Riffusion (now Google Flow Music); the game Veni, Vidi, Risi! takes its sung clips and FM score from those recordings, and its code, pictures (the title and cover art among them) and FM arrangements were made by Claude Opus 5.5. Third Goat from the Left’s cover art was made by Riffusion, and Thread the Needle, Brother Camel’s animated cover came with its Riffusion song; Mustard Seed Hustle’s animated cover was made with Producer.ai, Riffusion’s later name (Google bought it, and it is now Google Flow Music). The title and cover art of Loaf #13 (Left in the Basket), Where’s the Remote?!, A Fly Named Carl, Cleanse Me, O Loofah, But Leave My Soul and I Screamed, She Smirked, Certified Rat Tickler’s title, cover and certificate art, and The Great Dairy Reckoning’s title art were drawn for the games by Claude Opus 5.5. The Bard’s logo was made with DeepAI, and the photo of Doc Leo is Lewis’s own. Each game’s music and sounds are drawn from its song’s recording (Certified Rat Tickler’s and The Great Dairy Reckoning’s music was made for the game); its code, pictures and levels were made by Claude Opus 5.5, with Lewis directing and playtesting. The recordings were made on Riffusion’s free plan, whose terms allow only personal, non-commercial uses, so the voice clips cut from them are not MIT licensed and are never sold; the rest of each game is MIT.';

/** A game's one-line pitch: its collection's, or its blurb when it hasn't one. */
const pitch = (g: CatalogEntry): string => COLLECTIONS.find((c) => g.id in c.games)?.games[g.id] ?? flyerBlurb(g.blurb);

/** Where on the credits slide (bardpic.gif, 320 x 200) Doc Leo's snapshot and the logo sit. */
const SNAPSHOT = [20, 24, 124, 120] as const;
const LOGO = [190, 10, 102, 108] as const;

/** A GIF from a game's disk, drawn on a canvas (undefined if the game hasn't got it). */
async function gif(g: CatalogEntry, name: string): Promise<HTMLCanvasElement | undefined> {
  const bytes = await fetchGameFile(g, name).catch(() => undefined);
  if (!bytes) return undefined;
  const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/gif' })).catch(() => undefined);
  if (!bmp) return undefined;
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d')!.drawImage(bmp, 0, 0);
  return c;
}

function crop(src: HTMLCanvasElement, [x, y, w, h_]: readonly [number, number, number, number]): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h_;
  c.getContext('2d')!.drawImage(src, x, y, w, h_, 0, 0, w, h_);
  return c.toDataURL();
}

/** The blurb as the flyer tells it: the story, without the credit the site adds after it. */
export function flyerBlurb(blurb: string | undefined): string {
  return (blurb ?? '').split(/\s*Shareware from The Sofa BBS/)[0].trim();
}

const price = (g: CatalogEntry) => g.price ?? '$5';
/** No line break inside a phrase ("40 min at 2400"). */
const keep = (text: string) => text.replace(/ /g, '\u00a0');

async function gameBlock(g: CatalogEntry): Promise<HTMLElement> {
  const title = await gif(g, 'title.gif');
  return h(
    'article',
    { class: 'bard-game' },
    title
      ? h('img', { class: 'bard-shot', src: title.toDataURL(), alt: `${g.title} title screen`, width: title.width, height: title.height })
      : h('div', { class: 'bard-shot bard-shot-none', 'aria-hidden': 'true' }, '♪'),
    h(
      'div',
      null,
      h('h3', null, g.title),
      h('p', { class: 'bard-meta' }, `${g.year ?? 1995} · ${g.original?.sound === 'sb' ? 'Sound Blaster sings it' : 'PC speaker'} · register ${price(g)}`),
      // what a caller weighed before tying up the phone line: the ZIP's size and time, and the room it takes
      h(
        'p',
        { class: 'bard-meta' },
        [`${zipName(g)} · ${sizeText(zipBytes(g))}:`, ...downloadLine(zipBytes(g), ',\n').split('\n'), `· ${hardDiskLine(g)}`].map(keep).join(' '),
      ),
      h('p', null, pitch(g)),
    ),
  );
}

/** A collection's heading, kept on the page with its first game. */
function sectionBlock(c: { name: string; tag?: string }, first: HTMLElement): HTMLElement {
  return h('div', { class: 'bard-sec' }, h('h2', { class: 'bard-h' }, c.name), c.tag ? h('p', { class: 'bard-tag' }, c.tag) : null, first);
}

/** Pages of `blocks`, each holding as many as fit (at least one); always a first page. */
function fill(blocks: HTMLElement[], page: (blocks: HTMLElement[], index: number) => Sheet): Sheet[] {
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  const over = (s: Sheet) => {
    s.el.style.width = '550px';
    host.replaceChildren(s.el);
    const inner = s.el.firstElementChild as HTMLElement;
    return inner.scrollHeight > inner.clientHeight + 1;
  };
  const pages: Sheet[] = [];
  try {
    let at = 0;
    do {
      let n = 1;
      while (at + n < blocks.length && !over(page(blocks.slice(at, at + n + 1), pages.length))) n++;
      pages.push(page(blocks.slice(at, at + n), pages.length));
      at += n;
    } while (at < blocks.length);
  } finally {
    host.remove();
  }
  for (const p of pages) p.el.style.width = '';
  return pages;
}

/** The flyer's sheets, from the games given (the catalog's Bard games when none are). */
export async function bardCatalog(games?: CatalogEntry[]): Promise<Sheet[]> {
  const sections = byCollection(games ?? (await loadCatalog().catch(() => [] as CatalogEntry[])).filter(isBizarreGame));
  const bard = sections.flatMap((c) => c.games);
  // the Bard's own credits slide holds his snapshot and his logo
  let slide: HTMLCanvasElement | undefined;
  for (const g of bard) if ((slide = await gif(g, 'bardpic.gif'))) break;
  const blocks: HTMLElement[] = [];
  for (const c of sections) {
    const [first, ...rest] = await Promise.all(c.games.map(gameBlock));
    blocks.push(sectionBlock(c, first), ...rest);
  }
  // the honest small print follows the games, on the last page of them if it fits
  blocks.push(
    h(
      'p',
      { class: 'bard-small' },
      h('b', null, 'The small print, today: '),
      BARD_CREDIT,
      ' This flyer was made for Game-Maker: Sandbox Edition; Doc Leo never mailed one.',
    ),
  );
  const logo = slide
    ? h('img', { class: 'bard-logo', src: crop(slide, LOGO), alt: 'The Bard of Bizarre', width: LOGO[2], height: LOGO[3] })
    : h('b', { class: 'bard-logo-text' }, 'The Bard of Bizarre');

  const masthead = h(
    'header',
    { class: 'bard-head' },
    logo,
    h(
      'div',
      null,
      h('b', null, 'SONG-GAMES'),
      h('span', null, 'Bizarre gospels, mundane epics', h('br'), '& a little Latin, made into games'),
      h('em', null, `${ISSUE} · Pittsburgh, PA`),
    ),
  );
  const howdy = h(
    'div',
    { class: 'bard-howdy' },
    slide
      ? h('img', { class: 'bard-snap', src: crop(slide, SNAPSHOT), alt: 'Doc Leo, the hobo clown, in a snapshot', width: SNAPSHOT[2], height: SNAPSHOT[3] })
      : null,
    h(
      'p',
      null,
      'Howdy, friends! I’m ',
      h('b', null, 'Doc Leo'),
      ', hobo clown and PhD (Comedic Science). As The Bard of Bizarre I sing about what nobody else will: the goat nobody painted, the loaf nobody picked, the remote that’s gone for good. The smaller the thing, the bigger the song! Some got stuck in my head so long they turned into games. Play them, share them, sing along.',
      h('span', { class: 'bard-sig' }, '— Doc Leo'),
    ),
  );
  const stamp = h('div', { class: 'bard-stamp' }, 'MADE WITH', h('b', null, 'GAME-MAKER'));

  // as many games on each page as fit, measured on a real page
  const pages = fill(blocks, (games, i) =>
    i === 0
      ? sheet(5.5, 8.5, 'bard', masthead, howdy, ...(bard.length ? games : [h('p', null, 'The first song-game is on its way.'), ...games]))
      : sheet(5.5, 8.5, 'bard', h('p', { class: 'bard-run' }, `The Bard of Bizarre · Song-games · ${ISSUE}`), ...games),
  );

  const back = sheet(
    5.5,
    8.5,
    'bard bard-back',
    h(
      'section',
      { class: 'bard-get' },
      h('h2', { class: 'bard-h' }, 'How to get them'),
      h(
        'ol',
        null,
        h(
          'li',
          null,
          'Fire up TERMINAL and call ',
          h('b', null, 'THE SOFA BBS'),
          ' at ',
          h('b', { class: 'bard-phone' }, SOFA_PHONE),
          '. Busy? Just call again.',
        ),
        h('li', null, 'Say hi in the teleconference (ignore LUNCHMEAT).'),
        h('li', null, 'Open the ', h('b', null, 'File Library'), ' and type ', h('kbd', null, 'D'), ' and the file’s number. Free for every caller.'),
        h('li', null, 'It unzips into ', h('code', null, 'C:\\DOWNLOAD'), '. Type the game’s name and press Enter.'),
      ),
    ),
    h(
      'section',
      { class: 'bard-coupon' },
      h('h2', null, '✂ Registration coupon'),
      h('p', null, 'This is shareware: copy it, give it to friends, upload it to your favorite BBS. If it made you smile, register:'),
      h('table', null, ...bard.map((g) => h('tr', null, h('td', null, '☐'), h('td', null, g.title), h('td', null, price(g))))),
      h('p', null, 'Registered players get a Bard of Bizarre sticker and a hand-drawn surprise. Send a check (US funds) to:'),
      h('div', { class: 'bard-mail' }, h('address', null, 'The Bard of Bizarre', h('br'), 'c/o The Sofa BBS', h('br'), 'Pittsburgh, PA'), stamp),
      h('p', { class: 'bard-story' }, '(In the story only: there is nothing to pay and nowhere to mail. The games are free.)'),
    ),
  );
  pages.push(back);
  return pages;
}
