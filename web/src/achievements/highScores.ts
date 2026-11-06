// All Mine is a predicate over one game's persisted DOS table, never a count of play events.
import { HIGH_SCORES, parseHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';
import { normalize, loadCatalogList } from '../project/files';
import { listProjects, loadSaveData } from '../project/storage';
import { loadAchievements, unlockAchievement } from './store';

/** The parser pads short files; only ten complete, displayed, named records qualify. */
export function wholeTable(bytes?: Uint8Array): string | undefined {
  if (!bytes || bytes.length < HIGH_SCORES * 34) return;
  const rows = parseHighScores(bytes);
  const name = rows[0].name.trim().toLowerCase();
  // Zero scores and blank names are the format's placeholders. No name is reserved.
  if (!name || !rows.every((r) => r.score !== 0 && r.name.trim().toLowerCase() === name)) return;
  return JSON.stringify(rows);
}

async function storedTable(saveId: string, gam: string): Promise<[string, string] | undefined> {
  if (!/^(game|project):/.test(saveId) || !gam) return;
  const name = normalize(gam.replace(/\.[^.]*$/, '') + '.his');
  const files = await loadSaveData(saveId);
  const bytes = Object.entries(files).find(([n]) => normalize(n) === name)?.[1];
  const table = wholeTable(bytes);
  return table ? [JSON.stringify([saveId, name]), table] : undefined;
}

function award(table: [string, string] | undefined, baseline?: Record<string, string>): void {
  if (table && baseline?.[table[0]] !== table[1]) unlockAchievement('play-all-mine');
}

/** Called on player open and after persistence, never onPlayEnd (which precedes name input). */
export async function checkHighScores(saveId: string, gam: string): Promise<void> {
  const table = await storedTable(saveId, gam);
  if (table) award(table, (await loadAchievements()).reset?.highScores);
}

/** Current qualifying overlays, also used by Reset. Never combine tables or use disk fallbacks. */
export async function allMineTables(): Promise<Record<string, string>> {
  const [games, projects] = await Promise.all([loadCatalogList().catch(() => []), listProjects().catch(() => [])]);
  const refs = [
    ...games.filter((g) => g.gam).map((g) => ({ id: `game:${g.id}`, gam: g.gam! })),
    ...projects.map((p) => ({ id: `project:${p.id}`, gam: p.gam })),
  ];
  const out: Record<string, string> = {};
  // Read in sequence rather than launching an IndexedDB request for every catalog entry at once.
  for (const ref of refs) {
    const table = await storedTable(ref.id, ref.gam);
    if (table) out[table[0]] = table[1];
  }
  return out;
}

export async function scanHighScores(): Promise<void> {
  const tables = await allMineTables();
  const record = await loadAchievements();
  for (const table of Object.entries(tables)) award(table, record.reset?.highScores);
}
