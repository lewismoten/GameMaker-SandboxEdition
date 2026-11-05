// THREE PHASES' hero: Neka from the kit, with his Throw sequence tied to Enter. The kit draws the
// three poses (wind up, release, follow through) and keeps them in the file with no key;
// this game gives the sequence a key and puts a frame in the middle that gives birth to the
// star (a frame whose second picture is MONBL births monster number "first picture", the way
// every Game-Maker hero shoots; see code/GM/PLAYGAME.C CharBirthMon).
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { STAR } from './monsters';
import { SND_THROW } from './sounds';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
export const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot and the demo press. */
export const SCAN_ENTER = 28;
/** Hit points and lives at the start. */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;

/** HERO.CHR: the kit's hero with Enter throwing a star. */
export function buildThrower(heroBlocks: Parameters<typeof buildHero>[0]): Character {
  const ch = buildHero(heroBlocks);
  const s = ch.sequences[SEQ.throw];
  const [windUp, release, follow] = s.frames;
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: STAR, pic2: MONBL, pause: 0 };
  const frames = [windUp, release, birth, follow];
  frames.forEach((f, i) => (s.frames[i] = f));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // Enter throws one star a press (norepeat); the toss cannot be cut short (ground: 1), so a star
  // is never born without its arm swinging
  Object.assign(s, { key: KEY_ENTER, sound: SND_THROW, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  return ch;
}
