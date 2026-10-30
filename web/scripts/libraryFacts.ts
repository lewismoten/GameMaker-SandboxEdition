// Compact asset metadata lets pickers deduplicate palettes and group sounds without downloading games.
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { classifySound, type SoundGroup } from '../src/audio/soundProfile';

export interface LibraryFileFact {
  paletteHash?: string;
  /** Canonical VGA bytes for previews that need no archive download. */
  paletteData?: string;
  soundGroup?: SoundGroup;
}
const cache = new Map<string, { size: number; modified: number; fact: LibraryFileFact }>();

export function libraryFacts(files: ReadonlyMap<string, string>): Record<string, LibraryFileFact> {
  const out: Record<string, LibraryFileFact> = {};
  for (const [name, path] of files) {
    if (!/\.(pal|voc)$/i.test(name)) continue;
    const stat = statSync(path);
    let entry = cache.get(path);
    if (!entry || entry.size !== stat.size || entry.modified !== stat.mtimeMs) {
      const fact: LibraryFileFact = {};
      try {
        const bytes = new Uint8Array(readFileSync(path));
        if (/\.pal$/i.test(name)) {
          if (bytes.length >= 768) {
            const palette = parsePalette(bytes).map((component) => component & 63);
            fact.paletteHash = createHash('sha256').update(palette).digest('hex');
            fact.paletteData = Buffer.from(palette).toString('base64');
          }
        } else {
          const voice = decodeVoc(bytes);
          if (voice.samples.length) fact.soundGroup = classifySound(voice.samples, voice.sampleRate);
        }
      } catch {
        // A damaged sample remains available without a misleading hash or sound group.
      }
      entry = { size: stat.size, modified: stat.mtimeMs, fact };
      cache.set(path, entry);
    }
    if (Object.keys(entry.fact).length) out[name] = { ...entry.fact };
  }
  return out;
}
