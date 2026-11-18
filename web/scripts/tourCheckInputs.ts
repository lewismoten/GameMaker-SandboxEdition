// File prerequisites and the effective step list for the muted, clean-browser tour check.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Chapter, TourStep } from '../src/tour/steps';

/** Matches startTour's omission of page-only steps when more than one chapter plays. */
export function checkedSteps(chapters: Chapter[]): TourStep[] {
  return chapters.flatMap((c) => c.steps.filter((s) => chapters.length === 1 || !s.pageOnly));
}

/** Presence checks only: rerun build:games to refresh stale or damaged outputs. Paths are repository-relative. */
export function missingTourInputs(root: string, chapters: Chapter[]): string[] {
  const missing: string[] = [];
  const nonempty = (path: string) => existsSync(join(root, path)) && statSync(join(root, path)).isFile() && statSync(join(root, path)).size > 0;
  const need = (path: string, command: string) => {
    if (!nonempty(path)) missing.push(`missing prerequisite: ${path} (run ${command})`);
  };
  need('web/public/cast/sprites.json', 'from web/: npm run heavy -- npx vite-node scripts/castSprites.ts');
  // Every run starts on Home; its catalog, Library and desk shelves depend on which public disks exist.
  // Require the same public catalog even for a single chapter. Never require or reveal a secret game.
  const games = join(root, 'games');
  for (const id of readdirSync(games).sort()) {
    const about = join(games, id, 'about.json');
    if (!existsSync(about) || !existsSync(join(games, id, 'build.ts'))) continue;
    const info = JSON.parse(readFileSync(about, 'utf8')) as { secret?: boolean };
    if (info.secret) continue;
    const disk = `games/${id}/disk`;
    if (!existsSync(join(root, disk)) || !readdirSync(join(root, disk)).some((f) => /\.gam$/i.test(f) && nonempty(`${disk}/${f}`)))
      missing.push(`missing prerequisite: ${disk}/*.gam (run from root: npm run heavy -- npm run build:games -- --game ${id})`);
  }
  // The editor's explicit addresses must exist too, including the files visited within a chapter.
  const addresses = chapters.flatMap((c) => [c.hash, ...c.steps.map((s) => s.go?.hash)]);
  for (const hash of new Set(addresses)) {
    const match = hash && /^#\/p\/look:([^/]+)\/([^?]+)/.exec(hash);
    if (match) need(`games/${match[1]}/disk/${match[2]}`, `from root: npm run heavy -- npm run build:games -- --game ${match[1]}`);
  }
  return missing;
}
