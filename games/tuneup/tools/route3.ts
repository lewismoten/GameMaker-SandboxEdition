// The way through levels 10-13 as orders for the bot: the windshield crossed between the wiper
// sweeps (each blade watched go by, then a person's reaction), every raindrop rung on the way.
// A person's timing throughout (bot.ts).
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/palette';
import { BLADE_FOOT, RAIN, RAIN_PARTS, SECTIONS, bladeName, parkedFrames, rainBlocks } from '../src/levels/rain';
import { HORN_BEAT, HORN_REST, HORN_ROUNDS, HORN_ROW, hornSize, padX, stageX } from '../src/levels/horn';
import { GEARS, freshTooth, keyBlocks, toothName } from '../src/levels/key';
import { CTR } from '../src/ids';
import { diskNumber } from '../src/blocks/shared';
import { GAUGES, PANEL, RADIO_X, STATIONS, dialRing, panelBlocks } from '../src/levels/panel';
import type { Bot } from './bot';
import { leave, must, takeFork } from './route';

/** The raindrops' blocks, and each section's just-wiped frames, as each part's block book numbers them. */
const rainParts = RAIN_PARTS.map((part) => {
  const book = rainBlocks(part)(buildPalette('rain')).book;
  return {
    part,
    drops: new Set([0, 1, 2, 3].map((i) => book.n(`drop${i}`))),
    parked: part.sections.map((i) => new Set(parkedFrames(SECTIONS[i]).map((f) => book.n(bladeName(SECTIONS[i], BLADE_FOOT, f))))),
  };
});

/** 10. The Rain Delay, part `n`: up to each wiper, its blade watched go by, then across before the next sweep. */
export function rainDelay(n: number) {
  const { part, drops, parked } = rainParts[n];
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 17 + n, `the rain delay, part ${n + 1}`);
    await must(bot, bot.land(), 'onto the cowl');
    const hp = bot.sim.ci.hitpts;
    for (const [i, si] of part.sections.entries()) {
      for (const x of SECTIONS[si].wipers) {
        await must(bot, bot.walk(x - 1, `before the wiper at ${x}`), 'to the wiper');
        const isParked = () => parked[i].has(bot.shownNum(x, BLADE_FOOT));
        // a sweep starting, then gone by: cross right behind it
        await must(
          bot,
          bot.until(undefined, () => !isParked(), `saw the blade at ${x} come`, 200),
          'waiting for the sweep',
        );
        await must(bot, bot.until(undefined, isParked, `saw the blade at ${x} go by`, 40), 'the sweep');
        await must(bot, bot.react(), 'reacting');
        await must(bot, bot.walk(x + 1, `past the wiper at ${x}`), 'across');
      }
    }
    if (bot.sim.ci.hitpts < hp) throw new Error(`slapped by a wiper: ${hp} -> ${bot.sim.ci.hitpts}`);
    if (part.fork !== undefined) await takeFork(bot, part.fork, 'on the cowl');
    const left = part.drops.filter((x) => drops.has(bot.shownNum(x, RAIN.floor - 1)));
    if (left.length) throw new Error(`raindrops left at ${left.join(', ')}`);
    await leave(bot, bot.walk(part.exit, 'to the far pillar'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `rainDelay${n + 1}` });
  return run;
}

/** 11. The Horn Section, one round: the call watched once through, then each stage's pad reached and climbed. */
export function hornSection(round: number) {
  const r = HORN_ROUNDS[round];
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 19 + round, `the horn section, round ${round + 1}`);
    await must(bot, bot.land(), 'onto the sidewalk');
    // listening to the clowns: the whole call, once through
    await must(bot, bot.wait((r.phrase.length + HORN_REST) * HORN_BEAT), 'listening to the call');
    const score = bot.sim.ci.score;
    for (const [k, note] of r.phrase.entries()) {
      const sx = stageX(k);
      await must(bot, bot.walk(padX(sx, note), `under pad ${note} of stage ${k + 1}`), 'into the stage');
      await must(bot, bot.react(), 'looking up');
      await must(bot, bot.tap('space', 4), `honking pad ${note}`);
      const y = bot.px.y;
      await must(bot, bot.hop('up', 12), 'up through the pad');
      if (bot.px.y !== (HORN_ROW.pads - 1) * 20) throw new Error(`not on pad ${note} of stage ${k + 1} (y ${bot.px.y} from ${y})`);
      await must(bot, bot.react(), 'on the pad');
      await must(bot, bot.hop('up', 12), 'up onto the walkway');
      if (bot.px.y !== (HORN_ROW.walk - 1) * 20) throw new Error(`not on the walkway of stage ${k + 1} (y ${bot.px.y})`);
      await must(bot, bot.walk(sx + 10, 'off the end of the walkway'), 'down');
    }
    // every note right: no raspberries
    if (bot.sim.ci.score < score + 50 * r.phrase.length) throw new Error(`a raspberry in round ${round + 1}`);
    await leave(bot, bot.walk(hornSize(r).exit, 'on along the curb'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `hornSection${round + 1}` });
  return run;
}

const gearBook = keyBlocks(0)(buildPalette('gear1')).book;
/** Each tooth's blocks just come up (lower, then upper), and the door's open block. */
const gearN = (room: number, name: string) => diskNumber(`gear${room + 1}`, gearBook.n(name));
const fresh = (room: number) => [false, true].map((upper) => new Set(freshTooth(upper).map((f) => gearN(room, toothName(upper, f)))));
const doorOpen = (room: number) => gearN(room, 'door.open');

