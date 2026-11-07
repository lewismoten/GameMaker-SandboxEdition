// A game's content fingerprint: its .gam plus every data file the .gam names (maps, blocks,
// palettes, monsters, characters, sounds, music, pictures, text), by lowercased name with the
// CRC-32 of each, hashed with SHA-256. Saves, scores, configs and players are not named by the
// .gam, so they don't count. The same game from two archives gets the same print only when
// all of it matches (the .gam alone isn't enough: maps and blocks differ between copies).
// No DOM.
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

/** The text that is hashed, so it can be looked at and tested: "name:crc" per line, sorted. */
export function contentText(gam: Uint8Array, get: (name: string) => Uint8Array | undefined): string | undefined {
  let game;
  try {
    game = parseGame(gam);
  } catch {
    return undefined;
  }
  const names = new Set<string>();
  for (const s of game.scenes) for (const f of s.files) if (f) names.add(f.toLowerCase());
  const hex = (b: Uint8Array | undefined) => (b ? crc32(b).toString(16).padStart(8, '0') : 'missing');
  const lines = [...names].sort().map((n) => `${n}:${hex(get(n))}`);
  lines.push(`game:${hex(gam)}`);
  return lines.sort().join('\n');
}

/** 16 hex digits of the SHA-256 of the content text; undefined when the .gam can't be read. */
export async function contentFingerprint(gam: Uint8Array, get: (name: string) => Uint8Array | undefined): Promise<string | undefined> {
  const text = contentText(gam, get);
  if (text === undefined) return undefined;
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
