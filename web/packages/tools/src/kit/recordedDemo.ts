// Native demo recordings from reusable delta/key pairs, ending with an Escape press and release.
import { serializeRecording, type RecordedKey } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
export function recordedDemo(pairs: readonly number[], waitTicks = 30, releaseTicks = 4): Uint8Array {
  if (pairs.length % 2) throw new RangeError('Demo keys must be delta/key pairs');
  const keys: RecordedKey[] = [];
  for (let i = 0; i < pairs.length; i += 2) keys.push({ delta: pairs[i], key: pairs[i + 1] });
  keys.push({ delta: waitTicks, key: 1 }, { delta: releaseTicks, key: 129 });
  return serializeRecording(keys);
}
