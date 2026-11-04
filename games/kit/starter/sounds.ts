// The Starters' sound effects (.SND): short PC-speaker blips, one per SND number in ids.ts.
// Game-Maker plays 0 to 8 itself when a counter changes (money, a life, a score...); the rest
// are played by a character sequence or a block. In the editor: the Sounds tab.
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from './ids';

export function buildSounds(): SoundSet {
  const set = newSoundSet();
  set.freqs[SND.help] = SPEAKER.arpeggio([523, 784, 1047]);
  set.freqs[SND.kill] = SPEAKER.fall(1600, 400);
  set.freqs[SND.coin] = SPEAKER.coin();
  set.freqs[SND.spend] = SPEAKER.fall(900, 500);
  set.freqs[SND.life] = SPEAKER.arpeggio([659, 784, 988, 1319]);
  set.freqs[SND.score] = speaker((i) => (i < 6 ? 1568 : 0));
  set.freqs[SND.lose] = SPEAKER.fall(600, 150);
  set.freqs[SND.gain] = SPEAKER.chirp();
  set.freqs[SND.use] = SPEAKER.arpeggio([988, 784, 659]);
  set.freqs[SND.jump] = SPEAKER.rise(300, 900);
  set.freqs[SND.hurt] = SPEAKER.hurt();
  set.freqs[SND.die] = SPEAKER.fall(800, 100);
  set.freqs[SND.step] = speaker((i) => (i < 2 ? 200 : 0));
  return set;
}
