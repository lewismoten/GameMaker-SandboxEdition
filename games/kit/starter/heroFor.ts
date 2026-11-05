// Which helper leads a Starter (the table is web/src/project/starterHeroes.ts, shared with the Cast page). The answer is kept in a game's about.json as "hero" (the one place every text, card and palette reads);
// heroFor is the deterministic table that wrote it, and a test keeps the two in step.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { heroOfStarter } from '../../../web/src/project/starterHeroes';
import { helperPalettes, KIT_LOOK, type Look } from './heroLook';

/** The hero's name (KIT, MIA ...) for a Starter id. */
export const heroFor = heroOfStarter;

/** The look (palette ramps) of a hero by name. */
export const lookOf = (name: string): Look => (name === 'KIT' ? KIT_LOOK : (helperPalettes.find((h) => h.name === name) ?? { look: KIT_LOOK }).look);

/** A name as written in text: Kit, Mia, Lena. */
export const titleCase = (name: string): string => name[0] + name.slice(1).toLowerCase();

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** The hero named in a game's about.json (`hero`), Kit when it has none. */
export function heroOf(gameId: string): string {
  try {
    const about = JSON.parse(readFileSync(join(root, gameId, 'about.json'), 'utf8')) as { hero?: string };
    return about.hero ?? 'KIT';
  } catch {
    return 'KIT';
  }
}
