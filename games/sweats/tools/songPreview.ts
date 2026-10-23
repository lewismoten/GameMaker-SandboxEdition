// Renders every song in games/sweats/src/sound/song.ts through the web app's OPL2 emulator into
// WAV files and checks each (games/kit/songPreview.ts), then lists each song's sections from
// its CMF markers (controller 0x66, which PLAYGAME skips) with the time each starts.
//   cd web && npx vite-node ../games/sweats/tools/songPreview.ts [outDir] [--loops N]
import { TICK_RATE } from '../../../web/src/audio/cmfPlayer';
import { parseCmf } from '../../../web/src/formats/cmf';
import { previewSongs } from '../../kit/songPreview';
import { buildSongs } from '../src/sound/song';

const songs = Object.entries(buildSongs());
previewSongs('sweats', songs);
for (const [name, bytes] of songs) {
  const cmf = parseCmf(bytes);
  const m = cmf.music;
  const marks: string[] = [];
  let p = 0;
  let tick = 0;
  let programs = 0;
  while (p < m.length) {
    let v = 0;
    let c: number;
    do {
      c = m[p++];
      v = (v << 7) | (c & 0x7f);
    } while (c & 0x80);
    tick += v;
    const s = m[p];
    if (s === 0xff) break;
    if ((s & 0xf0) === 0xc0) programs++;
    if (s === 0xb0 && m[p + 1] === 0x66) marks.push(`${m[p + 2]}@${(tick / TICK_RATE).toFixed(1)}s`);
    p += (s & 0xf0) === 0xc0 ? 2 : 3;
  }
  console.log(`${name.padEnd(8)} ${cmf.instruments.length} instruments, ${programs} program changes, sections ${marks.join(' ')}`);
}
