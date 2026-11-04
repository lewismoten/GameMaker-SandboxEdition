// The hint line's phone tree, with no audio and no timers: where a caller is (a page of the game menu,
// or one hint of one game), what the Hint Giant says there, and where each key goes. hintLine.ts plays it.
//
//   game menu (pages of 8 games)  1-8 a game's hints   9 more games (the last page wraps to the first)
//                                 # the pretend bill   * the first page   0 hang up
//   a game's hints                1 next hint   2 or * the game menu   0 hear it again   # the bill
//
// Pages of games and not catalog numbers: a caller hears "for Final Curtain, press 2" and presses one key,
// where a catalog number would be a four-digit code the caller has to remember or look up first.
import { HINT_GAMES, PAGE_SIZE, type HintGame } from '../../../audio/phone/hintGames';
import { HINT_LAST, HINT_NEXT, hintIntro, hintMenuTexts } from '../../../audio/phone/phoneScript';

export type HintNode = { kind: 'menu'; page: number } | { kind: 'hint'; game: number; n: number };

export const START: HintNode = { kind: 'menu', page: 0 };
export const pageCount = (): number => Math.ceil(HINT_GAMES.length / PAGE_SIZE);
/** The game a key picks on a menu page, if any. */
export const gameOnPage = (page: number, key: string): HintGame | undefined => {
  const i = Number(key) - 1;
  return /^[1-8]$/.test(key) && i < PAGE_SIZE ? HINT_GAMES[page * PAGE_SIZE + i] : undefined;
};

/** What the Hint Giant says on arriving at (or repeating) a node. */
export function nodeText(node: HintNode): string {
  if (node.kind === 'menu') return hintMenuTexts()[node.page];
  const g = HINT_GAMES[node.game];
  const last = node.n >= g.hints.length - 1;
  const hint = `${g.hints[node.n]} ${last ? HINT_LAST : HINT_NEXT}`;
  return node.n === 0 ? `${hintIntro(g.title)} ${hint}` : hint;
}

export type Move = { node: HintNode } | { bill: true } | { hangup: true } | { bad: true };

export function press(node: HintNode, key: string): Move {
  if (key === '#') return { bill: true };
  if (node.kind === 'menu') {
    if (key === '0') return { hangup: true };
    if (key === '*') return { node: START };
    if (key === '9') return { node: { kind: 'menu', page: (node.page + 1) % pageCount() } };
    const game = gameOnPage(node.page, key);
    return game ? { node: { kind: 'hint', game: HINT_GAMES.indexOf(game), n: 0 } } : { bad: true };
  }
  const last = node.n >= HINT_GAMES[node.game].hints.length - 1;
  if (key === '0') return { node };
  if (key === '2' || key === '*') return { node: START };
  if (key === '1') return last ? { bad: true } : { node: { kind: 'hint', game: node.game, n: node.n + 1 } };
  return { bad: true };
}
