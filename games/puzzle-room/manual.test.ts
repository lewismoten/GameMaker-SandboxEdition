// The level 2 tour should introduce the landmarks as the player reaches them.
import { expect, it } from 'vitest';
import manual from './manual.json';
import { L2 } from './src/levels';

it('walks from the entrance to the levers and returns to the hatch', () => {
  const tour = manual.pages
    .find((page) => page.head === 'Level 2: Wired Room')!
    .html.replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  const landmarks = [
    { name: 'hatch', x: L2.hatch },
    { name: 'blue lever', x: L2.leverA },
    { name: 'ladder', x: L2.ladder },
    { name: 'red lever', x: L2.leverC },
  ].sort((a, b) => Math.abs(a.x - L2.entrance) - Math.abs(b.x - L2.entrance));

  let previous = -1;
  for (const { name } of landmarks) {
    const firstMention = tour.indexOf(name);
    expect(firstMention, name).toBeGreaterThan(previous);
    previous = firstMention;
  }
  expect(tour.slice(previous)).toMatch(/(?:back|return|right)[^.]*hatch/);
});
