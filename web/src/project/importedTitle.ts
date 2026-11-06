// A non-destructive, name-only repair of old titles derived from a DOS menu description.
import { gameTitle, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';

/** Undefined when already correct, renamed by the person, or not safe to derive. */
export function repairedTitle(record: { name: string; gam: string; files: Record<string, Uint8Array> }): string | undefined {
  try {
    const bytes = Object.entries(record.files).find(([n]) => n.toLowerCase() === record.gam.toLowerCase())?.[1];
    if (!(bytes instanceof Uint8Array)) return;
    const game = parseGame(bytes);
    const raw = game.scenes[0]?.desc ?? '';
    const title = gameTitle(game);
    if (title && title !== record.name && [raw.trim(), fromCp437(raw).trim()].includes(record.name)) return title;
  } catch {
    // Missing/damaged games keep their names; recovery is a separate concern.
  }
}
