// Empty progress results in a library with courses at two levels.
import { expect, it, vi } from 'vitest';
import { CEREMONIES, stageGames } from '../../project/ceremonies';
import { homeLibrary } from './homeLibrary';
import { libraryCards } from './homeLibraryCards';

vi.mock('./gameHealth', () => ({ catalogTarget: vi.fn() }));
vi.mock('./homeCards', () => ({}));
vi.mock('../core/ui', () => ({ h: (_tag: string, _attrs: unknown, textContent: string) => ({ textContent }) }));

it.each(['done', 'todo'] as const)('describes the selected level when %s has no matches', (filter) => {
  const lib = homeLibrary();
  const [first, second] = CEREMONIES.slice(0, 2).map((c) => stageGames(c)[0]);
  lib.catalog = [first, second].map((id) => ({ id, title: id, kind: 'gameware', path: id, gam: 'COURSE.GAM', original: {}, series: 'starter' }));
  const finished = new Set([filter === 'todo' ? first : second]);
  const actions = { choose: vi.fn(), more: vi.fn(), browse: vi.fn(), newGame: vi.fn() };
  const cards = libraryCards(lib, 'starter', 'all', actions, { level: 1, filter, finished });
  expect(cards.map((c) => c.textContent)).toEqual([
    (filter === 'done' ? 'No Starter in this level is done yet.' : 'Every Starter in this level is done.') + ' Pick All Starters under Show to see them all.',
  ]);
});
