// The booklet's non-secret Sandbox examples, checked against bytes and independent engine codecs.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';

const root = resolve(import.meta.dirname, '../../../..');
const disk = (game: string, name: string) => new Uint8Array(readFileSync(resolve(root, 'games', game, 'disk', name)));
const teddy = (name: string) => disk('teddy', name);
const view = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe('Technical Reference Sandbox examples', () => {
  it('uses non-secret games and follows a cell into placements, pixels and properties', () => {
    for (const id of ['teddy', 'maximus']) {
      const about = JSON.parse(readFileSync(resolve(root, 'games', id, 'about.json'), 'utf8')) as { secret?: boolean };
      expect(about.secret).not.toBe(true);
    }
    expect([...parsePalette(teddy('park.pal')).slice(3, 6)]).toEqual([33, 33, 33]);
    const map = parseMap(teddy('park.map'));
    expect([map.blocks[505], map.mons[505]]).toEqual([0, 200]);
    expect(map.monsters[0]).toMatchObject({ monnum: 24, curx: 37, cury: 37 });
    const bbl = teddy('park.bbl');
    expect(bbl.length).toBe(63000);
    expect([bbl[4605], bbl[4611], view(bbl).getInt16(4612, true), bbl[4614]]).toEqual([15, 10, 0, 10]);
    expect(parseBlocks(bbl, 150)[10]).toMatchObject({ solid: 15, nextBl: 10, ntime: 0, touchBl: 10 });
    expect(teddy('teddy.cbl').length).toBe(21000);
    expect([...parseBlocks(teddy('teddy.cbl'), 50)[0].pixels.slice(0, 32)]).toEqual(new Array(32).fill(255));
    const mbl = teddy('park.mbl');
    expect(mbl.length).toBe(42000);
    expect(parseBlocks(mbl, 100)[0].pixels[0]).toBe(255);
    expect([...parseBlocks(mbl, 100)[1].pixels]).toEqual([...mbl.slice(420, 820)]);
  });

  it('keeps the printed real pixel grids tied to their game bytes', () => {
    const source = readFileSync(resolve(import.meta.dirname, 'techRefDiagrams.ts'), 'utf8');
    for (const [constant, file, start, length] of [
      ['GRID_PALETTE', 'park.pal', 0, 768],
      ['GRID_BLOCK', 'park.bbl', 4200, 400],
      ['GRID_HERO', 'teddy.cbl', 3360, 400],
      ['GRID_MONSTER', 'park.mbl', 0, 400],
    ] as const) {
      const printed = new RegExp(String.raw`const ${constant} =\s*'([0-9a-f]+)'`).exec(source)?.[1];
      expect(printed, constant).toBe(Buffer.from(teddy(file).slice(start, start + length)).toString('hex'));
    }
  });

  it('decodes the printed character and monster properties', () => {
    const bytes = teddy('teddy.chr');
    expect(bytes.length).toBe(7568);
    const chr = parseCharacter(bytes);
    expect(chr.sequences[0].frames[0]).toMatchObject({ x: 0, y: 0, orient: 0, pic1: 50, pic2: 8, pause: 36 });
    expect([bytes[172], bytes[174], view(bytes).getInt16(3724, true), view(bytes).getInt16(3726, true)]).toEqual([30, 150, 100, 3]);
    expect(chr.meter.slice(0, 2)).toEqual([100, 3]);
    const mon = parseMonsters(teddy('park.mon'))[0];
    expect(mon).toMatchObject({ power: 106, thru: 1, activate: 0, end: 9, towards: 9 });
    expect(mon.pic[0]).toEqual([0, 2]);
  });

  it('resolves GAM pool pointers and links at the printed offsets', () => {
    const bytes = teddy('teddy.gam');
    expect(bytes.length).toBe(3685);
    expect(view(bytes).getUint16(3092, true)).toBe(591);
    expect(view(bytes).getUint16(873, true)).toBe(173);
    expect(new TextDecoder().decode(bytes.slice(3267, 3280))).toBe('backyard.map\0');
    const game = parseGame(bytes);
    expect(game.scenes).toHaveLength(10);
    expect(game.scenes[2].files[1]).toBe('backyard.map');
    expect(game.scenes[2].links[0]).toEqual({ toScene: 3, from: { x: 77, y: 39 }, to: { x: 6, y: 39 } });
    expect(231 * 283).toBeLessThan(65536);
    expect(232 * 283).toBeGreaterThan(65536);
  });

  it('reads separate SND names, VOC payload and CMF instruments', () => {
    const snd = parseSoundSet(teddy('teddy.snd'));
    expect(snd.freqs[0][0]).toBe(523);
    expect(snd.digital.slice(0, 3)).toEqual(['yum', 'pop', 'crunch']);
    const bytes = teddy('woof.voc');
    expect(bytes.length).toBe(2459);
    expect([...bytes.slice(26, 32)]).toEqual([1, 0x7c, 9, 0, 165, 0]);
    expect(bytes[2458]).toBe(0);
    const voc = decodeVoc(bytes);
    expect(voc.samples).toHaveLength(2426);
    expect(voc.sampleRate).toBe(10989);
    const cmfBytes = teddy('park.cmf');
    const cmf = parseCmf(cmfBytes);
    expect([view(cmfBytes).getUint16(6, true), view(cmfBytes).getUint16(8, true)]).toEqual([40, 296]);
    expect([cmf.instruments.length, cmf.ticksPerBeat, cmf.clockTicks, cmf.music.length]).toEqual([16, 70, 146, 2380]);
  });

  it('reads a short Sandbox backdrop, text, slides and recorded key deltas', () => {
    const bkd = disk('maximus', 'w99.bkd');
    expect(bkd.length).toBe(14);
    expect(parseBackdrop(bkd)).toEqual({ x: 0, y: 3000, gif: 'cards5.gif' });
    expect(teddy('park.lst').length).toBe(13);
    expect(parseSlideList(teddy('park.lst'))).toEqual([{ name: 'park.gif', pause: 30 }]);
    expect(teddy('help.txt').length).toBe(1103);
    expect(new TextDecoder().decode(teddy('help.txt').slice(0, 6))).toBe('MOVING');
    const rec = parseRecording(teddy('demo.rec'));
    expect(rec).toHaveLength(58);
    expect(rec.slice(0, 2)).toEqual([
      { delta: 1, key: 0x4d },
      { delta: 30, key: 0x48 },
    ]);
  });
});
