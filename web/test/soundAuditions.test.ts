// Sound-set auditions preserve slot names and pair PC speaker/VOC parts without real audio clocks.
import { describe, expect, it } from 'vitest';
import { soundAuditions } from '../src/editor/widgets/soundAuditions';
import { newSoundSet, serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { GameFiles } from '../src/project/files';

const digital = () => encodeVoc(new Float32Array(80).fill(0.5), 8000);

describe('sound-set auditions', () => {
  it('keeps slot numbers across gaps and places each digital part after its PC pair', () => {
    const set = newSoundSet();
    set.freqs[2][0] = 440;
    set.digital[2] = 'COIN';
    set.digital[7] = 'KEY';
    const files = new GameFiles([
      ['coin.voc', digital()],
      ['key.voc', digital()],
    ]);
    const parts = soundAuditions(serializeSoundSet(set), files);
    expect(parts.map(({ slot, kind }) => [slot, kind])).toEqual([
      [2, 'speaker'],
      [2, 'voc'],
      [7, 'voc'],
    ]);
    expect(parts[0].label).toContain('Add money');
    expect(parts[1].seconds).toBeCloseTo(0.01, 2);
  });
  it('ignores inaudible frequencies and missing or damaged VOC companions', () => {
    const set = newSoundSet();
    set.freqs[0][0] = 19;
    set.freqs[1][0] = 440;
    set.digital[1] = 'BAD';
    set.digital[2] = 'MISSING';
    const files = new GameFiles([['bad.voc', new Uint8Array([1, 2, 3])]]);
    expect(soundAuditions(serializeSoundSet(set), files).map(({ slot, kind }) => [slot, kind])).toEqual([[1, 'speaker']]);
  });
});
