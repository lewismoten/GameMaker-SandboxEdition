// The magazine's links into the site: `go:` targets (a game to play, its hint book, the
// Guide, the BBS, a desk prop, the store…), checked and turned into addresses here (no DOM).
// goRun.ts runs the ones that open something on top of the page instead.

/** A link target, e.g. 'go:play/teddy', 'go:hints/snowbound', 'go:desk/modem'. */
export type Go = `go:${string}`;

export type GoKind =
  | 'play'
  | 'game'
  | 'manual'
  | 'hints'
  | 'newsletter'
  | 'catalog'
  | 'guide'
  | 'ultimate'
  | 'bbs'
  | 'desk'
  | 'store'
  | 'editor'
  | 'dos'
  | 'route'
  | 'mag'
  | 'url';

export interface GoTarget {
  kind: GoKind;
  /** What follows the kind: a game id, a section, a prop… ('' when none). */
  arg: string;
}

/** Where the magazine is being read: on the 1994 desk, or on today's web. */
export type Where = 'desk' | 'web';

/** What each kind takes. */
const NEEDS_GAME = new Set<GoKind>(['play', 'game', 'manual', 'hints', 'newsletter']);
export const CATALOGS = ['sandbox', 'bard', 'shareware'] as const;
export const DESK_PROPS = ['', 'modem', 'diskbox', 'speakers', 'gamepad', 'mug', 'gmbox', 'catalog'] as const;
/** The boards TERMINAL dials by name (retro/bbs/bbs.ts); '' opens its dialing directory. */
export const BBS_BOARDS = ['', 'sandbox', 'sofa'] as const;
export const ROUTES = ['cast', 'credits', 'achievements', 'mac', 'windows', 'linux'] as const;
/** The web Guide's sections (manual/webManual.ts SECTIONS; a test keeps them in step). */
export const GUIDE_SECTIONS = [
  'start',
  'home',
  'workspace',
  'editors',
  'tools',
  'play',
  'export',
  'offline',
  'desk',
  'ultimate',
  'credits',
  'more-games',
] as const;
const KINDS: readonly GoKind[] = [
  'play',
  'game',
  'manual',
  'hints',
  'newsletter',
  'catalog',
  'guide',
  'ultimate',
  'bbs',
  'desk',
  'store',
  'editor',
  'dos',
  'route',
  'mag',
  'url',
];

/** 'go:hints/teddy' → { kind: 'hints', arg: 'teddy' }; undefined when it isn't a go: link. */
export function parseGo(go: string): GoTarget | undefined {
  const m = /^go:([a-z]+)(?:\/(.*))?$/.exec(go);
  if (!m || !KINDS.includes(m[1] as GoKind)) return undefined;
  return { kind: m[1] as GoKind, arg: m[2] ?? '' };
}

export interface GoKnown {
  games: ReadonlySet<string>;
  /** Games with a manual box (manual, hints and newsletter need one) and with a hint book. */
  boxed: ReadonlySet<string>;
  hinted: ReadonlySet<string>;
  pages: ReadonlySet<string>;
  chapters: ReadonlySet<string>;
}

/** Why a link would lead nowhere, or undefined when it resolves. */
export function goProblem(go: string, known: GoKnown): string | undefined {
  const t = parseGo(go);
  if (!t) return `not a go: link: ${go}`;
  const { kind, arg } = t;
  if (NEEDS_GAME.has(kind)) {
    if (!known.games.has(arg)) return `no such game: ${go}`;
    if ((kind === 'manual' || kind === 'newsletter') && !known.boxed.has(arg)) return `${arg} has no box: ${go}`;
    if (kind === 'hints' && !known.hinted.has(arg)) return `${arg} has no hint book: ${go}`;
    return undefined;
  }
  const ok =
    kind === 'catalog'
      ? (CATALOGS as readonly string[]).includes(arg)
      : kind === 'guide'
        ? arg === '' || (GUIDE_SECTIONS as readonly string[]).includes(arg)
        : kind === 'ultimate'
          ? arg === '' || known.chapters.has(arg)
          : kind === 'desk'
            ? (DESK_PROPS as readonly string[]).includes(arg)
            : kind === 'route'
              ? (ROUTES as readonly string[]).includes(arg)
              : kind === 'mag'
                ? known.pages.has(arg)
                : kind === 'url'
                  ? /^https:\/\/[\w.-]+\.\w+(\/\S*)?$/.test(arg)
                  : kind === 'store'
                    ? /^[\w-]*$/.test(arg)
                    : kind === 'dos'
                      ? arg === '' || known.games.has(arg)
                      : kind === 'bbs'
                        ? (BBS_BOARDS as readonly string[]).includes(arg)
                        : kind === 'editor'
                          ? /^[\w-]*$/.test(arg)
                          : false;
  return ok ? undefined : `leads nowhere: ${go}`;
}

/** The desk's address for a prop (desk.ts reads open= and look=). */
const deskHash = (prop: string): string =>
  prop === '' ? '#/desk' : prop === 'catalog' || prop === 'gmbox' ? `#/desk?open=${prop === 'gmbox' ? 'gm-box' : 'catalog'}` : `#/desk?look=${prop}`;

/**
 * The address a link points at, for a plain click, a new tab and the printed page. Links whose
 * job is to open something on top (a hint book, the store) point at the nearest page and
 * goRun.ts opens the thing itself.
 */
export function goHref(go: string, where: Where): string {
  const t = parseGo(go);
  if (!t) return '#/magazine';
  const { kind, arg } = t;
  switch (kind) {
    case 'play':
      return where === 'desk' ? `#/desk?disk=cd:${arg}&run=play` : `#/game/cd:${arg}`;
    case 'game':
    case 'manual':
    case 'hints':
    case 'newsletter':
      return `#/game/cd:${arg}`;
    case 'catalog':
      return arg === 'shareware' ? '#/desk?open=catalog' : '#/desk?open=gm-box';
    case 'guide':
      return arg ? `#/help/${arg}` : '#/help';
    case 'ultimate':
      return arg ? `#/help/ultimate?chapter=${arg}` : '#/help/ultimate';
    case 'bbs':
      return where === 'desk' ? '#/desk?run=bbs' : `./dos.html?run=bbs${arg ? `&dial=${arg}` : ''}`;
    case 'desk':
      return deskHash(arg);
    case 'store':
      return '#/desk?look=mug';
    case 'editor':
      return '#/';
    case 'dos':
      return where === 'desk' && !arg ? '#/desk?run=gm' : `./dos.html${arg ? `?game=${arg}` : ''}`;
    case 'route':
      return `#/${arg}`;
    case 'mag':
      return `#/magazine?page=${encodeURIComponent(arg)}`;
    case 'url':
      return arg;
  }
}
