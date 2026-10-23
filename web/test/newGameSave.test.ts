// Tests: a new saved game made outside the game (project/saveData newGameSave, for SAVEHACK's and
// the Saves & scores panel's "New save") starts where Play starts, with the first level's
// character's hit points, lives, counters and inventory, and loads (F6's restoreSaved) and plays.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { newGameSave, parseSave, serializeSave, NEW_SAVE_NAME, SaveFormatError } from '../src/project/saveData';
import { changeBlocks, restoreSaved, type Saved } from '../src/engine/scene';
import { moveChars } from '../src/engine/character';
import { blockBirthMonsters, moveAllMonsters } from '../src/engine/monsters';
import { newCharInfo } from '../src/engine/world';
import { Recorder } from '../src/engine/recorder';
import { parseGame } from '../src/formats/game';
import { parseCharacter } from '../src/formats/character';

const games = join(__dirname, '..', '..', 'games');

/** A game's disk as a file source (any case), and its .gam. */
function disk(id: string) {
  const dir = join(games, id, 'disk');
  const byName = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), join(dir, n)]));
  const get = (n: string) => (byName.has(n.toLowerCase()) ? new Uint8Array(readFileSync(byName.get(n.toLowerCase())!)) : undefined);
  const gam = [...byName.keys()].find((n) => n.endsWith('.gam'))!;
  return { files: { get }, gam };
}

const ids = readdirSync(games).filter((id) => existsSync(join(games, id, 'disk')) && readdirSync(join(games, id, 'disk')).some((n) => /\.gam$/i.test(n)));
const seeded = () => {
  let x = 1;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};

describe('a new saved game', () => {
  it('has games to try', () => expect(ids.length).toBeGreaterThan(3));

  for (const id of ids) {
    it(`${id}: starts where Play starts, with the first level's character`, async () => {
      const { files, gam } = disk(id);
      const save = newGameSave(files, gam, seeded());
      const game = parseGame(files.get(gam)!);
      const link = game.scenes[0].links[0];
      expect(save.doscene).toBe(link.toScene);
      expect(save.prevscene).toBe(0);
      expect(save.linkin).toBe(0);
      expect(save.world.chr.x[0]).toBe(link.to.x);
      expect(save.world.chr.y[0]).toBe(link.to.y);
      const chr = parseCharacter(files.get(game.scenes[link.toScene].files[5]!)!);
      const ci = save.world.ci;
      expect(ci.score).toBe(0);
      expect(ci.hitpts).toBe(chr.meter[0]);
      expect(ci.lives).toBe(chr.meter[1]);
      expect(ci.inv).toEqual([...chr.inv.slice(0, ci.inv.length)]);
      // written as F5 writes it: parse and serialize give the same bytes
      const bytes = serializeSave(save);
      expect(serializeSave(parseSave(bytes))).toEqual(bytes);

      // F6: loads over the level, then plays a few seconds
      const s = { m: { files }, game, rand: seeded, ci: newCharInfo(), rec: new Recorder(), sndClock: 0 };
      const loaded = restoreSaved(s, undefined, save as unknown as Saved);
      expect(loaded).toBeDefined();
      const w = loaded!.world;
      expect(w.ci.hitpts).toBe(chr.meter[0]);
      w.sound = { play: () => false };
      for (let t = 0; t < 120; t++) {
        w.clock++;
        if (!w.noMons) {
          blockBirthMonsters(w);
          moveAllMonsters(w);
        }
        await moveChars(w, async () => -1);
        changeBlocks(w);
      }
      expect(w.ci.lives).toBeGreaterThanOrEqual(0);
    });
  }

  it('refuses a game with no start or no .gam', () => {
    expect(() => newGameSave({ get: () => undefined }, 'none.gam')).toThrow(SaveFormatError);
    expect(NEW_SAVE_NAME.length).toBeLessThanOrEqual(20);
  });
});
