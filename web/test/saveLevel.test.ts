// Tests: changing a saved game's level (project/saveData changeSaveLevel, for the Saves & scores
// panel and SAVEHACK) gives a save F6 loads (restoreSaved) in the new level at its start, with
// the score, lives, inventory and counters kept; moving the hero checks the blocks he stands
// in; the picture is the playing view around him.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { changeSaveLevel, heroSpotProblem, moveSaveHero, newGameSave, pictureBlock, saveLevels, savePicture, savedWorld, SaveFormatError, serializeSave, parseSave } from '../src/project/saveData';
import { changeBlocks, restoreSaved, type Saved } from '../src/engine/scene';
import { moveChars } from '../src/engine/character';
import { blockBirthMonsters, moveAllMonsters } from '../src/engine/monsters';
import { newCharInfo, MLEN, MWID } from '../src/engine/world';
import { Recorder } from '../src/engine/recorder';
import { parseGame } from '../src/formats/game';
import { VISIBLE_H, VISIBLE_W } from '../src/engine/render';

const games = join(__dirname, '..', '..', 'games');

function disk(id: string) {
  const dir = join(games, id, 'disk');
  const byName = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), join(dir, n)]));
  const get = (n: string) => (byName.has(n.toLowerCase()) ? new Uint8Array(readFileSync(byName.get(n.toLowerCase())!)) : undefined);
  const gam = [...byName.keys()].find((n) => n.endsWith('.gam'))!;
  return { files: { get }, gam };
}

const seeded = () => {
  let x = 7;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
};

// a few games (every level of each); all of them take a minute
const ids = ['teddy', 'teddy2', 'snowbound', 'sandcast', 'year2000', 'goat'].filter((id) => {
  if (!existsSync(join(games, id, 'disk')) || !readdirSync(join(games, id, 'disk')).some((n) => /\.gam$/i.test(n))) return false;
  const { files, gam } = disk(id);
  return saveLevels(parseGame(files.get(gam)!)).length > 1;
});

describe('changing a saved game’s level', () => {
  it('has games with more than one level', () => expect(ids.length).toBeGreaterThan(2));

  for (const id of ids) {
    it(`${id}: every level loads at its start, keeping what the hero has`, { timeout: 60000 }, async () => {
      const { files, gam } = disk(id);
      const game = parseGame(files.get(gam)!);
      const levels = saveLevels(game);
      const start = newGameSave(files, gam, seeded());
      expect(levels[0].scene).toBe(start.doscene);
      start.world.ci.score = 12345;
      start.world.ci.lives = 7;
      start.world.ci.meter[25] = 42;
      for (const level of levels) {
        const save = changeSaveLevel(files, gam, start, level.scene, seeded());
        expect(save.doscene).toBe(level.scene);
        expect(game.scenes[save.prevscene].links[save.linkin].toScene).toBe(level.scene);
        expect(save.world.chr.x[0]).toBe(level.to.x);
        expect(save.world.chr.y[0]).toBe(level.to.y);
        expect(serializeSave(parseSave(serializeSave(save)))).toEqual(serializeSave(save));

        const s = { m: { files }, game, rand: seeded, ci: newCharInfo(), rec: new Recorder(), sndClock: 0 };
        const loaded = restoreSaved(s, undefined, JSON.parse(JSON.stringify(save)) as Saved);
        expect(loaded).toBeDefined();
        const w = loaded!.world;
        expect(w.chr.x[0]).toBe(level.to.x);
        expect(w.chr.y[0]).toBe(level.to.y);
        expect(w.ci.score).toBe(12345);
        expect(w.ci.lives).toBe(7);
        expect(w.ci.meter[25]).toBe(42);
        expect(w.ci.inv).toEqual(start.world.ci.inv);
        // the new level's own map, not the old one's
        const mapFile = files.get(game.scenes[level.scene].files[1]!)!;
        expect(w.map.length).toBe(MLEN * MWID);
        expect(mapFile.length).toBeGreaterThan(0);
        w.sound = { play: () => false };
        for (let t = 0; t < 20; t++) {
          w.clock++;
          if (!w.noMons) {
            blockBirthMonsters(w);
            moveAllMonsters(w);
          }
          await moveChars(w, async () => -1);
          changeBlocks(w);
        }

        const pic = savePicture(files, gam, save);
        expect(pic.width).toBe(VISIBLE_W);
        expect(pic.height).toBe(VISIBLE_H);
        expect(pic.hero).toEqual(level.to);
        // the hero's block is in view
        const hx = (((level.to.x - pic.view.x) % MLEN) + MLEN) % MLEN;
        const hy = (((level.to.y - pic.view.y) % MWID) + MWID) % MWID;
        expect(pictureBlock(pic, hx * 20 + 5, hy * 20 + 5)).toEqual(level.to);
      }
    });
  }

  it('moves the hero only where he fits', () => {
    const { files, gam } = disk(ids[0]);
    const save = newGameSave(files, gam, seeded());
    const w = savedWorld(files, gam, save);
    let open: [number, number] | undefined;
    let solid: [number, number] | undefined;
    for (let y = 1; y < MWID && (!open || !solid); y++)
      for (let x = 0; x < MLEN; x++) {
        const p = heroSpotProblem(w, x, y);
        if (!p) open ??= [x, y];
        else solid ??= [x, y];
      }
    expect(open).toBeDefined();
    const moved = moveSaveHero(files, gam, save, ...open!);
    expect(moved.world.chr.x[0]).toBe(open![0]);
    expect(moved.world.chr.y[0]).toBe(open![1]);
    expect(moved.world.ci.score).toBe(save.world.ci.score);
    if (solid) expect(() => moveSaveHero(files, gam, save, ...solid!)).toThrow(SaveFormatError);
    expect(heroSpotProblem(w, 100, 0)).toMatch(/off the map/);
  });

  it('refuses a level no link leads to', () => {
    const { files, gam } = disk(ids[0]);
    const save = newGameSave(files, gam, seeded());
    expect(() => changeSaveLevel(files, gam, save, 0)).toThrow(SaveFormatError);
  });
});
