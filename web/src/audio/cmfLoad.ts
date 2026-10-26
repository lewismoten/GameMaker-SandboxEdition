// The song PLAYGAME's load_file (code/GM/SBMUSIC.C) hands the FM driver, or undefined for one
// it refuses. It reads the CMF header as Creative's CMFHDR (code/GM/SBCMUSIC.H), so inst_num
// is always a 16-bit int, whatever the file's version: a CMF 1.0 file keeps a one-byte count
// there, so the next byte (its first instrument's first byte) becomes the count's high byte,
// and load_file reads that many 16-byte records from inst_blk, running into the music and past
// the end of the file. It still reads the music from music_blk. Refused:
//  - a clock other than 146 ticks a second (HDRCLK),
//  - a record count whose inst_num * 16 overflows a 16-bit int to a negative size: farmalloc
//    gets a size over a megabyte and fails ("Not enough memory!").
import { CMF_GAMEMAKER_CLOCK, isCmf, parseCmf } from '../formats/cmf';

export interface LoadedSong {
  music: Uint8Array;
  /** The records load_file read; any past the end of the file are zeros here (DOS left whatever was in memory). */
  instruments: Uint8Array[];
}

export function loadSong(bytes: Uint8Array | undefined): LoadedSong | undefined {
  if (!bytes || !isCmf(bytes)) return undefined;
  const instNum = bytes[36] | (bytes[37] << 8);
  if ((instNum * 16) & 0x8000) return undefined;
  const cmf = parseCmf(bytes);
  if (cmf.clockTicks !== CMF_GAMEMAKER_CLOCK) return undefined;
  return { music: cmf.music, instruments: cmf.instruments };
}
