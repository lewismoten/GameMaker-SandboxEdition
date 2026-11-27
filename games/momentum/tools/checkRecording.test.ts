// A demo can collect every glide coin and still omit the run-up lesson.
import { expect, it, vi } from 'vitest';
import { parseRecording, serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { SCAN } from '../../kit/starter/ids';
import { demoRecording } from '../src/demo';
import { checkRecording } from './checkRecording';

it('rejects a recording cut at the transition to Run-Up', async () => {
  const keys = parseRecording(demoRecording());
  const hop = keys.findIndex(({ key }) => key === SCAN.space);
  // Press Escape on entry, before the 40-tick pause to read the sign.
  const cut = serializeRecording([...keys.slice(0, hop), { delta: keys[hop].delta - 40, key: 1 }, keys[keys.length - 1]]);
  // The assertion reads the engine world, so skip copying pixels to the canvas.
  using _present = vi.spyOn(Screen.prototype, 'present').mockImplementation(() => {});
  await expect(checkRecording(cut)).rejects.toThrow(/last gap/);
});
