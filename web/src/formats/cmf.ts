// Creative Music File (.cmf): MIDI-like event stream plus SBI FM instrument definitions.
// GameMaker requires clock_ticks == 146 (one tick per 1/145.6 s timer interrupt).
import { Reader } from './binary';

export const CMF_GAMEMAKER_CLOCK = 146;

export interface CmfFile {
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
