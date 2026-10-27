// The narration's index, public/tour/voice/index.json: for each clip id, its chapter, where the
// tour uses it, the words it says, how long it plays and hashes of the words and of the voice
// sample, so scripts/narrate.ts records only lines whose words (or voice) changed. Pure
// functions, no models, so tests can run them.
import { createHash } from 'node:crypto';

export interface Line {
  id: string;
  /** The tour chapter or area; the clip's subfolder. */
  chapter: string;
  /** Where the tour uses it, e.g. "Home: points at the New game button". */
  where?: string;
  text: string;
}

export interface IndexEntry {
  chapter: string;
  where: string;
  text: string;
  /** How long the clip plays, in seconds (two decimals). */
  seconds: number;
  /** textHash(text) when the clip was recorded. */
  hash: string;
  /** textHash of the voice sample's bytes the clip was cloned from. */
  voice: string;
}

export type VoiceIndex = Record<string, IndexEntry>;

/** Clip ids and chapters: lowercase letters, digits and hyphens. */
export const ID = /^[a-z0-9-]+$/;

/** A short, stable hash of text or bytes (12 hex digits of SHA-256). */
export const textHash = (data: string | Uint8Array): string => createHash('sha256').update(data).digest('hex').slice(0, 12);

/** A clip's path under the voice folder. */
export const clipPath = (line: Pick<Line, 'id' | 'chapter'>): string => `${line.chapter}/${line.id}.ogg`;

/** The problems with a list of lines (bad or repeated ids, bad chapters, missing words); empty when fine. */
export function lineProblems(lines: unknown): string[] {
  if (!Array.isArray(lines)) return ['the lines must be an array of { id, chapter, where, text }'];
  const problems: string[] = [];
  const seen = new Set<string>();
  lines.forEach((line: Partial<Line>, i) => {
    const id = line?.id;
    if (typeof id !== 'string' || !ID.test(id)) problems.push(`line ${i}: id ${JSON.stringify(id)} must be lowercase a-z, 0-9 and -`);
    else if (seen.has(id)) problems.push(`line ${i}: id ${id} is repeated`);
    else seen.add(id);
    if (typeof line?.chapter !== 'string' || !ID.test(line.chapter))
      problems.push(`line ${i}: ${String(id)}'s chapter ${JSON.stringify(line?.chapter)} must be lowercase a-z, 0-9 and -`);
    if (line?.where !== undefined && typeof line.where !== 'string') problems.push(`line ${i}: ${String(id)}'s where must be text`);
    if (typeof line?.text !== 'string' || !line.text.trim()) problems.push(`line ${i}: ${String(id)} has no text`);
  });
  return problems;
}

export interface PlanOptions {
  /** Record every line again. */
  force?: boolean;
  /** Record only these ids (a retake), whether or not they changed. */
  only?: string[];
  /** The voice sample's hash; a clip from another sample is recorded again. */
  voice: string;
  /** Whether a clip's file (its path under the voice folder) is there. */
  exists: (path: string) => boolean;
}

/** The ids to record: changed words, a new voice, a missing file, or asked for. */
export function planTakes(lines: Line[], index: VoiceIndex, o: PlanOptions): string[] {
  if (o.only?.length) return lines.filter((l) => o.only!.includes(l.id)).map((l) => l.id);
  return lines
    .filter((l) => {
      const e = index[l.id];
      return o.force || !e || e.hash !== textHash(l.text) || e.voice !== o.voice || !o.exists(clipPath(l));
    })
    .map((l) => l.id);
}

/** Copies each recorded line's chapter and where into the index (they change without a retake). */
export function refreshPlaces(lines: Line[], index: VoiceIndex): void {
  for (const l of lines) if (index[l.id]) Object.assign(index[l.id], { chapter: l.chapter, where: l.where ?? '' });
}

/** The ids in the index that no line has any more (their clips are stale). */
export const staleIds = (lines: Line[], index: VoiceIndex): string[] => Object.keys(index).filter((id) => !lines.some((l) => l.id === id));

/** The index as written: ids sorted, so a retake changes one entry's lines. */
export const indexJson = (index: VoiceIndex): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.keys(index)
        .sort()
        .map((id) => [id, index[id]]),
    ),
    null,
    2,
  ) + '\n';
