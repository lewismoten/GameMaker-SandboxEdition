// Renders every song in games/remote/src/sound/song.ts through the web app's OPL2 emulator into
// WAV files and checks each (games/kit/songPreview.ts), then lists each song's sections from
// its CMF markers (controller 0x66, which PLAYGAME skips) with the time each starts.
//   cd web && npx vite-node ../games/remote/tools/songPreview.ts [outDir] [--loops N]
// To compare the title song's key and chroma with the recording's first chorus:
// python3 -I games/remote/tools/analyze.py --compare <outDir>/title.wav
import { listSections, previewSongs } from '../../kit/songPreview';
import { allSongs } from '../src/sound/song';

const songs = Object.entries(allSongs());
previewSongs('remote', songs);
listSections(songs);
