// STICK MAN's hero: the stick figure (stick.ts) in the kit's character file, with his Throw sequence tied to Enter and his jump kept on Space. The kit draws the
// three poses (wind up, release, follow through) and keeps them in the file with no key;
// this game gives the sequence a key and puts a frame in the middle that gives birth to the
// star (a frame whose second picture is MONBL births monster number "first picture", the way
// every Game-Maker hero shoots; see code/GM/PLAYGAME.C CharBirthMon).
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { KEY, SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { STAR } from './monsters';
import { SND_THROW } from './sounds';
import { ERASE } from './erase';

/** The PC scan code the bot and the demo press to throw: Enter (scan 0x1C, ascii 13; a sequence's key is scan<<8|ascii, code/GM/CHAR.H). */
export const SCAN_THROW = 28;
/** The scan code that jumps: Space (0x39). */
export const SCAN_JUMP = 57;
/** Enter's key word: scan 0x1C in the upper byte, ascii 13 in the lower. */
const KEY_ENTER = 0x1c0d;
/** Lives at the start. */
export const HERO_LIVES = 3;

/** HERO.CHR: the kit's hero with Enter throwing a star and Space jumping (there are no ladders). */
export function buildThrower(heroBlocks: Parameters<typeof buildHero>[0]): Character {
  const ch = buildHero(heroBlocks);
  const s = ch.sequences[SEQ.throw];
  const [windUp, release, follow] = s.frames;
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: STAR, pic2: MONBL, pause: 0 };
  const frames = [windUp, release, birth, follow];
  frames.forEach((f, i) => (s.frames[i] = f));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // Enter throws one star a press (norepeat); the toss cannot be cut short (ground: 1), so a star
  // is never born without his arm swinging
  Object.assign(s, { key: KEY_ENTER, sound: SND_THROW, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  // standing still he faces front (no engine memory of a facing); walking, each pose lasts two ticks so legs and arms can be seen at 18 ticks a second
  const front = new Map([
    ['stand.top', 'front.top'],
    ['blink.top', 'frontblink.top'],
    ['look.top', 'frontlook.top'],
  ]);
  for (const f of ch.sequences[SEQ.idle].frames) {
    for (const [from, to] of front) if (f.pic1 === heroBlocks.n(from)) f.pic1 = heroBlocks.n(to);
  }
  for (const q of [SEQ.right, SEQ.left, SEQ.rightD, SEQ.leftA]) {
    const w = ch.sequences[q];
    const poses = w.frames.slice(0, 4);
    poses.forEach((f, i) => {
      w.frames[i * 2] = { ...f };
      w.frames[i * 2 + 1] = { ...f };
    });
  }
  // losing a life rubs him out: the shaky hurt pose, then three erase poses (erase.ts), 34 ticks in all like the kit's
  const die = ch.sequences[SEQ.die];
  const first = die.frames[0];
  const steps: [string, string, number][] = [['hurt.top', 'hurt', 10], ...ERASE.map(([t, b]) => [t, b, 8] as [string, string, number])];
  steps.forEach(([t, b, pause], i) => (die.frames[i] = { ...first, pic1: heroBlocks.n(t), pic2: heroBlocks.n(b), pause }));
  // the kit's jump already sits on Space; the ladder-climbing keys go quiet
  Object.assign(ch.sequences[SEQ.jump], { key: KEY.space, jstkMov: 1, jstkBut: 1 });
  for (const q of [SEQ.up, SEQ.upW, SEQ.down, SEQ.downS]) ch.sequences[q].key = 0;
  Object.assign(ch.sequences[SEQ.up], { jstkMov: 0 });
  Object.assign(ch.sequences[SEQ.down], { jstkMov: 0 });
  return ch;
}
