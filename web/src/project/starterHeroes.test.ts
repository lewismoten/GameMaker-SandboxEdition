// Keep the displayed hero, metadata and append-only deal in step without needing built disks.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADDED_LATER, STARTER_ORDER } from './starter';
import { heroOfStarter, STARTER_HEROES } from './starterHeroes';

const games = join(__dirname, '../../../games');
const starters = readdirSync(games).flatMap((id) => {
  try {
    const about = JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')) as { series?: string; hero?: string };
    return about.series === 'starter' ? [{ id, hero: about.hero }] : [];
  } catch {
    return [];
  }
});

describe('Starter heroes', () => {
  it.each(starters)('$id metadata agrees with the shared hero table', ({ id, hero }) => {
    expect(hero).toBe(heroOfStarter(id));
  });

  it('deals each grouped game once and files each later addition once', () => {
    expect(new Set(STARTER_ORDER).size).toBe(STARTER_ORDER.length);
    expect(new Set(ADDED_LATER).size).toBe(ADDED_LATER.length);
    expect(Object.keys(STARTER_HEROES).sort()).toEqual([...STARTER_ORDER].sort());
    for (const id of ADDED_LATER) expect(STARTER_ORDER).toContain(id);
  });

  it('preserves the later heroes after Weather was inserted before Showcase Tricks', () => {
    // Order here is the append-only deal, not Weather's position in the displayed groups.
    expect(ADDED_LATER.map((id) => [id, heroOfStarter(id)])).toEqual([
      ['under-the-hood', 'LIAN'],
      ['around-the-room', 'YANA'],
      ['ride-along', 'NOVA'],
      ['lightning-bugs', 'RIMA'],
      ['fireworks', 'LAMI'],
      ['leaves', 'MIA'],
      ['quicksand', 'LENA'],
      ['lightning', 'MARA'],
      ['heat-waves', 'KIT'],
      ['rain', 'LIAN'],
    ]);
  });
});
