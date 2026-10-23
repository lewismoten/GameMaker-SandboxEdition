// Renders every song in games/mustard/src/sound/song.ts through the web app's OPL2 emulator into
// WAV files and checks each (games/kit/songPreview.ts).
//   cd web && npx vite-node ../games/mustard/tools/songPreview.ts [outDir] [--loops N]
// To compare the title song's key and chroma with the recording's first chorus:
// python3 -I games/mustard/tools/analyze.py --compare <outDir>/title.wav
import { previewSongs } from '../../kit/songPreview';
import { levelSongs, lostSong, storySong, titleSong, wholeSong, wonSong } from '../src/sound/song';

const levels = levelSongs();
previewSongs('mustard', [
  ['title', titleSong()],
  ['story', storySong()],
  ...levels.map((s, i) => [`level${i + 1}`, s] as [string, Uint8Array]),
  ['won', wonSong()],
  ['lost', lostSong()],
  ['menu', wholeSong()],
]);
