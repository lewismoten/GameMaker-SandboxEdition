// Node-only regressions for tour-check prerequisites and the whole-tour step budget.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/tour/chapters';
import { checkedSteps, missingTourInputs } from './tourCheckInputs';

const roots: string[] = [];
function fixture(): { root: string; put: (path: string, data?: string) => void } {
  const root = mkdtempSync(join(tmpdir(), 'tour-inputs-'));
  roots.push(root);
  mkdirSync(join(root, 'games'));
  const put = (path: string, data = 'fixture') => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), data);
  };
  put('web/public/cast/sprites.json', '{}');
  return { root, put };
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('tour prerequisites', () => {
  it('reports missing and empty public disks with a preparation command, ignoring secret disks', () => {
    const { root, put } = fixture();
    for (const id of ['public', 'empty', 'hidden']) {
      put(`games/${id}/about.json`, JSON.stringify({ secret: id === 'hidden' }));
      put(`games/${id}/build.ts`);
    }
    put('games/empty/disk/empty.gam', '');
    const missing = missingTourInputs(root, []);
    expect(missing).toHaveLength(2);
    expect(missing.join('\n')).toContain(
      'missing prerequisite: games/public/disk/*.gam (run from root: npm run heavy -- npm run build:games -- --game public)',
    );
    expect(missing.join('\n')).not.toContain('hidden');
    put('games/public/disk/PUBLIC.GAM');
    put('games/empty/disk/empty.gam');
    expect(missingTourInputs(root, [])).toEqual([]);
  });

  it('checks chapter entry and go files, but needs no muted voice clips, dist or offline manifest', () => {
    const { root, put } = fixture();
    const chapter = CHAPTERS.find((c) => c.id === 'edit-animation')!;
    const missing = missingTourInputs(root, [chapter]);
    expect(missing).toHaveLength(3);
    for (const name of ['intro.fli', 'blender.gif', 'blender.lst']) {
      expect(missing.join('\n')).toContain(`games/logic/disk/${name}`);
      put(`games/logic/disk/${name}`);
    }
    expect(missingTourInputs(root, [chapter])).toEqual([]);
    put('web/public/cast/sprites.json', '');
    expect(missingTourInputs(root, [chapter])[0]).toContain('scripts/castSprites.ts');
  });
});

it('budgets the whole tour beyond 120 steps and excludes only the pageOnly steps of multi-chapter runs', () => {
  const steps = checkedSteps(CHAPTERS);
  expect(steps.length).toBeGreaterThan(120);
  expect(steps.some((s) => s.pageOnly)).toBe(false);
  const home = CHAPTERS.filter((c) => c.id === 'home');
  expect(checkedSteps(home)).toEqual(home[0].steps);
  expect(checkedSteps(home).some((s) => s.pageOnly)).toBe(true);
});
