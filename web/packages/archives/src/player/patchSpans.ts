// The bytes of XFERPLAY 3.00 a DOS player patch writes, by file offset: what a preserved
// player's raw regions must leave to a patch the author of the project changed since import.
import { patchEntry } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { extKind } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';

/** Every file offset patch `id` writes (none for an id it doesn't know). */
export function patchSpans(id: string): number[] {
  const k = extKind(id);
  if (k) return k.offsets.flatMap((o) => [o + 1, o + 2, o + 3]);
  const e = patchEntry(id);
  if (!e) return [];
  const run = (o: number, n: number) => Array.from({ length: n }, (_, i) => o + i);
  switch (e.kind) {
    case 'text':
    case 'format':
      return run(e.offset, e.length);
    case 'number':
    case 'frame':
      return e.fields.flatMap((f) => run(f.offset, f.size));
    case 'rgb':
      return [...e.offsets];
    case 'select':
    case 'fkey':
      return run(e.offset, 2);
  }
}
