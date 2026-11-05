// FIREWORKS' hero: Mara from the kit, with the Throw sequence tied to Enter and a frame in the middle that gives birth
// to a rocket (a frame whose second picture is MONBL births monster number "first picture", the way every Game-Maker
// hero shoots; see code/GM/PLAYGAME.C CharBirthMon). The rocket is the launchers' pink one, born at Mara's head: it
// flies its own path up from there and bursts like any other.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { KEYS } from '../../kit/starter/blocks';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { ROCKET } from './monsters';
import { SND_LAUNCH } from './sounds';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
export const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot and the demo press. */
export const SCAN_ENTER = 28;
/** Hit points at the start (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;

/** HERO.CHR: the kit's hero with Enter launching a rocket. */
export function buildLauncher(heroBlocks: Parameters<typeof buildHero>[0]): Character {
  const ch = buildHero(heroBlocks);
  ch.meter[KEYS] = INF_REPEAT; // no keys in this game
  ch.meter[0] = HERO_HIT_POINTS;
  const s = ch.sequences[SEQ.throw];
  const [windUp, release, follow] = s.frames;
  // y 0: the rocket is born in the block of Mara's head, a block above the feet
  const birth = { ...emptyFrame(), x: 0, y: 0, pic1: ROCKET, pic2: MONBL, pause: 0 };
  const frames = [windUp, release, birth, follow];
  frames.forEach((f, i) => (s.frames[i] = f));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // one rocket a press (norepeat); the swing cannot be cut short (ground: 1), so a rocket never goes up without it
  Object.assign(s, { key: KEY_ENTER, sound: SND_LAUNCH, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  return ch;
}
