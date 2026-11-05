// The "Pocket Player (microSD)" download: a game as one file, NAME.GMP, for the Pocket Player firmware
// (hardware/pocket-player) to read from the pocket folder on its microSD card. Packed by pocketPack.ts
// (the same packer as web/scripts/pocketData.ts), bundled by pocketFile.ts. What the board can't play
// comes back as plain advice: `notes` when it still plays, an error when it can't.
import type { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { newCards, packPocketGame, POCKET_MAX_LEVELS, POCKET_MAX_LINKS, type PocketSource, type PocketStore } from './pocketPack';
import { gmpName, pocketId, writeGmp } from './pocketFile';

export interface PocketExport {
  name: string;
  bytes: Uint8Array;
  /** What the board leaves out or may not manage, in plain words. */
  notes: string[];
}

/** Raw deflate with the browser's (and Node's) CompressionStream. */
async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Why the board can't play it, as advice the author can act on. */
function advice(why: string): string {
  if (why === 'too many levels') return `It has more than ${POCKET_MAX_LEVELS} levels; the Pocket Player plays up to ${POCKET_MAX_LEVELS}.`;
  if (why === 'too many links') return `A level has more than ${POCKET_MAX_LINKS} links; the Pocket Player follows up to ${POCKET_MAX_LINKS} on a level.`;
  const scene = /^link to scene (\d+)$/.exec(why);
  if (scene) return `A level links to scene ${scene[1]}, which isn't a level; the Pocket Player goes only from level to level (or to the ending).`;
  return why;
}

export async function exportPocket(
  files: GameFiles,
  options: { title: string; gam: string; id?: string; controls?: PocketSource['controls'] },
): Promise<PocketExport> {
  const id = pocketId(options.id ?? options.gam.replace(/\.gam$/i, ''));
  const store: PocketStore = new Map();
  const cards = newCards();
  let packed;
  try {
    packed = await packPocketGame({ title: options.title, files, controls: options.controls }, store, cards, deflateRaw, true);
  } catch (e) {
    throw new Error(`The Pocket Player can't read this game's files (${e instanceof Error ? e.message : String(e)}).`, { cause: e });
  }
  if (!packed.levels) throw new Error('This game has no levels to play, so there is nothing for the Pocket Player.');
  if (packed.why.length) throw new Error(`This game won't play on the Pocket Player. ${packed.why.map(advice).join(' ')}`);
  const notes = [...packed.warn];
  const names = files.names().map((n) => n.toLowerCase());
  if (names.some((n) => n.endsWith('.voc') || n.endsWith('.cmf')))
    notes.push('The Pocket Player plays the PC speaker sounds only, so its Sound Blaster sounds and music stay silent.');
  const skipped = Object.keys(packed.leftOut);
  if (skipped.length) notes.push(`Some pictures between levels are left out (${skipped.join(', ')}).`);
  const bytes = writeGmp({ id, title: options.title, levels: packed.levels, cfg: packed.lines, files: store, cards: cards.parts });
  return { name: gmpName(id), bytes, notes };
}
