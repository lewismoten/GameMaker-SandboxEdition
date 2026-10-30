// Audition timing follows native picture pauses and instantaneous birth commands, without real waits.
import { describe, expect, it } from 'vitest';
import { newGame, emptyScene, ADVTYPE, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { characterAuditions, auditionFrame, auditionEvents } from '../src/editor/widgets/characterAuditions';

function fixture() {
  const chr = newCharacter(),
    base = chr.sequences[0].frames[0];
  base.pause = 2;
  chr.sequences[0].frames[1] = { ...base, pic1: 3, pic2: 100, pause: 999 };
  chr.sequences[0].frames[2] = { ...base, pic1: 4, pic2: 5, pause: 3, x: 2 };
  chr.sequences[0].frames[3] = { ...base, pic1: 4, pic2: 100, pause: 999 };
  chr.sequences[5].frames[0] = { ...base, pic1: 3, pic2: 100, pause: 999 };
  chr.sequences[6].frames[0] = { ...base, pic1: 50, pic2: 50, pause: 0 };
  const blocks = newBlockSet('cbl');
  blocks[0].pixels.fill(2);
  blocks[1].pixels.fill(3);
  const mons = newMonsterSet();
  mons[3].used = 1;
  mons[3].pic[0] = [7, 2];
  const mbl = newBlockSet('mbl');
  mbl[7].pixels.fill(9);
  const game = newGame(),
    scene = emptyScene(ADVTYPE);
  scene.files[5] = 'hero.chr';
  scene.files[6] = 'hero.cbl';
  scene.files[3] = 'shots.mon';
  scene.files[4] = 'shots.mbl';
  game.scenes.push(scene);
  const bytes = serializeBlocks(blocks),
    files = new GameFiles([
      ['game.gam', serializeGame(game)],
      ['hero.chr', serializeCharacter(chr)],
      ['hero.cbl', bytes],
      ['shots.mon', serializeMonsters(mons)],
      ['shots.mbl', serializeBlocks(mbl)],
    ]);
  return { files, bytes };
}
describe('character audition clock', () => {
  it('uses native pauses and orders births before the following picture at a loop boundary', () => {
    const { files, bytes } = fixture(),
      before = [...files.entries()].map(([name, data]) => [name, Buffer.from(data).toString('hex')]);
    const set = characterAuditions(files, 'hero.cbl', bytes),
      sequence = set.sequences[0];
    expect(set.sequences.map((item) => item.sequence)).toEqual([0, 5, 6]);
    expect(sequence.ticks).toBe(5);
    expect(sequence.events.map((event) => event.tick)).toEqual([0, 2, 2, 5]);
    expect(auditionFrame(sequence, 1)!.pic1).toBe(0);
    expect(auditionFrame(sequence, 2)!.pic1).toBe(4);
    expect(auditionFrame(sequence, 5)!.pic1).toBe(0);
    expect(auditionEvents(sequence, 1, 2).map((event) => [event.frame.pic1, event.frame.pic2])).toEqual([
      [3, 100],
      [4, 5],
    ]);
    expect(auditionEvents(sequence, 4, 5).map((event) => [event.frame.pic1, event.frame.pic2])).toEqual([
      [4, 100],
      [0, 1],
    ]);
    expect(sequence.monsterBlocks![sequence.monsters![3].pic[0][0]].pixels[0]).toBe(9);
    expect([...files.entries()].map(([name, data]) => [name, Buffer.from(data).toString('hex')])).toEqual(before);
  });
  it('retains a previous pose for command-only sequences, but shows genuine blank frames', () => {
    const { files, bytes } = fixture(),
      set = characterAuditions(files, 'hero.cbl', bytes),
      commands = set.sequences[1],
      blank = set.sequences[2];
    expect(commands.ticks).toBe(1);
    expect(auditionFrame(commands, 0, set.pose)).toBe(set.pose);
    expect(auditionEvents(commands, -1, 1e6)).toHaveLength(128);
    expect(auditionFrame(blank, 0, set.pose)!.pic1).toBe(50);
    expect(blank.ticks).toBe(1);
    expect(auditionEvents(commands, 0, Infinity)).toEqual([]);
  });
  it('still previews character pictures when the monster companion is damaged', () => {
    const { files, bytes } = fixture();
    files.set('shots.mon', new Uint8Array(1));
    const set = characterAuditions(files, 'hero.cbl', bytes);
    expect(set.sequences[0].monsters?.some((monster) => monster.used)).toBe(false);
    expect(set.pose!.pic1).toBe(0);
    expect(set.blocks[0].pixels[0]).toBe(2);
  });
});
