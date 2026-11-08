// The sound files of the three levels added to THE MOUNTAIN MOVED NEXT DOOR (each is the game's own set with a few
// changes, so a level's key moments have a sound of their own):
//   mist.snd   a bead of mist chimes, high and soft (the "other counter" sound; BEAD_COUNTER in props.ts)
//   town.snd   a bump on the street gives a low thunk and a score blip; the "other counter" sound is Old Mossback's
//              "Oh. Excuse me." (voice.ts), so touching the trigger the bumped bins leave behind plays it
//   ford.snd   a drop of river on every score, and a bloop for the jump
//   wind.snd   (windy ridge) a two-note chime for a blazed post, and a long soft rise for a jump into the wind
//   hollow.snd (the empty spot) a clue glints: a little climbing twinkle (the "other counter" sound, BEAD_COUNTER)
//   brook.snd  (stepping stones) a plink of water on every score, and a wet hop for the jump
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';
import { EXCUSE } from './voice';

export function mistSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.gain] = SPEAKER.arpeggio([1319, 1760, 2093]);
  return set;
}

export function townSounds(): SoundSet {
  const set = buildSounds();
  set.digital[SND.gain] = EXCUSE;
  set.freqs[SND.score] = speaker((i) => (i < 3 ? 330 : i < 4 ? 0 : i < 8 ? 1568 : 0));
  return set;
}

export function fordSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.score] = speaker((i) => (i < 4 ? 1318 : i < 6 ? 0 : i < 10 ? 988 : 0));
  set.freqs[SND.jump] = SPEAKER.rise(200, 520);
  return set;
}

export function windSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.score] = speaker((i) => (i < 4 ? 1175 : i < 5 ? 0 : i < 11 ? 1568 : 0));
  set.freqs[SND.jump] = SPEAKER.rise(160, 420);
  return set;
}

export function hollowSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.gain] = SPEAKER.arpeggio([1568, 1976, 2349, 3136]);
  return set;
}

export function brookSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.score] = speaker((i) => (i < 2 ? 2093 : i < 3 ? 0 : i < 7 ? 1568 : i < 8 ? 0 : i < 10 ? 1175 : 0));
  set.freqs[SND.jump] = SPEAKER.rise(260, 640);
  return set;
}
