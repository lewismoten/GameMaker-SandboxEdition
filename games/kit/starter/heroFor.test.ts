// Every Starter's about.json names the hero heroFor says, Kit leads each group's first game, and the helpers share the rest.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STARTER_GROUPS } from '../../../web/src/project/starter';
import { HELPER_NAMES } from '../../../web/src/project/starterHeroes';
import { heroFor, lookOf } from './heroFor';
import { helperPalettes, recolor } from './heroLook';
import { buildStarterPalette } from './palette';

const G = join(__dirname, '..', '..');
const starters = readdirSync(G).flatMap((id) => {
  try {
    const a = JSON.parse(readFileSync(join(G, id, 'about.json'), 'utf8')) as { series?: string; hero?: string; title: string };
    return a.series === 'starter' ? [{ id, ...a }] : [];
  } catch {
    return [];
  }
});

describe('heroFor', () => {
  it('has a look for each helper the table names', () => {
    expect(HELPER_NAMES).toEqual(helperPalettes.map((h) => h.name));
  });
  it('matches about.json for every Starter', () => {
    for (const s of starters) expect(s.hero, s.id).toBe(heroFor(s.id));
  });
  it.each(starters)('$id builds the palette of its dealt hero', ({ id }) => {
    // The real builder reads about.json; comparing with the table catches a drawn-hero mismatch, not just a label.
    const pal = buildStarterPalette(undefined, id);
    expect(pal.pal).toEqual(recolor(pal, lookOf(heroFor(id))));
  });
  it('gives Kit the first game of each group', () => {
    for (const g of STARTER_GROUPS) expect(heroFor(g.games[0]), g.name).toBe('KIT');
  });
  it('shares the rest among the eight helpers evenly', () => {
    const n = new Map<string, number>();
    for (const s of starters) if (heroFor(s.id) !== 'KIT') n.set(heroFor(s.id), (n.get(heroFor(s.id)) ?? 0) + 1);
    expect(n.size).toBe(8);
    const counts = [...n.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
  it('leaves no other helper in the text of a game another one leads', () => {
    const names = ['Kit', 'Mia', 'Lena', 'Mara', 'Lian', 'Yana', 'Nova', 'Rima', 'Lami'];
    for (const s of starters) {
      const mine = heroFor(s.id);
      const text = readFileSync(join(G, s.id, 'about.json'), 'utf8') + readFileSync(join(G, s.id, 'manual.json'), 'utf8');
      for (const n of names)
        if (n.toUpperCase() !== mine && !s.title.includes(n)) expect(new RegExp(`\\b${n}\\b`).test(text), `${s.id} mentions ${n}`).toBe(false);
    }
  });
});
