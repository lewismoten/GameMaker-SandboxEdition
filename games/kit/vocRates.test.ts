// Voice and recordings remain exact even when almost all energy is below 4 kHz.
import { expect, it } from 'vitest';
import { encodeVoc, decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { selectiveVoc } from './vocRates';

it('protects speech, music, mixed voice, real barks and unknown future assets', () => {
  const bytes = encodeVoc(
    Float32Array.from({ length: 11025 }, (_, i) => Math.sin(i * 0.1) * 0.7),
    11025,
  );
  for (const [game, name] of [
    ['voice', 'welcome'],
    ['sweats', 'itch_p'],
    ['loofah', 'towel'],
    ['tuneup', 'teddy1'],
    ['tuneup', 'chordc'],
    ['maximus', 'hail'],
    ['tickle', 'laugh'],
    ['future', 'ding'],
  ]) {
    expect(selectiveVoc(game, `${name}.voc`, bytes)).toBe(bytes);
  }
  expect(decodeVoc(selectiveVoc('year2000', 'slide.voc', bytes)).sampleRate).toBeLessThan(11000);
});
