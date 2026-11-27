// Checks the number of Enter presses in the title recording.
import type { RecordedKey } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';

export function throwCountError(keys: RecordedKey[]): string | undefined {
  const throws = keys.filter((k) => k.key === 28).length;
  if (throws !== 3) return `the demo should throw three stars (two pops and the one under the head), not ${throws}`;
}
