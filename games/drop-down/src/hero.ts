// DROP DOWN's hero: Lena from the kit, with her Throw sequence turned into a HIT tied to Enter (the kit draws
// the poses: wind up, release, follow through). The frames, in order:
//   wind up        arm back
//   birth          a frame whose second picture is MONBL gives birth to monster number "first
//                  picture": the swing (see THROW IT's hero.ts and code/GM/PLAYGAME.C CharBirthMon). Its y of 20 puts
//                  it in her own row, the bottom row, where a crate stands, not in the top row.
//   release        arm forward, held while the swing lives and turns into its burst
//   push           a three-pixel step toward the crate, so the touch that spends the hit is made then
//   follow through arm back down
// Walking into a crate does nothing now: its touch needs the counter this fills (blocks.ts).
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { SWING } from './monsters';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
export const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot and the demo press. */
export const SCAN_ENTER = 28;
/** Pixels the push frame steps toward the crate. */
const PUSH = 3;

/** HERO.CHR: the kit's hero with Enter hitting. */
export function buildHitter(heroBlocks: Parameters<typeof buildHero>[0]): Character {
  const ch = buildHero(heroBlocks);
  const s = ch.sequences[SEQ.throw];
  const [windUp, release, follow] = s.frames;
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: SWING, pic2: MONBL, pause: 0 };
  const hold = { ...release, pause: 4 };
  const push = { ...release, x: PUSH, pause: 2 };
  const frames = [windUp, birth, hold, push, follow];
  frames.forEach((f, i) => (s.frames[i] = f));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // one hit a press (norepeat); it cannot be cut short (ground: 1), so a swing is never born without its arm
  Object.assign(s, { key: KEY_ENTER, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  return ch;
}
