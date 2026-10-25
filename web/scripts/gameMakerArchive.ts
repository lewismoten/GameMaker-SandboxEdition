// Writes src/manual/magazine/data/gameMakerArchive.json, the titles on TURBO BUTTON's
// Shareware Shelf (sections/shelf.ts): every Game-Maker game in the Game-Maker Archive at the
// Internet Archive (archive.org), with its year and author where the item's metadata gives them.
// Titles only: nothing is downloaded but the search results, and the page links to none of them.
//
//   npx vite-node scripts/gameMakerArchive.ts      (from web/)
//
// It asks archive.org's public search API (advancedsearch.php) for the items whose identifier
// starts game-maker_ (how the archive names its Game-Maker items) and that carry one of its
// Game-Maker subjects; a subject search alone also finds unrelated "Game Maker" items. Then it
// cleans the titles (version tags like [v4.0] or [unregistered], the maker's name in brackets),
// merges versions of one game (Blinky 2 and Blinky II, a shareware and a gameware edition),
// drops Game-Maker's own tools and our own games, and marks the games on the Game-Maker CD.
// What it fetches is data: titles, names and dates, never anything to run.
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cdCatalog, cdSecretCatalog } from './cdGames';

const SUBJECTS = ['Game-Maker games', 'RSD Game-Maker Games', 'Game-Maker Archive featured games'];
const QUERY = `identifier:game-maker_* AND subject:(${SUBJECTS.map((s) => `"${s}"`).join(' OR ')})`;
const api = (q: string) =>
  `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&rows=1000&output=json`;

/** Not games made with Game-Maker: its own tools and demo. */
const TOOLS = new Set(['game-maker_graphics-tools', 'game-maker_demo']);
/** Left off a family magazine's page (crude or adult titles); refetching keeps them off. */
const OMIT = new Set(['game-maker_shorty', 'game-maker_preggers']);
/** Versions the title rules can't tell are one game: identifier → the identifier it is a version of. */
const SAME = new Map([
  ['game-maker_dbz2_remix', 'game-maker_dragon-ball-z-2'],
  ['game-maker_crystal-quest_original', 'game-maker_crystal-quest'],
]);
/** Archive items that are a game on the Game-Maker CD (../cd): identifier → the CD's game id. */
const ON_CD: Record<string, string> = {
  'game-maker_barracuda-secret-mission-1': 'bcuda',
  'game-maker_crullo-adventures-of-a-donut': 'donut',
  'game-maker_glubada-pond': 'glub',
  'game-maker_the-patchwork-heart': 'heart',
  'game-maker_houses': 'houses',
  'game-maker_nebula': 'nebula',
  'game-maker_woman-warrior-and-the-outer-limits': 'warrior',
  'game-maker_woman-warrior-and-the-attack-from-below': 'outerlim',
  'game-maker_peach-the-lobster': 'peach',
  'game-maker_penguin-pete': 'penguin',
  'game-maker_pipemare': 'pipemare',
  'game-maker_cirenegs-rings': 'rings5',
  'game-maker_sample': 'sample',
  'game-maker_terrain_rsd': 'terrain',
  'game-maker_tutor_rsd': 'tutor',
  'game-maker_linear-volume': 'volume',
  'game-maker_zark': 'zark',
  'game-maker_the-return-of-a-j_demo': 'ajqst2',
  'game-maker_ajs-quest': 'ajquest',
  'game-maker_the-bounerim': 'bounerm',
  'game-maker_progress-or-congress': 'congress',
  'game-maker_fluffy-ralph': 'fluffyr',
  'game-maker_gridline': 'gridlin',
  'game-maker_nejillian-flux': 'njlnflx',
  'game-maker_octolris': 'octolrs',
  'game-maker_orb-the-derelict-planet': 'orb',
  'game-maker_pac': 'pac',
  'game-maker_paper-airplane': 'paperair',
  'game-maker_parsec-man-3d': 'parsec3d',
  'game-maker_sign-of-the-hedgehog': 'signhdg',
  'game-maker_zoom-the-super-bear': 'zoom',
};

interface Doc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  date?: string;
}

interface ArchiveGame {
  title: string;
  by?: string;
  year?: number;
  /** The Game-Maker CD's id for it, when it is on the CD (and so plays on this site). */
  cd?: string;
}

interface ArchiveFile {
  source: string;
  query: string;
  fetched: string;
  /** How many items the query found, and how many titles are left once cleaned and merged. */
  found: number;
  games: ArchiveGame[];
}

