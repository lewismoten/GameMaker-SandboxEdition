// Tests: Note velocity in the CMF player (audio/cmfPlayer.ts), following SBFMDRV's loudness formula.
import { describe, expect, it } from 'vitest';
import { CmfPlayer } from '../src/audio/cmfPlayer';
import { Opl2 } from '../src/audio/opl';

/** Plays one note on channel 0 with an instrument whose carrier level byte is `level`; returns the carrier's 0x40 register. */
function carrierAfterNote(velocity: number, level: number): number {
  const opl = new Opl2(44100);
  const player = new CmfPlayer(opl);
  const inst = new Uint8Array(16);
  inst[3] = level; // carrier: key scaling (top 2 bits) and total level
  player.load(new Uint8Array([0x00, 0x90, 60, velocity, 0x60, 0x80, 60, 0]), [inst]);
  player.tick();
  return opl.read(0x40 + 3); // channel 0's carrier is operator offset 3
}

describe('CMF velocity (SBFMDRV loudness)', () => {
  it('follows the driver formula for an instrument at full level', () => {
    expect(carrierAfterNote(1, 0) & 0x3f).toBe(32);
    expect(carrierAfterNote(32, 0) & 0x3f).toBe(24);
    expect(carrierAfterNote(64, 0) & 0x3f).toBe(16);
    expect(carrierAfterNote(96, 0) & 0x3f).toBe(8);
    expect(carrierAfterNote(127, 0) & 0x3f).toBe(1);
  });

  it('scales a quieter instrument and keeps its key-scaling bits', () => {
    // level 53 (TL 10): 63 - floor(255 * 53 / 256) = 11
    expect(carrierAfterNote(127, 0x80 | 10)).toBe(0x80 | 11);
  });
});
