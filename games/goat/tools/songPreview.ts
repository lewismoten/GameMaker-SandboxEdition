// Renders every song in games/goat/src/sound/song.ts through the web app's OPL2 emulator into
// WAV files and checks each (games/kit/songPreview.ts).
//   cd web && npx vite-node ../games/goat/tools/songPreview.ts [outDir] [--loops N]
// To compare the title song's key and chroma with the recording's chorus:
// python3 -I games/goat/tools/analyze.py --compare <outDir>/title.wav
import { previewSongs } from '../../kit/songPreview';
import { creditsSong, levelSongs, lostSong, menuSong, storySong, titleSong, wonSong } from '../src/sound/song';

const levels = levelSongs();
previewSongs('goat', [
  ['title', titleSong()],
  ['menu', menuSong()],
  ['story', storySong()],
  ...levels.map((s, i) => [`level${i + 1}`, s] as [string, Uint8Array]),
  ['won', wonSong()],
  ['lost', lostSong()],
  ['credits', creditsSong()],
]);
