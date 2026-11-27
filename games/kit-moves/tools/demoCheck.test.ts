// Cut the shipped recording on arrival in the dash room.
import { expect, it } from 'vitest';
import { parseRecording, serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { decodeKeys } from '../../../web/src/walkthrough/format';
import { demoRecording } from '../src/demo';
import walk from '../walkthrough.json';
import { checkRecording } from './checkRecording';

const keys = parseRecording(demoRecording());

it('rejects a recording cut at the first input in scene 3', async () => {
  const firstRoom = decodeKeys(walk.segments[0].keys);
  const cut = serializeRecording([...keys.slice(0, firstRoom.length + 1), { delta: 1, key: 1 }, { delta: 1, key: 129 }]);
  await expect(checkRecording(cut)).rejects.toThrow(/dash/);
});

it('rejects a recording that ends during the second dash over the widest gap', async () => {
  const lastDash = keys.map(({ key }) => key).lastIndexOf(28);
  const cut = serializeRecording([...keys.slice(0, lastDash + 1), { delta: 1, key: 1 }, { delta: 1, key: 129 }]);
  await expect(checkRecording(cut)).rejects.toThrow(/dash/);
});

it('accepts the shipped dash demonstration', async () => {
  await checkRecording(demoRecording());
});
