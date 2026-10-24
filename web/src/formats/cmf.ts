// Creative Music File (.cmf): MIDI-like event stream plus SBI FM instrument definitions.
// GameMaker requires clock_ticks == 146 (one tick per 1/145.6 s timer interrupt).
import { Reader } from './binary';

export const CMF_GAMEMAKER_CLOCK = 146;

interface CmfFile {
  version: number;
  ticksPerBeat: number;
  /** Ticks per second the song was converted for. */
  clockTicks: number;
  channelUsed: Uint8Array;
  /** 16 byte SBI instrument records. */
  instruments: Uint8Array[];
  basicTempo: number;
  /** The event stream (music block to end of file). */
  music: Uint8Array;
}

export function isCmf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x43 && bytes[1] === 0x54 && bytes[2] === 0x4d && bytes[3] === 0x46;
}

export function parseCmf(bytes: Uint8Array): CmfFile {
  if (!isCmf(bytes)) throw new Error('Not a CMF file');
  const r = new Reader(bytes, 4);
  const version = r.u16();
  const instBlk = r.u16();
  const musicBlk = r.u16();
  const ticksPerBeat = r.u16();
  const clockTicks = r.u16();
  r.skip(6); // title, composer, remark offsets
  const channelUsed = r.bytesOf(16);
  const instNum = r.u16();
  const basicTempo = r.u16();
  const instruments: Uint8Array[] = [];
  for (let i = 0; i < instNum; i++) instruments.push(new Reader(bytes, instBlk + i * 16).bytesOf(16));
  return { version, ticksPerBeat, clockTicks, channelUsed, instruments, basicTempo, music: bytes.subarray(musicBlk) };
}

/** One event of a song: when (in ticks from the start) and its MIDI bytes. */
export interface CmfEvent {
  tick: number;
  data: number[];
}

export interface CmfSong {
  /** 16-byte SBI FM instruments; instrument n starts on MIDI channel n. */
  instruments: Uint8Array[];
  events: CmfEvent[];
  ticksPerBeat?: number;
  basicTempo?: number;
}

function varLen(n: number): number[] {
  const out = [n & 0x7f];
  for (n >>>= 7; n > 0; n >>>= 7) out.unshift((n & 0x7f) | 0x80);
  return out;
}

/**
 * Writes a Creative Music File at Game-Maker's 146 ticks a second (PLAYGAME refuses any
 * other clock). Events are sorted by tick; the song ends with an end-of-track marker.
 */
export function encodeCmf(song: CmfSong): Uint8Array {
  const HEADER = 40;
  const instruments = song.instruments.slice(0, 128);
  const used = new Uint8Array(16);
  const music: number[] = [];
  let last = 0;
  for (const e of [...song.events].sort((a, b) => a.tick - b.tick)) {
    const tick = Math.max(last, Math.round(e.tick));
    music.push(...varLen(tick - last), ...e.data);
    last = tick;
    const status = e.data[0];
    if (status >= 0x80 && status < 0xf0) used[status & 0x0f] = 1;
  }
  music.push(0, 0xff, 0x2f, 0x00);
  const instBlk = HEADER;
  const musicBlk = instBlk + instruments.length * 16;
  const out = new Uint8Array(musicBlk + music.length);
  const dv = new DataView(out.buffer);
  out.set([0x43, 0x54, 0x4d, 0x46]); // CTMF
  dv.setUint16(4, 0x0101, true);
  dv.setUint16(6, instBlk, true);
  dv.setUint16(8, musicBlk, true);
  dv.setUint16(10, song.ticksPerBeat ?? 48, true);
  dv.setUint16(12, CMF_GAMEMAKER_CLOCK, true);
  out.set(used, 20);
  dv.setUint16(36, instruments.length, true);
  dv.setUint16(38, song.basicTempo ?? 0x1e8, true);
  instruments.forEach((inst, i) => out.set(inst.subarray(0, 16), instBlk + i * 16));
  out.set(music, musicBlk);
  return out;
}
