// CMF 1.0 songs read the way PLAYGAME's load_file reads them (a 16-bit instrument count).
import { describe, expect, it } from 'vitest';
import { readSong, writeSong } from '../formats/cmfSong';
import { loadSong } from './cmfLoad';

const MUSIC = [0x00, 0x90, 0x3c, 0x40, 0x10, 0x80, 0x3c, 0x00, 0x00, 0xff, 0x2f, 0x00];

/** A small CMF 1.0 file: one-byte count (2) at 0x24, instruments from 0x25, then the music. */
function cmf10(firstByte: number, clock = 146): Uint8Array {
  const instBlk = 0x25;
  const musicBlk = instBlk + 2 * 16;
  const out = new Uint8Array(musicBlk + MUSIC.length);
  const dv = new DataView(out.buffer);
  out.set([0x43, 0x54, 0x4d, 0x46]);
  dv.setUint16(4, 0x0100, true);
  dv.setUint16(6, instBlk, true);
  dv.setUint16(8, musicBlk, true);
  dv.setUint16(10, 48, true);
  dv.setUint16(12, clock, true);
  out[20] = 1;
  out[0x24] = 2;
  for (let i = 0; i < 2; i++) out.fill(i === 0 ? firstByte : 0x21, instBlk + i * 16, instBlk + i * 16 + 16);
  out.set(MUSIC, musicBlk);
  return out;
}

describe('CMF 1.0 songs', () => {
  it('play the music block with the records DOS reads as instruments', () => {
    const bytes = cmf10(0x01); // the count reads as 0x0102: 258 records
    const song = loadSong(bytes)!;
    expect([...song.music]).toEqual(MUSIC);
    expect(song.instruments).toHaveLength(258);
    expect([...song.instruments[0]]).toEqual(new Array(16).fill(0x01));
    expect([...song.instruments[1]]).toEqual(new Array(16).fill(0x21));
    // the third record is the music itself, and the ones past the end of the file are empty
    expect([...song.instruments[2].subarray(0, MUSIC.length)]).toEqual(MUSIC);
    expect([...song.instruments[3]]).toEqual(new Array(16).fill(0));
  });

  it('are refused when the count times 16 overflows a 16-bit int (farmalloc fails)', () => {
    expect(loadSong(cmf10(0x08))).toBeUndefined(); // 0x0802 records: 32,800 bytes
    expect(loadSong(cmf10(0x07))).toBeDefined(); // 0x0702: 28,704 bytes
    expect(loadSong(cmf10(0x01, 96))).toBeUndefined(); // not Game-Maker's clock
  });

  it('open in the music editor with their notes', () => {
    const song = readSong(cmf10(0x01));
    expect(song.notes).toHaveLength(1);
    expect(song.notes[0].on).toMatchObject({ ch: 0, a: 0x3c, b: 0x40 });
    expect(song.instruments).toHaveLength(128);
    // saved, it plays the same: the same music and the same first 128 instruments
    const again = loadSong(writeSong(song))!;
    const before = loadSong(cmf10(0x01))!;
    expect([...again.music]).toEqual([...before.music]);
    expect(again.instruments.map((i) => [...i])).toEqual(before.instruments.slice(0, 128).map((i) => [...i]));
  });
});