async function search(q: string): Promise<{ numFound: number; docs: Doc[] }> {
  const res = await fetch(api(q));
  if (!res.ok) throw new Error(`archive.org search: ${res.status}`);
  const body = (await res.json()) as { response: { numFound: number; docs: Doc[] } };
  return body.response;
}

/** The title as the box would print it: no version tags, no maker's name in brackets. */
const cleanTitle = (t: string) =>
  t
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:Roy Person, Sr\.|cly5m|Sherwood Forest Software|Alan Caudel|Matthew Groves)\)$/, '')
    .replace(/^Game-Maker:\s*/i, '')
    .trim();

const ROMAN: Record<string, string> = { ii: '2', iii: '3', iv: '4', v: '5', vi: '6' };
/** One key for the versions of a game: case, punctuation, a leading "the" and Roman numerals don't count. */
const titleKey = (t: string) =>
  cleanTitle(t)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    // a lone I at the end is a numeral too (Mister Spiff I), but not one inside a title
    .map((w, i, all) => ROMAN[w] ?? (w === 'i' && i > 0 && i === all.length - 1 ? '1' : w))
    .join(' ');

const people = (c: Doc['creator']) => (Array.isArray(c) ? c : c ? [c] : []).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean);

async function main(): Promise<void> {
  const repo = resolve(import.meta.dirname, '../..');
  const { numFound, docs } = await search(QUERY);
  for (const s of SUBJECTS) console.log(`subject:"${s}": ${(await search(`subject:"${s}"`)).numFound}`);
  console.log(`${QUERY}: ${numFound}`);

  // our own games (and the secret ones) never go on the shelf, should the archive ever hold them
  const cd = [...cdCatalog(join(repo, 'cd')), ...cdSecretCatalog(join(repo, 'cd'))];
  const ours = new Set(cd.filter((g) => g.original).map((g) => titleKey(g.title)));
  const cdIds = new Set(cd.filter((g) => !g.original).map((g) => g.id));

  const merged = new Map<string, ArchiveGame & { key: string }>();
  const keyOf = new Map<string, string>();
  const sorted = [...docs].sort((x, y) => x.identifier.localeCompare(y.identifier));
  // the version a SAME entry names comes first, so its title is the one kept
  sorted.sort((x, y) => Number(SAME.has(x.identifier)) - Number(SAME.has(y.identifier)));
  for (const d of sorted) {
    if (!d.title || TOOLS.has(d.identifier) || OMIT.has(d.identifier)) continue;
    const title = cleanTitle(d.title);
    if (ours.has(titleKey(title))) continue;
    const by = people(d.creator);
    const year = d.date ? Number(d.date.slice(0, 4)) : undefined;
    const key = SAME.has(d.identifier) ? keyOf.get(SAME.get(d.identifier)!)! : `${titleKey(title)}|${(by[0] ?? '').toLowerCase()}`;
    keyOf.set(d.identifier, key);
    const was = merged.get(key);
    const onCd = ON_CD[d.identifier];
    if (onCd && !cdIds.has(onCd)) throw new Error(`${d.identifier}: no game ${onCd} on the CD`);
    if (was) {
      if (year && (!was.year || year < was.year)) was.year = year;
      was.cd ??= onCd;
      // the shorter title is the plain one ("Dummy Duck 3", not its unregistered copy's)
      if (title.length < was.title.length) was.title = title;
      continue;
    }
    merged.set(key, { key, title, by: by.length ? by.join(', ') : undefined, year: year || undefined, cd: onCd });
  }
  const games = [...merged.values()]
    .map(({ title, by, year, cd: id }) => ({ title, by, year, cd: id }))
    .sort((x, y) => titleKey(x.title).localeCompare(titleKey(y.title), 'en', { numeric: true }) || (x.by ?? '').localeCompare(y.by ?? ''));
  const file: ArchiveFile = {
    source: 'The Game-Maker Archive at the Internet Archive (archive.org), titles from its public search API (advancedsearch.php)',
    query: QUERY,
    fetched: new Date().toLocaleDateString('en-CA'),
    found: numFound,
    games,
  };
  const out = join(import.meta.dirname, '../src/manual/magazine/data/gameMakerArchive.json');
  writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`${games.length} titles (${games.filter((g) => g.cd).length} on the Game-Maker CD) → ${out}`);
}

void main();
