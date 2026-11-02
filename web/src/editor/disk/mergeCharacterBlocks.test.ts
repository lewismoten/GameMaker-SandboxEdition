import { describe, expect, it } from 'vitest';
import { newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newCharacter, parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { planDisk } from './plan';

/** Two scenes, one palette, a character each with its own character block set whose first two blocks differ. */
function twoCharacters(shareChr = false): GameFiles {
  const f = new GameFiles();
  const p = new Uint8Array(768);
  for (let i = 0; i < 256; i++) p.fill(i & 63, i * 3, i * 3 + 3);
  p[3] = 7;
  f.set('p.pal', serializePalette(p));
  const game = newGame('T');
  for (const k of ['a', 'b']) {
    const cbl = newBlockSet('cbl');
    cbl[0] = { ...cbl[0], pixels: new Uint8Array(400).fill(k === 'a' ? 10 : 20) };
    cbl[1] = { ...cbl[1], pixels: new Uint8Array(400).fill(k === 'a' ? 11 : 21) };
    f.set(`${k}.cbl`, serializeBlocks(cbl));
    f.set(`${k}.chr`, serializeCharacter(newCharacter()));
    const s = emptyScene(ADVTYPE);
    s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    s.files = ['p.pal', '', '', '', '', shareChr ? 'a.chr' : `${k}.chr`, `${k}.cbl`, '', '', '', '', ...new Array(9).fill('')];
    game.scenes.push(s);
  }
  f.set('t.gam', serializeGame(game));
  return f;
}

describe('character block merge', () => {
  it('moves the second set into free slots and renumbers its character frames', () => {
    const f = twoCharacters();
    const plan = planDisk(f, 't.gam');
    const step = plan.steps.find((s) => s.kind === 'cbl');
    expect(step).toBeDefined();
    step!.apply(f, 't.gam');
    expect(f.get('b.cbl')).toBeUndefined();
    const idle = parseCharacter(f.get('b.chr')!).sequences[0].frames[0];
    expect([idle.pic1, idle.pic2]).toEqual([2, 3]);
    const blocks = parseBlocks(f.get('a.cbl')!.subarray(0, 50 * 420), 50);
    expect(blocks[2].pixels[0]).toBe(20);
    expect(parseGame(f.get('t.gam')!).scenes.at(-1)!.files.slice(0, 7)).toEqual(['p.pal', '', '', '', '', 'b.chr', 'a.cbl']);
  });

  it('leaves the sets apart when one character file is used with both', () => {
    const step = planDisk(twoCharacters(true), 't.gam').steps.find((s) => s.kind === 'cbl');
    expect(step).toBeUndefined();
  });
});