/** Waits for the tooth at (x, row) to come up, then hops up onto it. */
async function onTooth(bot: Bot, room: number, x: number, upper: boolean): Promise<void> {
  const row = upper ? GEARS.high : GEARS.low;
  const teeth = fresh(room)[upper ? 1 : 0];
  const up = () => teeth.has(bot.shownNum(x, row));
  // (from the floor a person waits for the lower tooth to come round, not one already on its way
  // down; the upper comes up while he stands on the lower)
  if (!upper)
    await must(
      bot,
      bot.until(undefined, () => !up(), `saw the tooth at ${x}, ${row} go`, 200),
      'waiting for the tooth',
    );
  await must(bot, bot.until(undefined, up, `saw the tooth at ${x}, ${row} come up`, 200), 'waiting for the tooth');
  await must(bot, bot.react(), 'reacting');
  await must(bot, bot.hop('up', 12), 'up onto the tooth');
  if (bot.px.y !== (row - 1) * 20) throw new Error(`not on the tooth at ${x}, ${row} (y ${bot.px.y})`);
}

/** 12. Key Change, one gear room: up each tower's teeth on the beat, over its wall, the notes, out the door on its clock. */
export function keyChange(room: number) {
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 22 + room, `key change, gear ${room + 1}`);
    await must(bot, bot.land(), 'into the gearbox');
    const score = bot.sim.ci.score;
    for (const x of GEARS.towers) {
      await must(bot, bot.walk(x, `under the tower at ${x}`), 'to the tower');
      await onTooth(bot, room, x, false);
      await onTooth(bot, room, x, true);
      await must(bot, bot.walk(x + 4, 'along the ledge and over the wall'), 'over');
    }
    await must(bot, bot.walk(GEARS.door - 1, 'to the door'), 'door');
    if (bot.sim.ci.score < score + 150) throw new Error(`gear ${room + 1}: missed a note`);
    await must(
      bot,
      bot.until(undefined, () => bot.shownNum(GEARS.door, GEARS.floor - 1) !== doorOpen(room), 'saw the door shut', 80),
      'door',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.shownNum(GEARS.door, GEARS.floor - 1) === doorOpen(room), 'saw the door open', 80),
      'door',
    );
    await must(bot, bot.react(), 'reacting');
    await leave(bot, bot.walk(GEARS.exit, 'through the door'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `keyChange${room + 1}` });
  return run;
}

const dashBook = panelBlocks('tune')(buildPalette('dash')).book;
const gaugeBook = panelBlocks('gauges')(buildPalette('dash')).book;
/** Dial cell `j` with the needle on it going right (the first time round, for cell 0). */
const needleRight = (j: number) => diskNumber('dash1', dashBook.n(`dial${j}.${dialRing(j)[0][0] ? 0 : 1}`));

/** 13. The Instrument Panel, the radio: under each preset, the needle watched coming, then a hop into the lit button. */
export async function tuneRadio(bot: Bot): Promise<void> {
  expect(bot, 26, 'the instrument panel, the radio');
  await must(bot, bot.land(), 'onto the dash');
  for (const [s, i] of STATIONS.entries()) {
    const x = PANEL.dialX + i;
    await must(bot, bot.walk(x, `under preset ${s + 1}`), 'to the preset');
    // the needle a cell before the station, sweeping toward it: hop then
    const before = needleRight(i - 1);
    await must(
      bot,
      bot.until(undefined, () => bot.shownNum(x - 1, PANEL.dial) !== before, 'watching the needle', 100),
      'needle',
    );
    await must(
      bot,
      bot.until(undefined, () => bot.shownNum(x - 1, PANEL.dial) === before, `saw the needle near station ${s + 1}`, 200),
      'needle',
    );
    await must(bot, bot.react(), 'reacting');
    await must(bot, bot.hop('up', 8), `hopping into preset ${s + 1}`);
    if (bot.shownNum(x, PANEL.buttons) !== diskNumber('dash1', dashBook.n(`preset${s}.set`))) throw new Error(`station ${s + 1} didn't come in`);
  }
  // the choir's "aah" plays out before the door's clunk
  await must(bot, bot.sim.waitForClip(), 'the choir');
  await leave(bot, bot.walk(PANEL.exit, 'through the door'), 'out');
}

/** 13. The Instrument Panel, the gauges: a hop into each for its chord, then the radio into its space, then out. */
export async function gaugeChords(bot: Bot): Promise<void> {
  expect(bot, 27, 'the instrument panel, the gauges');
  await must(bot, bot.land(), 'onto the dash');
  for (const [g, x] of GAUGES.entries()) {
    await must(bot, bot.walk(x, `under gauge ${g + 1}`), 'to the gauge');
    await must(bot, bot.react(), 'looking up');
    await must(bot, bot.hop('up', 8), `hopping into gauge ${g + 1}`);
    if (bot.shownNum(x, PANEL.buttons) !== diskNumber('dash2', gaugeBook.n(`gauge${g}.up`))) throw new Error(`gauge ${g + 1} didn't play`);
    // each chord rings out before the next
    await must(bot, bot.sim.waitForClip(), 'the chord');
  }
  await must(bot, bot.walk(RADIO_X, 'into the radio space'), 'radio');
  if (bot.count(CTR.radio) !== 1) throw new Error('no radio');
  await must(bot, bot.sim.waitForClip(), 'the radio playing');
  await leave(bot, bot.walk(PANEL.exit, 'through the door'), 'out');
}

export const LEVELS_10_13 = [
  rainDelay(0),
  rainDelay(1),
  hornSection(0),
  hornSection(1),
  hornSection(2),
  keyChange(0),
  keyChange(1),
  keyChange(2),
  keyChange(3),
  tuneRadio,
  gaugeChords,
];
