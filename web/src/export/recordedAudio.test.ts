// The downloads find a Bard of Bizarre game's non-commercial voice clips in its LICENSE.TXT and say so.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameFiles } from '../project/files';
import { recordedAudioNotice, recordedClips } from './recordedAudio';
import { thirdPartyNotices } from './notices';

const license = (id: string) => new Uint8Array(readFileSync(resolve(__dirname, '../../../games', id, 'disk/license.txt')));

describe('recorded voice clips', () => {
  it('are read from a Bard game’s LICENSE.TXT', () => {
    expect(recordedClips(new GameFiles([['license.txt', license('mustard')]]))).toEqual([
      'ALIVE.VOC',
      'FEET.VOC',
      'HALLELU.VOC',
      'HUSTLE.VOC',
      'KEEPON.VOC',
      'MOUNTAIN.VOC',
    ]);
  });

  it('are none in a game with no recording', () => {
    expect(recordedClips(new GameFiles([['license.txt', license('tickle')]]))).toEqual([]);
    expect(recordedClips(new GameFiles())).toEqual([]);
    expect(recordedAudioNotice([])).toBeUndefined();
  });

  it('come first in the notices', () => {
    const audio = recordedAudioNotice(['FEET.VOC'])!;
    expect(audio).toContain('personal, non-commercial uses');
    for (const line of audio.split('\n')) expect(line.length).toBeLessThanOrEqual(78);
    const text = thirdPartyNotices('linux', audio);
    expect(text.indexOf('FEET.VOC')).toBeLessThan(text.indexOf('Copyright (c) 2026 Lewis Moten'));
    expect(thirdPartyNotices('linux')).not.toContain('voice clips');
  });
});
