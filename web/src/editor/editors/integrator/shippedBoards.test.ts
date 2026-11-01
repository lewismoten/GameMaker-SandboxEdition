// Every games/<id>/integrator.json reads back whole: no board, group or spot is dropped as invalid.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readBoards } from './boardLayout';

const games = join(__dirname, '../../../../../games');

describe('shipped boards', () => {
  for (const id of readdirSync(games).filter((d) => existsSync(join(games, d, 'integrator.json')))) {
    it(`${id}: nothing is dropped, every scene is in one place`, () => {
      const raw = JSON.parse(readFileSync(join(games, id, 'integrator.json'), 'utf8')) as { boards: unknown[]; groups: { members: number[] }[]; place: object };
      const d = readBoards(raw);
      expect(d.boards).toHaveLength(raw.boards.length);
      expect(d.groups).toHaveLength(raw.groups.length);
      expect(Object.keys(d.place)).toHaveLength(Object.keys(raw.place).length);
      const all = [...Object.keys(d.place).map(Number), ...d.groups.flatMap((g) => g.members)];
      expect(new Set(all).size).toBe(all.length);
      const ids = new Set(d.boards.map((b) => b.id));
      expect([...Object.values(d.place), ...d.groups].every((x) => ids.has(x.board))).toBe(true);
    });
  }
});
