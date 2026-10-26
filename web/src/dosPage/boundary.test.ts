// The DOS page (dos.html) loads none of the desk: walks every import it can reach, up front or
// on demand, from its entry (and from the PC's core, retro/computer.ts), and fails if anything
// under src/desk/ is among them. Type-only imports are left out (they are gone once built).
import { describe, expect, it } from 'vitest';
import { chains, reachable } from '../importWalk';

describe('the DOS page and the PC core', () => {
  for (const entry of ['dosPage/dosPage.ts', 'retro/computer.ts']) {
    it(`${entry} reaches nothing under desk/`, () => {
      const graph = reachable(entry, { dynamic: true });
      expect(graph.size).toBeGreaterThan(50); // the walk did find the PC
      expect(chains(graph, /^desk\//)).toEqual([]);
    });
  }
});
