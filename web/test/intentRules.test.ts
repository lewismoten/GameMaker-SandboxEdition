import { fileURLToPath } from 'node:url';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import movesIntent from '../../games/kit-moves/intent.json';
import duckIntent from '../../games/duck/intent.json';
import { ORIGIN } from '../../games/kit/starter/map';
import { SCAN } from '../../games/kit/starter/ids';
import { describe, expect, it } from 'vitest';
import { EventLog, scanOf } from '@lewismoten/gamemaker-sandbox-tools/kit/eventLog';
import { checkLog, parseIntent, winnableWithout, type LevelIntent } from '../../games/kit/intentRules';

const level = (rules: LevelIntent['rules']): LevelIntent => ({ scene: 2, teaches: 'a lesson', rules });
const sim = (scene = 2) => ({ scene, ci: { score: 0 } }) as never as { scene: number; ci: { score: number } } & ConstructorParameters<typeof EventLog>[0];

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
  it('before: passes in order, flags a score missing from the scene', () => {
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
    s2.ci.score = 25;
    late.tick(0, 3, undefined);
    expect(checkLog(level(rule), late)[0].text).toContain('never did first');
  });
  it('before: flags reversed events in scene 2', () => {
    const s = sim();
    const log = new EventLog(s);
    log.key(0x1c, true);
    s.ci.score = 25;
    log.tick(0, 2, undefined);
    const findings = checkLog(level([{ rule: 'before', a: 'score:25', b: 'key:Enter' }]), log);
    expect(findings.map((finding) => finding.text)).toEqual([expect.stringContaining("key:Enter came before score:25 on the bot's route")]);
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

describe('Starter move lessons on disk', () => {
  const lessons = [
    { id: 'kit-moves', intent: movesIntent, scene: 2, move: 'Up', x: 28, y: 20 },
    { id: 'kit-moves', intent: movesIntent, scene: 3, move: 'Enter', x: 16, y: 10 },
    { id: 'duck', intent: duckIntent, scene: 2, move: 'Down', x: 50, y: 10 },
  ] as const;

  it.each(lessons)('$id scene $scene requires $move before the exit and blocks repeated hops', async ({ id, intent, scene, move, x, y }) => {
    const lesson = parseIntent(intent).levels.find((l) => l.scene === scene)!;
    const requirement = { rule: 'before', a: `key:${move}`, b: 'leave', strict: true };
    expect(lesson.rules).toContainEqual(requirement);
    expect(lesson.rules).toContainEqual({ rule: 'needs', move, strict: true });
    const state = sim(scene);
    const log = new EventLog(state);
    state.scene = 1;
    log.tick(0, scene, 'link');
    expect(checkLog(lesson, log).map((f) => f.rule)).toContainEqual(requirement);

    // Start both attempts at the obstacle, even if a banned-key explorer stalls in an earlier scene.
    const files = readDisk(fileURLToPath(new URL(`../../games/${id}/disk/`, import.meta.url)));
    const name = [...files.keys()].find((n) => n.endsWith('.gam'))!;
    const game = parseGame(files.get(name)!);
    game.scenes[0].links[0] = { ...game.scenes[0].links[0], toScene: scene, to: { x: ORIGIN + x, y: ORIGIN + y } };
    files.set(name, serializeGame(game));
    const attempt = async (taught: boolean) => {
      const run = new GameSim(files);
      run.press(SCAN.right);
      const key = taught ? scanOf(move)! : SCAN.space;
      let crossed = false;
      for (let t = 0; t < 150; t++) {
        const pulse = !taught || move === 'Enter';
        if (t === 0 || (pulse && t % 8 === 0)) run.press(key);
        else if (pulse && t % 8 === 2) run.release(key);
        const result = await run.tick();
        // Lift above the cliff, dash out of the tunnel, or crouch past the awning.
        crossed = move === 'Up' ? run.pos.y < ORIGIN + 5 : run.pos.x >= ORIGIN + (move === 'Down' ? 52 : 19);
        if (crossed || result) break;
      }
      return crossed;
    };
    expect(await attempt(false)).toBe(false);
    expect(await attempt(true)).toBe(true);
  });
});
