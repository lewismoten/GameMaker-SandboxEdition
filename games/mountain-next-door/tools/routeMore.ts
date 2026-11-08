// The way through the levels the hour-long story added (route.ts has the first ten): the same human orders, a
// look at every sign, a wait for anything on a clock, every treasure taken.
import type { StarterBot } from '../../kit/starter/bot';
import { BACK_AT, TERRACES } from '../src/levels/back';
import { LFLOORS, LIBRARY_AT } from '../src/levels/library';
import { POINTS } from '../src/props';
import { cross, ladder, take } from './route';
import { READ, leave, must, readAt, score } from './routeKit';

/** 3. Up Mossback's Back: six terraces, a post at both ends of each, the wobbly rocks, and the dent at the top. */
export async function mossbackBack(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const B = BACK_AT;
  const T = TERRACES;
  const at = B.signs;
  const feet = (k: number) => T[k].row - 1;
  const scree = (k: number) => B.scree.find(([t]) => t === k) as readonly [number, number, number];
  const rocks = async (k: number) => {
    const [, a, b] = scree(k);
    await cross(bot, [[a, b]], T[k].row, `the wobbly rocks on terrace ${k + 1}`, 'back', 'screeUp');
  };
  await ladder(bot, B.ladders[0], 'up', feet(0), 'the first ladder');
  await readAt(bot, at.view + 1, 'the view sign');
  await take(bot, B.posts[0][0], POINTS.blaze, 'a post');
  await rocks(0);
  await take(bot, B.acorns[0][1], POINTS.acorn, 'an acorn');
  await take(bot, B.posts[0][1], POINTS.blaze, 'a post');
  await ladder(bot, B.ladders[1], 'up', feet(1), 'the second ladder');
  await take(bot, B.posts[1][0], POINTS.blaze, 'a post');
  await take(bot, B.acorns[1][1], POINTS.acorn, 'an acorn');
  await must(bot, bot.wait(READ / 3), 'a look at the hens');
  await take(bot, B.posts[1][1], POINTS.blaze, 'a post');
  await readAt(bot, at.hens + 1, 'the hens sign');
  await ladder(bot, B.ladders[2], 'up', feet(2), 'the third ladder');
  await readAt(bot, at.up + 1, 'the wobbly rocks sign');
  await take(bot, B.posts[2][0], POINTS.blaze, 'a post');
  await rocks(2);
  await take(bot, B.posts[2][1], POINTS.blaze, 'a post');
  await ladder(bot, B.ladders[3], 'up', feet(3), 'the fourth ladder');
  await take(bot, B.posts[3][0], POINTS.blaze, 'a post');
  await take(bot, B.acorns[2][1], POINTS.acorn, 'an acorn');
  await must(bot, bot.walk(B.pie[1], 'the pie'), 'to the pie');
  await take(bot, B.posts[3][1], POINTS.blaze, 'a post');
  await ladder(bot, B.ladders[4], 'up', feet(4), 'the fifth ladder');
  await take(bot, B.posts[4][0], POINTS.blaze, 'a post');
  await rocks(4);
  await take(bot, B.posts[4][1], POINTS.blaze, 'a post');
  await ladder(bot, B.ladders[5], 'up', feet(5), 'the last ladder');
  await readAt(bot, at.dent + 1, 'the dent sign');
  await must(bot, bot.wait(READ), 'a long look at the dent');
  score(bot, from, 10 * POINTS.blaze + 3 * POINTS.acorn, 'level 3');
  await leave(bot, bot.walk(B.exit, 'the exit'), 'the exit');
}

/** 5. The Library: up the ladders putting books back, the almanac's three pages, down the chute, the last gaps. */
export async function library(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const L = LIBRARY_AT;
  const at = L.signs;
  const feet = (k: number) => LFLOORS[k] - 1;
  const x = (list: readonly (readonly [number, number])[], floor: number) => list.filter(([k]) => k === floor).map(([, c]) => c);
  const books = (k: number) => x(L.books, k);
  const gaps = (k: number) => x(L.gaps, k);
  await readAt(bot, at.lin[1] + 1, "Mrs. Lin's sign");
  await must(bot, bot.walk(gaps(0)[0], 'the first gap'), 'past a gap with no book yet');
  score(bot, from, 0, 'a gap with no book in hand');
  await ladder(bot, L.ladders[0], 'up', feet(1), 'the first ladder');
  await readAt(bot, at.overdue[1] + 1, 'the overdue sign');
  await take(bot, books(1)[0], POINTS.book, 'a book');
  await take(bot, gaps(1)[0], POINTS.shelved, 'a book back on its shelf');
  await take(bot, books(1)[1], POINTS.book, 'a book');
  await ladder(bot, L.ladders[1], 'up', feet(2), 'the second ladder');
  await take(bot, gaps(2)[0], POINTS.shelved, 'a book back on its shelf');
  await take(bot, books(2)[0], POINTS.book, 'a book');
  await take(bot, gaps(2)[1], POINTS.shelved, 'a book back on its shelf');
  await ladder(bot, L.ladders[2], 'up', feet(3), 'the third ladder');
  await readAt(bot, at.chute[1] + 1, 'the chute sign');
  await take(bot, books(3)[0], POINTS.book, 'a book');
  await readAt(bot, at.page1[1] + 1, 'the almanac, page one');
  await take(bot, books(3)[1], POINTS.book, 'a book');
  await readAt(bot, at.page2[1] + 1, 'the almanac, page two');
  await readAt(bot, at.page3[1] + 1, 'the almanac, page three');
  await take(bot, books(3)[2], POINTS.book, 'a book');
  await must(bot, bot.walk(L.chute, 'the chute'), 'down the chute');
  await must(bot, bot.land(), 'landing at the bottom of the chute');
  if (Math.round(bot.px.y / 20) !== feet(0)) throw new Error(`the chute left Tess on row ${bot.px.y / 20}`);
  for (const g of gaps(0)) await take(bot, g, POINTS.shelved, 'a book back on its shelf');
  score(bot, from, 6 * (POINTS.book + POINTS.shelved), 'level 5');
  await leave(bot, bot.walk(L.exit, 'the exit'), 'the exit');
}
