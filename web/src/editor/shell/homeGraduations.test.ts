// The Starters tab's graduation order: an open graduation is "ready" (first), an earned one goes back to its place, a locked one stays.
import { describe, expect, it } from 'vitest';
import { CEREMONIES, DIPLOMA, ceremonyState, stageGames } from '../../project/ceremonies';
import { gradShowFor, readyCeremonies, sectionCeremonies, type GradShow } from './homeGraduations';
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

describe('graduations under the Show filter', () => {
  it('Done shows the earned ones, Not done yet the locked ones (open ones are in the ready strip), All and Graduations every one', () => {
    expect(gradShowFor('done')).toBe('earned');
    expect(gradShowFor('todo')).toBe('locked');
    expect(gradShowFor('all')).toBe('all');
    expect(gradShowFor('grad')).toBe('all');
  });
  it('the section keeps only the graduations the filter asks for', () => {
    // stage 0 earned, stage 1 open, the rest locked
    const grades = { ...stage(0), ...stage(1) };
    const finished = new Set([CEREMONIES[0].id]);
    const shown = (show: GradShow) => sectionCeremonies(games, finished, grades, show).map((r) => `${r.ceremony.id} ${r.state.state}`);
    const locked = [...CEREMONIES.slice(2), DIPLOMA].map((c) => `${c.id} locked`);
    expect(shown('earned')).toEqual([`${CEREMONIES[0].id} earned`]);
    expect(shown('locked')).toEqual(locked);
    expect(shown('all')).toEqual([`${CEREMONIES[0].id} earned`, ...locked]);
    expect(sectionCeremonies(games, new Set(), {}, 'earned')).toEqual([]);
  });
});
