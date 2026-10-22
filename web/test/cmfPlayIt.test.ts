// Tests: The CMF player (audio/cmfPlayer.ts) and its trace (formats/cmfSong.ts traceMusic) end
// and repeat songs the way PlayIt() in code/GM/SBMUSIC.C did, and read delta times the way
// getpaws() did (no limit on their length).
import { describe, expect, it } from 'vitest';
import { CmfPlayer } from '../src/audio/cmfPlayer';
import { Opl2 } from '../src/audio/opl';
import { traceMusic } from '../src/formats/cmfSong';

/** Ticks the player and lists the ticks where channel 0's key turns on. */
function keyOns(music: number[], ticks: number): number[] {
  const opl = new Opl2(22050);
  const player = new CmfPlayer(opl);
  player.load(Uint8Array.from(music), [new Uint8Array(16)]);
  const out: number[] = [];
  let was = false;
  for (let t = 0; t < ticks; t++) {
    player.tick();
    const on = (opl.read(0xb0) & 0x20) !== 0;
    if (on && !was) out.push(t);
    was = on;
  }
  return out;
}

describe('PlayIt song end and repeat', () => {
  // lead-in 3, note on, 10 ticks, note off, a 6 byte delta of 5, end marker FF 2F 00
  const song = [0x03, 0x90, 0x3c, 0x7f, 0x0a, 0x80, 0x3c, 0x00, 0x80, 0x80, 0x80, 0x80, 0x80, 0x05, 0xff, 0x2f, 0x00];

  it('reads a delta time of any length (getpaws had no byte limit)', () => {
    expect(traceMusic(Uint8Array.from(song), 40)).toEqual(['0:on 0 60', '10:off 0 60', '15:restart', '18:on 0 60', '28:off 0 60', '33:restart', '36:on 0 60']);
    expect(keyOns(song, 40)).toEqual([0, 18, 36]);
  });

  it('repeats only at an end marker, waiting out the first delta (wait = getpaws() at offset 0)', () => {
    // No end marker: past the data the read gives 0xFF, which restarts like FF 2F does; the
    // restart then waits the 2 tick lead-in. (Restarting by position read the lead-in byte
    // as a note.)
    const truncated = [0x02, 0x90, 0x3c, 0x7f, 0x04];
    expect(traceMusic(Uint8Array.from(truncated), 12)).toEqual(['0:on 0 60', '4:restart', '6:on 0 60', '10:restart']);
    expect(keyOns(truncated, 12)).toEqual([0, 6]);
  });
});
