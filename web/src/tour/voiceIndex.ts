// Which steps have a recorded voice clip: public/tour/voice/index.json (written by `npm run voice`)
// lists them, so the player asks only for clips that exist (a step with none uses the bubble's
// own timing, with no request that can only fail). Until the list has loaded, or if it can't be
// read, every step is assumed to have one, as before. No DOM.

/** The clips by step id (the file's other fields are not needed here). */
export type ClipIndex = Record<string, { chapter: string }>;

/** Whether the step has a clip: always, when the index isn't known. */
export function hasClip(index: ClipIndex | undefined, chapterId: string, stepId: string): boolean {
  return !index || index[stepId]?.chapter === chapterId;
}

/** Reads the index; undefined when it can't be (offline without the copy, a damaged file). */
export async function loadClipIndex(fetcher: typeof fetch = fetch): Promise<ClipIndex | undefined> {
  try {
    const res = await fetcher('./tour/voice/index.json');
    if (!res.ok) return undefined;
    const data: unknown = await res.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as ClipIndex) : undefined;
  } catch {
    return undefined;
  }
}
