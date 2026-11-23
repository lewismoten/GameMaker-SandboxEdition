// Replay the recovery inputs from the Starter manuals against the built games.
import { expect, it } from 'vitest';
import { play as lightning } from '../../lightning/tools/play';
import { play as quicksand } from '../../quicksand/tools/play';
import { SCAN } from './ids';

it.each([
  ['dry', 0, 16],
  ['wet', 1, 27],
] as const)('clears the %s sand hole while holding Right and Space', async (_, level, column) => {
  const { sim, bot } = await quicksand(1, level);
  await bot.walk(column);
  await bot.wait(160);
  const startX = column * 20;
  expect(bot.px).toEqual({ x: startX, y: 200 });
  sim.press(SCAN.right);
  await bot.wait(12);
  sim.press(SCAN.space);
  await bot.wait(4);
  sim.release(SCAN.space);
  await bot.wait(7);
  expect(bot.px.x).toBeGreaterThanOrEqual(startX + 20);
  expect(bot.px.y).toBe(180);
});

it('lands on each Lightning step after releasing and holding Space again', async () => {
  const { sim, bot } = await lightning(1, 1);
  await bot.walk(15);
  await bot.wait(160);
  expect(bot.px).toEqual({ x: 300, y: 240 });
  for (const height of [220, 200]) {
    const startX = bot.px.x;
    sim.press(SCAN.left);
    await bot.wait(12);
    sim.press(SCAN.space);
    await bot.wait(4);
    sim.release(SCAN.space);
    await bot.wait(7);
    sim.release(SCAN.left);
    const landing = bot.px;
    expect(landing.x).toBeLessThanOrEqual(startX - 20);
    expect(landing.y).toBe(height);
    await bot.wait(30);
    expect(bot.px).toEqual(landing);
  }
});
