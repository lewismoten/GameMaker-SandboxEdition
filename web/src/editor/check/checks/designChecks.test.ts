// The level check's design checks from the research on how players meet Game-Maker games, on
// the tiny game in testGame.ts: shots that destroy prizes, key habits, the front screens' words,
// doors that lead nowhere, levels with no way out or no music, flashing, and the stakes.
import { describe, expect, it } from 'vitest';
import { textBytes } from '../../../formats/binary';
import { MONBL } from '../../../formats/blocks';
import { encodeCmf } from '../../../formats/cmf';
import { serializeGame } from '../../../formats/game';
import { emptyMonster } from '../../../formats/monster';
import { parseCharacter, serializeCharacter } from '../../../formats/character';
import { GameFiles } from '../../../project/files';
import { scenesOf, type SceneData } from '../sceneData';
import { testGame, type TestGame } from '../testGame';
import { flashing } from './flashing';
import { changingKeys, keyHabits } from './keyHabits';
import { fakeExits, music, noWayOut } from './levelExits';
import { screenText } from './screenText';
import { shotPrize } from './shotPrize';
import { stakes } from './stakes';

const ROWS = ['##########', '#........#', '#E.S.....#', '##########'];
const sceneOf = (t: TestGame) => scenesOf(t.game, t)[0];

/** Gives the hero a Space key that fires monster 0 (power `power`), standing still for `ticks`. */
function armed(d: SceneData, power: number, ticks = 2, norepeat = 1): void {
  const s = d.chr.sequences[9];
  s.key = 57 << 8;
  s.norepeat = norepeat;
  s.frames[0] = { x: 0, y: 0, orient: 0, pic1: 0, pic2: MONBL, pause: ticks, extra: new Uint8Array(5) };
  s.frames[1] = { ...s.frames[1], pic2: 51 };
  d.mon[0] = { ...emptyMonster(), power };
}

/** Places monster `n` at (x, y), drawn with monster block `pic`. */
function place(d: SceneData, n: number, pic: number, x: number, y: number): void {
  d.mon[n] = { ...emptyMonster(), power: 50 };
  d.mon[n].pic[0] = [pic, 5];
  d.map.monsters[n] = { ...d.map.monsters[n], monnum: n, curx: x, cury: y };
}

describe('shots that destroy prizes', () => {
  it('finds a weaker prize monster, a warning when it counts toward a gate', () => {
    const d = sceneOf(testGame(ROWS));
    armed(d, 120);
    place(d, 1, 1, 5, 2);
    d.mbl[1].scorePts = 50;
    place(d, 2, 2, 6, 2);
    Object.assign(d.mbl[2], { effect: 20, eamt: 1 });
    expect(shotPrize(d).map((f) => [f.severity, f.where.monster?.n])).toEqual([
      ['info', 1],
      ['warning', 2],
    ]);
    // a prize as strong as the shot is passed through
    d.mon[2].power = 120;
    d.mon[1].power = 130;
    expect(shotPrize(d)).toEqual([]);
  });
});

describe('key habits', () => {
  it('finds a held fire key that roots the hero, and the same weapon with ammunition per key', () => {
    const d = sceneOf(testGame(ROWS));
    armed(d, 120, 20, 0);
    expect(keyHabits(d).map((f) => [f.check, f.severity])).toEqual([['response', 'warning']]);
    // a second key firing the same shot, both with limited uses
    d.chr.sequences[10] = { ...d.chr.sequences[9], key: 45 << 8 };
    d.chr.sequences[9].frames[0].pause = 1;
    d.chr.sequences[10].frames[0] = { ...d.chr.sequences[10].frames[0], pause: 1 };
    d.chr.meter[9] = 5;
    d.chr.meter[10] = 5;
    expect(keyHabits(d).map((f) => f.title)).toEqual(['Monster 0 is fired by Space, X, each with uses of its own']);
  });

  it('finds a key whose job changes between levels', () => {
    const t = testGame(ROWS);
    expect(changingKeys(new GameFiles(t.files))).toEqual([]);
    // a second level whose character fires with the right arrow
    const chr = parseCharacter(t.files.get('test.chr')!);
    chr.sequences[5].frames[0] = { ...chr.sequences[5].frames[0], pic2: MONBL, pic1: 0 };
    t.files.set('other.chr', serializeCharacter(chr));
    const first = t.game.scenes[2];
    t.game.scenes.push({ ...first, desc: 'Second', files: first.files.map((f, i) => (i === 5 ? 'other.chr' : f)) });
    t.files.set('test.gam', serializeGame(t.game));
    expect(changingKeys(new GameFiles(t.files)).map((f) => f.title)).toEqual([expect.stringMatching(/^Right .* moves in Level, but fires in Second$/)]);
  });
});

