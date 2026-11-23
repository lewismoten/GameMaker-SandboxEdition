// Replay the recovery inputs from the Starter manuals against the built games.
import { expect, it } from 'vitest';
import lightningManual from '../../lightning/manual.json';
import { HOWTO as lightningHelp } from '../../lightning/src/text';
import { play as lightning } from '../../lightning/tools/play';
import quicksandManual from '../../quicksand/manual.json';
import { HOWTO as quicksandHelp } from '../../quicksand/src/text';
import { play as quicksand } from '../../quicksand/tools/play';
import type { Dir, StarterBot } from './bot';
import { SCAN } from './ids';

async function climb(bot: StarterBot, direction: Dir, floor: number) {
  const { sim } = bot;
  const ledge = floor - 20;
  expect(bot.px.y).toBe(floor);
  sim.press(SCAN[direction]);
  await bot.tick();
  const ready = bot.snapshot();
  const start = bot.px;

  // Let go during the rise, before reaching the lip.
  sim.press(SCAN.space);
  await bot.tick();
  expect(bot.px.y).toBeLessThan(floor);
  expect(bot.px.y).toBeGreaterThan(ledge);
  sim.release(SCAN.space);
  for (let tick = 0; tick < 30; tick++) {
    await bot.tick();
    expect(bot.px.x).toBe(start.x);
    if (bot.px.y === floor) break;
  }
  expect(bot.px.y).toBe(floor);
  bot.restore(ready);

  // Keep the arrow down and follow the rise to its peak.
  sim.press(SCAN.space);
  let previousY = floor;
  for (let tick = 0; tick < 30; tick++) {
    previousY = bot.px.y;
    await bot.tick();
    expect(bot.px.x).toBe(start.x);
    if (bot.px.y >= previousY) break;
  }
  expect(previousY).toBeLessThan(ledge);
  expect(bot.px.y).toBeGreaterThanOrEqual(previousY);
  expect(bot.px.y).toBeLessThan(ledge);
  sim.release(SCAN.space);
  expect(await bot.land()).toBeUndefined();
  const distance = direction === 'left' ? start.x - bot.px.x : bot.px.x - start.x;
  expect(distance).toBeGreaterThanOrEqual(20);
  for (let tick = 0; tick < 3; tick++) {
    expect(bot.px.y).toBe(ledge);
    await bot.tick();
  }
  expect(bot.px.y).toBe(ledge);
}

it.each([
  ['dry', 0, 16],
  ['wet', 1, 27],
] as const)('escapes the %s sand hole after releasing Space above the bank', async (_, level, column) => {
  const { bot } = await quicksand(1, level);
  await bot.walk(column);
  await bot.wait(160);
  await climb(bot, 'right', 200);
});

it('climbs both Lightning steps by releasing Space above each step', async () => {
  const { bot } = await lightning(1, 1);
  await bot.walk(15);
  await bot.wait(160);
  await climb(bot, 'left', 240);
  await climb(bot, 'left', 220);
});

it.each([
  ['Lightning', lightningHelp, lightningManual, ['Level 2: Light the Way']],
  ['Quicksand', quicksandHelp, quicksandManual, ['Welcome', "Level 1: Don't Stand Still", 'Level 2: Stepping Stones']],
] as const)('%s gives the airborne release cue wherever it explains recovery', (_, help, manual, headings) => {
  const instructions = [help, ...headings.map((head) => manual.pages.find((page) => page.head === head)?.html ?? '')];
  for (const text of instructions) {
    const words = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    expect(words).toMatch(/(?:release|let go of) space in the air/i);
  }
});
