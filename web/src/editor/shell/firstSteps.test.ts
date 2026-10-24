// First steps: each step ticks when the game changes the way it asks, the state stays in the
// companion file (never the game's files), and every step's guide link names a real section.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { newGame, emptyScene, serializeGame, ADVTYPE, parseGame } from '../../formats/game';
import { STEPS, beginFirstSteps, firstStepsState, fingerprint, notePlayed, stepsDone } from './firstSteps';
import { CHAPTERS } from '../../manual/ultimate/plan';

function starter(): Project {
  const game = newGame('Test');
  const lvl = emptyScene(ADVTYPE);
  lvl.desc = 'Level 1';
  lvl.files = ['test.pal', 'test.map', 'test.bbl', 'test.mon', 'test.mbl', 'test.chr', 'test.cbl', 'test.snd', '', '', ''];
  game.scenes.push(lvl);
  const files = new GameFiles([
    ['test.gam', serializeGame(game)],
    ...['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd'].map((k, i): [string, Uint8Array] => [`test.${k}`, Uint8Array.of(i, 1, 2)]),
  ]);
  const p = new Project('t', 'Test', 'test.gam', files);
  beginFirstSteps(p);
  return p;
}

const doneIds = (p: Project) => {
  const done = stepsDone(p, firstStepsState(p)!);
  return STEPS.filter((_, i) => done[i]).map((s) => s.id);
};

describe('First steps', () => {
  it('starts with nothing done, kept only in the companion file', () => {
    const p = starter();
    expect(doneIds(p)).toEqual([]);
    expect(p.files.names().some((n) => !/\.(gam|pal|map|bbl|mon|mbl|chr|cbl|snd)$/.test(n))).toBe(false);
    expect(Object.keys(firstStepsState(p)!.base).sort()).toEqual(p.files.names().sort());
  });

  it('ticks a step when its files change, and not before', () => {
    const p = starter();
    p.files.set('test.bbl', Uint8Array.of(9));
    expect(doneIds(p)).toEqual(['blocks']);
    p.files.set('test.cbl', Uint8Array.of(9));
    p.files.set('test.mon', Uint8Array.of(9));
    p.files.set('effect.voc', Uint8Array.of(9));
    expect(doneIds(p)).toEqual(['blocks', 'hero', 'monster', 'sound']);
    // putting a file back as it was unticks it
    p.files.set('test.bbl', Uint8Array.of(2, 1, 2));
    expect(doneIds(p)).not.toContain('blocks');
  });

  it('ticks playing, the Level check, a way to win and a won screen', () => {
    const p = starter();
    notePlayed(p);
    p.setExtras('test.map', 'levelCheck', { findings: [] });
    const g = parseGame(p.files.get('test.gam')!);
    g.scenes[2].links[0] = { toScene: 1, from: { x: 3, y: 4 }, to: { x: 0, y: 0 } };
    g.scenes[1].files[0] = 'won.txt';
    p.saveGame(g);
    expect(doneIds(p)).toEqual(['play', 'exit', 'check']);
    p.files.set('won.txt', Uint8Array.of(65));
    expect(doneIds(p)).toEqual(['play', 'exit', 'won', 'check']);
  });

  it('does nothing in a game without the checklist', () => {
    const p = new Project('u', 'U', 'u.gam', new GameFiles([['u.gam', serializeGame(newGame('U'))]]));
    notePlayed(p);
    expect(firstStepsState(p)).toBeUndefined();
  });

  it('fingerprints bytes', () => {
    expect(fingerprint(Uint8Array.of(1, 2, 3))).toBe(fingerprint(Uint8Array.of(1, 2, 3)));
    expect(fingerprint(Uint8Array.of(1, 2, 3))).not.toBe(fingerprint(Uint8Array.of(3, 2, 1)));
  });

  it('links each step to a chapter and section the guide has', () => {
    for (const s of STEPS) {
      if (!s.guide) continue;
      const c = CHAPTERS.find((x) => x.id === s.guide!.chapter);
      expect(c, s.id).toBeDefined();
      const heads = [c!.title, ...[...c!.html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1])];
      expect(heads, s.id).toContain(s.guide.section);
    }
  });
});