describe('the front screens’ words', () => {
  const withHelp = (text: string) => {
    const t = testGame(ROWS);
    t.game.scenes[0].files[6] = 'help.txt';
    t.files.set('test.gam', serializeGame(t.game));
    t.files.set('help.txt', textBytes(text));
    return t;
  };

  it('notes help past three pages, and suggests a cut at six', () => {
    const long = (pages: number) => screenText(withHelp('A line.\r\n'.repeat(16 * pages)).game, withHelp('A line.\r\n'.repeat(16 * pages)));
    expect(long(3)).toEqual([]);
    expect(long(4).map((f) => [f.check, f.severity])).toEqual([['help-length', 'info']]);
    expect(long(6).map((f) => [f.severity, f.title])).toEqual([['warning', 'The instructions run to 6 pages']]);
  });

  it('finds a page left as a placeholder', () => {
    const t = withHelp('HOW TO PLAY\r\nPending.\r\n');
    expect(screenText(t.game, t).map((f) => f.title)).toEqual(['The instructions say “Pending”']);
  });
});

describe('exits, music and flashing', () => {
  it('finds a door drawn where no link is', () => {
    const t = testGame(['##########', '#........#', '#E.S...E.#', '##########']);
    const d = sceneOf(t);
    d.map.blocks[2 * 100 + 1] = 30;
    d.map.blocks[2 * 100 + 7] = 30;
    d.bbl[30].pixels.fill(6);
    // the link is the last exit drawn, at (7, 2); the first is only drawn
    expect(fakeExits(d).map((f) => f.where.cells)).toEqual([[201]]);
  });

  it('finds a level with no link out', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].links[0] = { ...t.game.scenes[2].links[0], toScene: 0xffff };
    expect(noWayOut(scenesOf(t.game, t)[0], t.game).map((f) => f.severity)).toEqual(['error']);
  });

  it('notes a level with no song, and warns of a song DOS won’t play', () => {
    const t = testGame(ROWS);
    const d = sceneOf(t);
    expect(music(d, t.game, t).map((f) => f.severity)).toEqual(['info']);
    const song = encodeCmf({ instruments: [], events: [] });
    song[12] = 96;
    song[13] = 0;
    t.files.set('song.cmf', song);
    t.game.scenes[2].files[8] = 'song.cmf';
    expect(music(d, t.game, t).map((f) => f.title)).toEqual(['song.cmf runs at 96 ticks a second, so PLAYGAME won’t play it']);
  });

  it('finds a field of blocks flashing light and dark fast', () => {
    const t = testGame(ROWS);
    const d = sceneOf(t);
    Object.assign(d.bbl[40], { nextBl: 41, ntime: 2 });
    Object.assign(d.bbl[41], { nextBl: 40, ntime: 2 });
    d.bbl[40].pixels.fill(0);
    d.bbl[41].pixels.fill(15);
    d.palette.set([63, 63, 63], 15 * 3);
    for (let y = 10; y < 20; y++) for (let x = 10; x < 26; x++) d.map.blocks[y * 100 + x] = 40;
    expect(flashing(d).map((f) => f.check)).toEqual(['flashing']);
    // slowed down, it is fine
    d.bbl[40].ntime = d.bbl[41].ntime = 8;
    expect(flashing(d)).toEqual([]);
  });
});

describe('the stakes', () => {
  it('suggests fewer than ten lives, and notes an unarmed hero among enemies', () => {
    const t = testGame(ROWS);
    const all = scenesOf(t.game, t);
    all[0].chr.meter[1] = 20;
    place(all[0], 1, 1, 5, 2);
    place(all[0], 2, 1, 6, 2);
    all[0].mbl[1].chHitPt = -10;
    expect(stakes(t.game, all).map((f) => [f.check, f.title])).toEqual([
      ['stakes', 'The hero starts with 20 lives'],
      ['start-threat', 'The hero starts with nothing to fire, and 2 enemies are on the first screen'],
    ]);
  });
});
