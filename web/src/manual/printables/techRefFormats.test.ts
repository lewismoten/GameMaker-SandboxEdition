// Checks the booklet's worked byte examples against supplied files and the port's independent codecs.
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
import { parseHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';

const root = resolve(import.meta.dirname, '../../../..');
const installed = (name: string) => new Uint8Array(readFileSync(resolve(root, 'runtime/run/GM', name)));
const tutor = (name: string) => installed(`TUTOR/${name}`);
const view = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe('Technical Reference worked examples', () => {
  it('follows a map through block records into palette indexes', () => {
    expect([...parsePalette(tutor('HUES.PAL')).slice(3, 6)]).toEqual([0, 0, 7]);
    const map = parseMap(tutor('TUTOR.MAP'));
    expect([map.blocks[505], map.mons[505]]).toEqual([0, 200]);
    expect(map.monsters[0]).toMatchObject({ monnum: 64, curx: -1, cury: -1 });
    const bbl = tutor('TUTOR.BBL');
    expect(bbl.length).toBe(63000);
    expect([bbl[4611], view(bbl).getInt16(4612, true), bbl[4614]]).toEqual([8, 2, 10]);
    expect(parseBlocks(bbl, 150)[10]).toMatchObject({ nextBl: 8, ntime: 2, touchBl: 10 });
    expect(tutor('PENGUIN.CBL').length).toBe(21000);
    expect([...parseBlocks(tutor('PENGUIN.CBL'), 50)[0].pixels.slice(0, 32)]).toEqual(new Array(32).fill(255));
    expect(tutor('PENGUIN.MBL').length).toBe(42000);
    expect(parseBlocks(tutor('PENGUIN.MBL'), 100)[0].pixels[19]).toBe(207);
  });

  it('decodes the nested hero and monster records at the printed offsets', () => {
    const bytes = tutor('PENGUIN.CHR');
    expect(bytes.length).toBe(7568);
    const chr = parseCharacter(bytes);
    expect(chr.sequences[0].frames[0]).toMatchObject({ x: 0, y: 0, orient: 0, pic1: 50, pic2: 8, pause: 7 });
    expect([bytes[172], bytes[174], view(bytes).getInt16(3724, true), view(bytes).getInt16(3726, true)]).toEqual([30, 150, 100, 2]);
    expect(chr.meter.slice(0, 2)).toEqual([100, 2]);
    const mon = parseMonsters(tutor('PENGUIN.MON'))[0];
    expect(mon).toMatchObject({ power: 180, thru: 0, activate: 0, end: 10, towards: -9 });
    expect(mon.pic[0]).toEqual([100, 5]);
  });

  it('resolves GAM name-pool pointers and scene links', () => {
    const bytes = tutor('TUTOR.GAM');
    expect(bytes.length).toBe(6263);
    expect(view(bytes).getUint16(5922, true)).toBe(339);
    expect(view(bytes).getUint16(828 + 45, true)).toBe(42);
    expect(new TextDecoder().decode(bytes.slice(5966, 5976))).toBe('tutor.map\0');
    const game = parseGame(bytes);
    expect(game.scenes).toHaveLength(20);
    expect(game.scenes[2].files[1]).toBe('tutor.map');
    expect(game.scenes[2].links[0]).toEqual({ toScene: 3, from: { x: 96, y: 11 }, to: { x: 90, y: 18 } });
  });

  it('joins SND effect names to VOC payloads and reads CMF block offsets', () => {
    const snd = parseSoundSet(tutor('SOUNDS1.SND'));
    expect(snd.freqs[0][0]).toBe(98);
    expect([snd.digital[0], snd.digital[1], snd.digital[5]]).toEqual(['exclnt', 'dead', 'bebeep']);
    // The supplied old set has no digital-name tail, matching both readers' empty-name behavior.
    expect(tutor('PENGUIN.SND').length).toBe(2160);
    expect(parseSoundSet(tutor('PENGUIN.SND')).digital.every((n) => n === '')).toBe(true);
    const bytes = tutor('DEAD.VOC');
    expect(bytes.length).toBe(9217);
    expect([...bytes.slice(26, 32)]).toEqual([1, 0xe2, 0x23, 0, 211, 0]);
    expect(bytes[9216]).toBe(0);
    const voc = decodeVoc(bytes);
    expect(voc.samples).toHaveLength(9184);
    expect(voc.sampleRate).toBe(22222);
    const cmfBytes = tutor('GMSONG1.CMF');
    const cmf = parseCmf(cmfBytes);
    expect([view(cmfBytes).getUint16(6, true), view(cmfBytes).getUint16(8, true)]).toEqual([40, 216]);
    expect([cmf.instruments.length, cmf.ticksPerBeat, cmf.clockTicks, cmf.music.length]).toEqual([11, 73, 146, 5736]);
  });

  it('reads the real short backdrop, slides, recording, scores and installation settings', () => {
    const bkd = installed('PEACH/PEACH.BKD');
    expect(bkd.length).toBe(13);
    expect(parseBackdrop(bkd)).toEqual({ x: 0, y: 0, gif: 'peach.gif' });
    expect(tutor('TUTOR.LST').length).toBe(48);
    expect(parseSlideList(tutor('TUTOR.LST'))[2]).toEqual({ name: 'backgrnd.fli', pause: 0 });
    expect(tutor('TUTOR.TXT').length).toBe(1607);
    expect([...tutor('TUTOR.TXT').slice(0, 3)]).toEqual([13, 10, 0x54]);
    const rec = parseRecording(tutor('DEMO.REC'));
    expect(rec).toHaveLength(512);
    expect(rec.slice(0, 2)).toEqual([
      { delta: 25, key: 0x4d },
      { delta: 13, key: 0xcd },
    ]);
    expect(parseHighScores(installed('SAMPLE/SAMPLE.HIS')).slice(0, 2)).toEqual([
      { score: 80, name: '' },
      { score: 65, name: 'GAS' },
    ]);
    expect(installed('GM.CFG').length).toBe(51);
    const cfg = installed('CONFIG.DAT');
    expect(cfg.length).toBe(500);
    expect([20, 22, 24, 26].map((o) => view(cfg).getUint16(o, true))).toEqual([13, 1, 7, 0x220]);
    const exe = new Uint8Array(readFileSync(resolve(root, 'cd/gm/xferplay.exe')));
    expect([exe.length, view(exe).getUint16(8, true), view(exe).getUint16(24, true)]).toEqual([160598, 512, 62]);
  });
});
