// A released game's boards: games/<id>/integrator.json (the same record as the companion's
// `integratorBoards` section; see boardLayout.ts) is read from there at build time, so "Look
// inside" and "Edit a copy" open with the arrangement its author made. Editor-only: it is never
// part of the game's files, the disk/ output or a download.
import { getSection, setSection, type Companion, emptyCompanion } from '../../../project/companion';
import { BOARDS_SECTION } from './boardLayout';

const shipped = import.meta.glob<unknown>('../../../../../games/*/integrator.json', { import: 'default' });

/** `c` with catalog game `id`'s shipped boards in it for `gam` (unless it has boards of its own). */
export async function withShippedBoards(c: Companion | undefined, id: string, gam: string): Promise<Companion | undefined> {
  const load = shipped[`../../../../../games/${id}/integrator.json`];
  if (!load) return c;
  const out = c ?? emptyCompanion();
  if (getSection<unknown>(out, gam, BOARDS_SECTION, undefined) === undefined) setSection(out, gam, BOARDS_SECTION, await load());
  return out;
}
