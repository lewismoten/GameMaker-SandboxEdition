// The Starters tab's graduation order: an open graduation is "ready" (first), an earned one goes back to its place, a locked one stays.
import { describe, expect, it } from 'vitest';
import { CEREMONIES, DIPLOMA, ceremonyState, stageGames } from '../../project/ceremonies';
import { readyCeremonies } from './homeGraduations';
import type { HomeGame } from './homeCards';

const games = [...CEREMONIES, DIPLOMA].map((c) => ({ entry: { id: c.id }, title: c.stage }) as unknown as HomeGame);
const stage = (n: number) => Object.fromEntries(stageGames(CEREMONIES[n]).map((id) => [id, 'A' as const]));

describe('graduation order', () => {
  it('nothing is ready while all are locked', () => expect(readyCeremonies(games, new Set(), {})).toEqual([]));
  it('open ones are ready, in stage order', () => {
    const grades = { ...stage(2), ...stage(0) };
    expect(readyCeremonies(games, new Set(), grades).map((r) => r.ceremony.id)).toEqual([CEREMONIES[0].id, CEREMONIES[2].id]);
    expect(ceremonyState(CEREMONIES[0], grades, new Set()).state).toBe('open');
  });
  it('an earned one is not ready and returns to the section', () => {
    const grades = stage(0);
    const finished = new Set([CEREMONIES[0].id]);
    expect(readyCeremonies(games, finished, grades)).toEqual([]);
    expect(ceremonyState(CEREMONIES[0], grades, finished).state).toBe('earned');
  });
  it('locked ones are never ready', () => {
    const grades = stage(0);
    expect(readyCeremonies(games, new Set(), grades).map((r) => r.ceremony.id)).toEqual([CEREMONIES[0].id]);
    expect(ceremonyState(CEREMONIES[1], grades, new Set()).state).toBe('locked');
  });
});
