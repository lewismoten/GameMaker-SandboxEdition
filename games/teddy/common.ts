// The monsters every level shares, at the same numbers in every .MON: what Teddy's tricks
// send out, treats and bones, tickets, and Gwin.
import { CTR, MON, POWER } from './ids';
import { Bestiary, FLIP } from './mons';
import { FX } from './fx';
import { GWIN } from './gwin';

export function commonMonsters(b: Bestiary): void {
  for (const [name, px] of Object.entries(FX)) {
    if (name.startsWith('treat')) b.pic(name, px, { effect: CTR.treats, eamt: 1, score: 10 });
    else if (name.startsWith('bone')) b.pic(name, px, { hp: 25, score: 50 });
    else if (name.startsWith('ticket')) b.pic(name, px, { effect: CTR.tickets, eamt: 1, score: 25 });
    else b.pic(name, px);
  }
  for (const [name, px] of Object.entries(GWIN)) b.pic(name, px, name.startsWith('gwin') ? { effect: CTR.treats, eamt: -1 } : {});

  // Teddy's tricks. A bark rolls forward and scares off pests and critters.
  b.add(
    'woof',
    {
      pics: [
        ['woof1', 2],
        ['woof2', 2],
      ],
      power: POWER.woof,
      towards: 9,
      end: 9,
      thru: true,
    },
    MON.woof,
  );
  // Digging churns the block under Teddy's feet.
  b.add(
    'dig',
    {
      pics: [
        ['dig1', 2],
        ['dig2', 2],
      ],
      power: POWER.dig,
      end: 5,
    },
    MON.dig,
  );
  // A high five reaches into the block above and a little forward.
  b.add('paw', { pics: [['paw', 6]], power: POWER.paw, towards: 3, end: 6 }, MON.paw);
  // A spin sends a whirl out to each side.
  b.add(
    'whirlL',
    {
      pics: [
        ['whirl1', 2],
        ['whirl2', 2],
      ],
      power: POWER.whirl,
      path: [[-1, 0, 4]],
      end: -1,
    },
    MON.whirlL,
  );
  b.add(
    'whirlR',
    {
      pics: [
        ['whirl1', 2],
        ['whirl2', 2],
      ],
      power: POWER.whirl,
      path: [[1, 0, 4]],
      end: -1,
    },
    MON.whirlR,
  );
  // Rolling over shakes loose a tumbleweed of corgi fluff that rolls ahead.
  b.add(
    'fluff',
    {
      pics: [
        ['fluff1', 2],
        ['fluff2', 2],
      ],
      power: POWER.fluff,
      towards: 6,
      end: 12,
      thru: true,
    },
    MON.fluff,
  );
  // Sitting pretty sends up a heart that wins anybody over.
  b.add(
    'heart',
    {
      pics: [
        ['heart1', 4],
        ['heart2', 2],
      ],
      power: POWER.heart,
      path: [[0, -3, 3]],
      end: -1,
    },
    MON.heart,
  );
  b.add(
    'puff',
    {
      pics: [
        ['puff1', 3],
        ['puff2', 3],
      ],
      power: 0,
      end: 6,
    },
    MON.puff,
  );

  // Things to collect.
  b.add(
    'treat',
    {
      pics: [
        ['treat1', 8],
        ['treat2', 8],
      ],
      power: POWER.pickup,
    },
    MON.treat,
  );
  b.add(
    'bone',
    {
      pics: [
        ['bone1', 9],
        ['bone2', 9],
      ],
      power: POWER.pickup,
    },
    MON.bone,
  );
  b.add(
    'ticket',
    {
      pics: [
        ['ticket1', 7],
        ['ticket2', 7],
      ],
      power: POWER.pickup,
    },
    MON.ticket,
  );
  b.add(
    'ticketFall',
    {
      pics: [
        ['ticket1', 2],
        ['ticket2', 2],
      ],
      power: POWER.pickup,
      path: [[0, 1, 3]],
      end: -1,
      becomes: 'ticket',
    },
    MON.ticketFall,
  );
  b.add(
    'treatFall',
    {
      pics: [
        ['treat1', 2],
        ['treat2', 2],
      ],
      power: POWER.pickup,
      path: [[0, 1, 3]],
      end: -1,
      becomes: 'treat',
    },
    MON.treatFall,
  );

  // Gwin, Teddy's big sister: she gobbles a treat when she bumps into him, then runs off
  // giggling for a while before coming back for more.
  b.add(
    'gwin',
    {
      pics: [
        ['gwin1', 3],
        ['gwin2', 3],
        ['gwin3', 3],
        ['gwin2', 3],
      ],
      power: POWER.friend - 1,
    },
    MON.gwin,
  );
  b.add(
    'gwinGone',
    {
      pics: [
        ['gwinRun1', 2],
        ['gwinRun2', 2],
      ],
      power: POWER.friend - 1,
      end: 40,
    },
    MON.gwinGone,
  );
  void FLIP;
}
