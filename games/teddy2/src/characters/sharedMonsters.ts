// The monsters every level shares, at the same numbers in every .MON: what Teddy's and
// Gwinn's tricks send out, treats and bones, tickets, and buried things to dig up.
import { CTR, MON, POWER } from '../ids';
import { Bestiary, FLIP } from './mons';
import { FX } from '../sprites/fx';
import { Pixels } from '../../../kit/pixels';
import { over, shadeAt, sprite } from '../art/draw';
import { c, dirt, r } from '../blocks/tiles';

export function commonMonsters(b: Bestiary): void {
  for (const [name, px] of Object.entries(FX)) {
    if (name.startsWith('treat')) b.pic(name, px, { effect: CTR.treats, eamt: 1, score: 10 });
    else if (name.startsWith('bone')) b.pic(name, px, { hp: 25, score: 50 });
    else if (name.startsWith('ticket')) b.pic(name, px, { effect: CTR.tickets, eamt: 1, score: 25 });
    else if (name.startsWith('poodle')) b.pic(name, px, { hp: 10, score: 250 });
    else b.pic(name, px);
  }

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
  // A sniff: a little whirl of nose that drifts ahead and finds whatever is hidden there.
  b.add(
    'sniff',
    {
      pics: [
        ['sniff1', 2],
        ['sniff2', 2],
      ],
      power: POWER.sniff,
      towards: 2,
      end: 14,
      thru: true,
    },
    MON.sniff,
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
    'poodle',
    {
      pics: [
        ['poodle1', 6],
        ['poodle2', 6],
      ],
      power: POWER.pickup,
    },
    MON.poodle,
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

  // Gwinn's tricks (gwinn.chr). BOOF: a big bark that rolls ahead and clears out bigger pests.
  b.add(
    'boof',
    {
      pics: [
        ['boof1', 2],
        ['boof2', 2],
      ],
      power: POWER.boof,
      towards: 10,
      end: 10,
      thru: true,
    },
    MON.boof,
  );
  // CHOMP: she chews through whatever is right in front of her (ropes, boxes, hay twine).
  b.add(
    'chomp',
    {
      pics: [
        ['chomp1', 2],
        ['chomp2', 3],
      ],
      power: POWER.chomp,
      towards: 3,
      end: 7,
    },
    MON.chomp,
  );
  // A big dig: through the block under her, even hard clay.
  b.add(
    'bigDig',
    {
      pics: [
        ['bigdig1', 2],
        ['bigdig2', 2],
      ],
      power: POWER.bigDig,
      end: 6,
    },
    MON.bigDig,
  );
  // Zoomies: a dust devil tears off to each side and bowls over anything in the way.
  for (const [name, dx] of [
    ['zoomL', -3],
    ['zoomR', 3],
  ] as const)
    b.add(
      name,
      {
        pics: [
          ['zoom1', 2],
          ['zoom2', 2],
        ],
        power: POWER.zoom,
        path: [[dx, 0, 9, dx < 0 ? FLIP : 0]],
        end: -1,
      },
      MON[name],
    );
  // Her sit: a little puff of almost. It beats nothing.
  b.add(
    'almost',
    {
      pics: [
        ['almost1', 3],
        ['almost2', 3],
      ],
      power: 0,
      end: 9,
    },
    MON.almost,
  );
  // Soft dirt with paw prints (dig it out), and bones buried with one end sticking out.
  const soft = new Pixels(20, 20);
  over(soft, dirt(31));
  for (let y = 0; y < 6; y++) for (let x = 0; x < 20; x++) soft.set(x, y, shadeAt(r('dirt'), 2, 4, 1 - y / 6, x, y));
  for (const [x, y] of [
    [4, 9],
    [13, 12],
  ])
    soft
      .rect(x, y, 3, 2, c('dirt', 0))
      .set(x - 1, y - 2, c('dirt', 0))
      .set(x + 1, y - 3, c('dirt', 0))
      .set(x + 3, y - 2, c('dirt', 0));
  b.pic('soft', soft, { solid: 15 });
  // A bone sticking out of the lawn.
  b.pic('buried', sprite(['oo.....', 'owwo...', 'owwwo..', '.owwwo.', '..owwwo', '...owwo', '....oo.'], { o: c('ink', 0), w: c('fur', 2) }, 7, 0));
  b.pic('bonePop', b.mb.pic('bone1'));
  b.add('plug', { pics: [['soft', 50]], power: POWER.plug, becomes: 'puff', upscore: 10 });
  b.add('buried', { pics: [['buried', 50]], power: POWER.plug, becomes: 'bonePop', upscore: 10 });
  b.add('bonePop', { pics: [['bonePop', 2]], power: POWER.pickup, path: [[0, -1, 4]], end: -1, becomes: 'bone' });
}
