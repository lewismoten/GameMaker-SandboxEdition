// THE SHOW's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then the cast of
// two little plays. An ACT is one monster; the next act is the monster it BECOMES when its path or its
// lifetime runs out (code/GM/PLAYGAME.C: MonEndPath kills a monster whose `end` is -1 when its path is
// done, and KillMon turns it into `newmon` at the same place, where that monster starts its own path).
// A scene is a chain of acts, and it starts when the level does: it does not wait for the hero.
//
//   Pip (orange), on the left:   peeks behind the curtain, walks in, says HI, listens, walks out
//   Blu (blue), on the right:    peeks behind the curtain, walks in, listens, says HI, walks out
//   The cameo (yellow, a party hat): waits in a doorway, walks to the stage, waves HI once, walks off behind the curtain and is gone
// Nobody here is solid and nobody hurts: the hero walks through the actors.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawBubble, drawNothing, drawPeek, drawSays, recolor, withHat } from './actorArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const MON = {
  pipPeek: 3,
  pipIn: 4,
  pipSays: 5,
  pipListens: 6,
  pipOut: 7,
  bluPeek: 8,
  bluIn: 9,
  bluListens: 10,
  bluSays: 11,
  bluOut: 12,
  camWait: 13,
  camIn: 14,
  camSays: 15,
  camOut: 16,
  pipCue: 17,
  pipBubble: 18,
  bluBubble: 19,
  camBubble: 20,
  bluCue: 21,
  camCue: 22,
} as const;

/** Powers: 100 or more cannot be popped by touching Neka (code/GM/PLAYGAME.C DoCollision); nothing here is thrown. */
export const POWER = 110;
/** How many blocks each actor walks in and out, and how fast (the engine's speed number). */
export const WALK = { blocks: 4, speed: 1 } as const;
/** Ticks (18.2 a second): backstage before the show, and one line of dialog. */
export const PEEK_TICKS = 70;
export const LINE_TICKS = 40;
/** Ticks a walk of `blocks` takes at `speed` (measured by tools/timing.ts: about 20 a block at speed 1), so a speech bubble can be timed to start when its speaker stops. */
export const walkTicks = (blocks: number, speed: number): number => Math.round((blocks * 20) / speed);
/** The cameo's wait in the doorway (ticks), its long walk in and its short walk off (blocks), and how long it waves (ticks). */
export const CAMEO = { wait: 60, walkIn: 14, walkOut: 3, speed: 2, waves: 60 } as const;

/** The monster pictures: the kit's, then peek, walk (two frames), says and stands for each actor. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  const purple = pal.r('purple');
  const cast = { pip: pal.r('orange'), blu: pal.r('blue') };
  mb.add('peek0', drawPeek(pal, 0), {});
  mb.add('peek1', drawPeek(pal, 1), {});
  for (const [name, ramp] of Object.entries(cast)) {
    const a0 = recolor(g0, purple, ramp);
    const a1 = recolor(g1, purple, ramp);
    mb.add(`${name}0`, a0, {});
    mb.add(`${name}1`, a1, {});
    mb.add(`${name}says`, drawSays(pal, a0), {});
    mb.add(`${name}bubble`, drawBubble(pal, name === 'pip' ? 6 : 12, ramp[0]), {});
  }
  const gold = recolor(g0, purple, pal.r('gold'));
  mb.add('cam0', withHat(pal, gold, 0), {});
  mb.add('cam1', withHat(pal, gold, 1), {});
  mb.add('camsays', drawSays(pal, withHat(pal, gold, 0)), {});
  mb.add('cambubble', drawBubble(pal, 9, pal.r('gold')[0]), {});
  mb.add('nothing', drawNothing(), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then every act of both little plays. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  const one = (name: string): [number, number][] => [[mb.n(name), 8]];
  const base = { power: POWER, thru: 1 };
  const walk = (dx: number, speed: number) => [corner(dx, 0, speed, dx < 0 ? 4 : 0)];
  // every act but the last becomes the next one; a walk ends with its path (`end` -1), a line of dialog with its lifetime
  const act = (pic: [number, number][], next: number | undefined, how: Partial<Monster>, path: ReturnType<typeof walk> = []) =>
    mon(pic, { ...base, ...(next === undefined ? {} : { newmon: next }), ...how }, path);
  const { blocks, speed } = WALK;
  // Pip
  set[MON.pipPeek] = act(anim('peek', 12), MON.pipIn, { end: PEEK_TICKS });
  set[MON.pipIn] = act(anim('pip', 6), MON.pipSays, { end: -1 }, walk(blocks, speed));
  set[MON.pipSays] = act(one('pipsays'), MON.pipListens, { end: LINE_TICKS });
  set[MON.pipListens] = act(one('pip0'), MON.pipOut, { end: LINE_TICKS });
  set[MON.pipOut] = act(anim('pip', 6), undefined, { end: -1 }, walk(-blocks, speed));
  // Blu
  set[MON.bluPeek] = act(anim('peek', 12), MON.bluIn, { end: PEEK_TICKS });
  set[MON.bluIn] = act(anim('blu', 6), MON.bluListens, { end: -1 }, walk(-blocks, speed));
  set[MON.bluListens] = act(one('blu0'), MON.bluSays, { end: LINE_TICKS });
  set[MON.bluSays] = act(one('blusays'), MON.bluOut, { end: LINE_TICKS });
  set[MON.bluOut] = act(anim('blu', 6), undefined, { end: -1 }, walk(blocks, speed));
  // the cameo: waits in a doorway, walks to the stage, waves once, walks off behind the left curtain
  set[MON.camWait] = act(one('cam0'), MON.camIn, { end: CAMEO.wait });
  set[MON.camIn] = act(anim('cam', 6), MON.camSays, { end: -1 }, walk(-CAMEO.walkIn, CAMEO.speed));
  set[MON.camSays] = act(one('camsays'), MON.camOut, { end: CAMEO.waves });
  set[MON.camOut] = act(anim('cam', 6), undefined, { end: -1 }, walk(-CAMEO.walkOut, CAMEO.speed));
  // each speech bubble is its own monster: a clear picture that waits out the acts before it (a timer), then
  // becomes the bubble, which shows for one line and is gone
  const ago = (blocks: number) => PEEK_TICKS + walkTicks(blocks, speed);
  const cue = (n: number, bubbleMon: number, name: string, wait: number) => {
    set[n] = act(one('nothing'), bubbleMon, { end: wait });
    set[bubbleMon] = act(one(`${name}bubble`), undefined, { end: LINE_TICKS });
  };
  cue(MON.pipCue, MON.pipBubble, 'pip', ago(WALK.blocks));
  cue(MON.bluCue, MON.bluBubble, 'blu', ago(WALK.blocks) + LINE_TICKS);
  cue(MON.camCue, MON.camBubble, 'cam', CAMEO.wait + walkTicks(CAMEO.walkIn, CAMEO.speed));
  return set;
}
