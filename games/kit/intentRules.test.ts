import { describe, expect, it } from 'vitest';
import { EventLog } from '@lewismoten/gamemaker-sandbox-tools/kit/eventLog';
import { checkLog, parseIntent, winnableWithout, type LevelIntent } from './intentRules';

const level = (rules: LevelIntent['rules']): LevelIntent => ({ scene: 2, teaches: 'a lesson', rules });
const sim = (scene = 2) => ({ scene, ci: { score: 0 } });

describe('parseIntent', () => {
  it('reads the three rules', () => {
    const i = parseIntent({
      levels: [
        {
          scene: 2,
          teaches: 'x',
          rules: [
            { rule: 'before', a: 'score:25', b: 'leave' },
            { rule: 'uses', move: 'Enter', min: 3 },
            { rule: 'needs', move: 'Up', strict: true },
          ],
        },
      ],
    });
    expect(i.levels[0].rules).toHaveLength(3);
  });
  it.each([
    [{}, 'levels: expected a list'],
    [{ levels: [{ scene: 'a', teaches: 'x', rules: [] }] }, 'levels[0].scene'],
    [{ levels: [{ scene: 1, teaches: '', rules: [] }] }, 'levels[0].teaches'],
    [{ levels: [{ scene: 1, teaches: 'x', rules: [{ rule: 'uses', move: 'Banana', min: 1 }] }] }, 'rules[0].move: "Banana" is not a key name'],
    [{ levels: [{ scene: 1, teaches: 'x', rules: [{ rule: 'uses', move: 'Up', min: 0 }] }] }, 'rules[0].min'],
    [{ levels: [{ scene: 1, teaches: 'x', rules: [{ rule: 'before', a: 'nope', b: 'leave' }] }] }, 'rules[0].a: "nope" is not an event'],
    [{ levels: [{ scene: 1, teaches: 'x', rules: [{ rule: 'sees' }] }] }, '"sees" is not a rule'],
    [{ levels: [{ scene: 1, teaches: 'x', rules: [{ rule: 'needs', move: 'Up', strict: 'yes' }] }] }, 'strict'],
  ])('rejects %j with a clear error', (raw, text) => {
    expect(() => parseIntent(raw, 'g/intent.json')).toThrow(text);
    expect(() => parseIntent(raw, 'g/intent.json')).toThrow('g/intent.json');
  });
});

describe('checkLog', () => {
  it('uses: finds too few presses, passes enough', () => {
    const log = new EventLog(sim());
    log.key(0x1c, true);
    log.key(0x1c, false);
    log.key(0x1c, true);
    expect(checkLog(level([{ rule: 'uses', move: 'Enter', min: 3 }]), log)[0].text).toContain('pressed it 2');
    expect(checkLog(level([{ rule: 'uses', move: 'Enter', min: 2 }]), log)).toEqual([]);
  });
  it('uses: counts only the level in scene', () => {
    const other = new EventLog(sim(3));
    other.key(0x1c, true);
    expect(checkLog(level([{ rule: 'uses', move: 'Enter', min: 1 }]), other)).toHaveLength(1);
  });
  it('before: passes in order, flags a missing A or a wrong order', () => {
    const s = sim();
    const ok = new EventLog(s);
    s.ci.score = 25;
    ok.tick(0, 2, undefined);
    s.scene = 3;
    ok.tick(25, 2, 'link');
    const rule = [{ rule: 'before', a: 'score:25', b: 'leave' } as const];
    expect(checkLog(level(rule), ok)).toEqual([]);
    const s2 = sim();
    const late = new EventLog(s2);
    s2.scene = 3;
    late.tick(0, 2, 'link');
    s2.scene = 3;
    s2.ci.score = 25;
    late.tick(0, 3, undefined);
    expect(checkLog(level(rule), late)[0].text).toContain('never did first');
  });
  it('carries strict into the finding', () => {
    const log = new EventLog(sim());
    const f = checkLog(level([{ rule: 'uses', move: 'Up', min: 1, strict: true }]), log);
    expect(f[0].strict).toBe(true);
  });
});

describe('winnableWithout', () => {
  it('says what the bot saw and that the author can dismiss it', () => {
    const f = winnableWithout(level([]), { rule: 'needs', move: 'Enter' });
    expect(f.text).toContain('winnable without Enter');
    expect(f.text).toContain('remove the rule');
    expect(f.strict).toBe(false);
  });
});
