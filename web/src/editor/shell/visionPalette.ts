// Which palette the Overview's Color vision card shows: the first with real colors, never a
// one-color palette (such as a game's dark.pal), which would draw as a plain black square.
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** How many different colors a palette file holds; 0 if it can't be read. */
function distinctColors(bytes: Uint8Array | undefined): number {
  if (!bytes) return 0;
  try {
    const pal = parsePalette(bytes);
    const seen = new Set<number>();
    for (let i = 0; i < 256; i++) seen.add((pal[i * 3] << 16) | (pal[i * 3 + 1] << 8) | pal[i * 3 + 2]);
    return seen.size;
  } catch {
    return 0;
  }
}

/** The first palette of the list that has more than one color, else the first one. */
export function visionPalette(names: readonly string[], get: (name: string) => Uint8Array | undefined): string | undefined {
  return names.find((name) => distinctColors(get(name)) > 1) ?? names[0];
}
