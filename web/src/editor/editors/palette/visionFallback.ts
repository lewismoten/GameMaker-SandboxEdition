// Useful indexed artwork for Color vision when the level preview is empty or unavailable.
import { BLEN, BLOCK_COUNTS, parseBlocks, TRANSPARENT, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Project } from '../../core/project';
import { normalize } from '../../../project/files';

export interface VisionPicture {
  width: number;
  height: number;
  pixels: Uint8Array;
  label: string;
}

/** Treat nearly black filler as empty, including the engine's very dark default color zero. */
export function visiblePicture(pixels: Uint8Array, pal: Palette): boolean {
  return pixels.some((color) => pal[color * 3] > 4 || pal[color * 3 + 1] > 4 || pal[color * 3 + 2] > 4);
}

export function includesColors(pixels: Uint8Array, colors: readonly number[] = []): boolean {
  const present = new Set(pixels);
  return colors.every((color) => present.has(color));
}

/** Use this palette's block pictures first; a complete swatch grid is always available. */
export function visionFallback(project: Pick<Project, 'files' | 'paletteFor'>, file: string, pal: Palette, marked?: readonly number[]): VisionPicture {
  for (const kind of ['bbl', 'cbl', 'mbl'] as BlockKind[])
    for (const name of project.files.byExtension(kind)) {
      if (normalize(project.paletteFor(name).source) !== normalize(file)) continue;
      try {
        const blocks = parseBlocks(project.files.get(name)!, BLOCK_COUNTS[kind]);
        const useful = blocks.filter((block) => visiblePicture(kind === 'bbl' ? block.pixels : block.pixels.filter((c) => c !== TRANSPARENT), pal));
        if (!useful.length) continue;
        const width = 12 * BLEN;
        const height = 7 * BLEN;
        const pixels = new Uint8Array(width * height);
        useful.slice(0, 84).forEach((block, index) => {
          const left = (index % 12) * BLEN;
          const top = Math.floor(index / 12) * BLEN;
          for (let y = 0; y < BLEN; y++)
            for (let x = 0; x < BLEN; x++) {
              const color = block.pixels[y * BLEN + x];
              if (kind === 'bbl' || color !== TRANSPARENT) pixels[(top + y) * width + left + x] = color;
            }
        });
        if (includesColors(pixels, marked)) return { width, height, pixels, label: `${name.toUpperCase()} block pictures` };
      } catch {
        // An unreadable picture set must not prevent checking the palette itself.
      }
    }
  const width = 256;
  const height = 160;
  const pixels = Uint8Array.from({ length: width * height }, (_, i) => Math.floor(i / width / 10) * 16 + Math.floor((i % width) / 16));
  return { width, height, pixels, label: 'Palette colors' };
}
