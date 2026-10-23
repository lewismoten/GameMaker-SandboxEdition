// Renders every song in games/sweats/src/sound/song.ts through the web app's OPL2 emulator into
// WAV files and checks each (games/kit/songPreview.ts), then lists each song's sections from
// its CMF markers (controller 0x66, which PLAYGAME skips) with the time each starts.
//   cd web && npx vite-node ../games/sweats/tools/songPreview.ts [outDir] [--loops N]
import { listSections, previewSongs } from '../../kit/songPreview';
import { buildSongs } from '../src/sound/song';

const songs = Object.entries(buildSongs());
previewSongs('sweats', songs);
listSections(songs);
