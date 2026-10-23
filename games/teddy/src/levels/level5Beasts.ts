// Level 5's monsters, each one a lock that only one trick opens, by the power ladder in
// ids.ts (a monster dies when it touches a stronger one, and is reborn as its 'becomes'):
// - Honker's hand (108) wants a high five (the paw, 110) and becomes a falling ticket;
// - Bubbles asks for a sit (125, beaten only by the heart, 130) and drops a ticket;
// - Twirly asks for a spin (113, beaten by the whirl, 115) and becomes a ticket;
// - the bowling pins (117) fall only to a rolling fluff ball (120), into pins lying down
//   that never die and nothing can beat (end -2, power 210);
// - the Pie-O-Matic's pies are projectiles (play dead to let them pass);
// - Gwinn holds the nose at 124: the heart beats her too, and she becomes Gwinn sitting
//   with the nose at her feet, then (touched, at power 2) a happy Gwinn.
import { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { askBubble, hand } from '../sprites/folks';
import { CK, propSprite } from '../sprites/klown';
import { bubble, gwinnSits, pie, pinStack, pinsDown } from '../sprites/klubfolk';
import { GWINN } from '../sprites/gwinn';
import { revolvingDoor } from './level4Beasts';
import { P_ } from './level5';

export function klubBeasts() {
  const b = newBestiary();
  revolvingDoor(b);
  b.pic('hand', hand());
  b.pic('askSit1', askBubble('SIT?', propSprite('nose'), 0)).pic('askSit2', askBubble('SIT?', propSprite('nose'), 1));
  const ticketIcon = sprite(['oooooooooo', 'ovvvvvvvvo', 'ovGGGGGGvo', 'ovvvvvvvvo', 'oooooooooo'], { ...CK, v: P_('purple', 2), G: P_('gold', 2) }, 5, 13);
  b.pic('askTix1', askBubble('SIT?', ticketIcon, 0)).pic('askTix2', askBubble('SIT?', ticketIcon, 1));
  b.pic('askSpin1', askBubble('SPIN', ticketIcon, 0)).pic('askSpin2', askBubble('SPIN', ticketIcon, 1));
  b.pic('pins', pinStack(), { solid: 15 });
  b.pic('pinsDown', pinsDown());
  b.pic('pie1', pie(0), { hp: -8 }).pic('pie2', pie(1), { hp: -8 });
  b.pic('bubble1', bubble(0)).pic('bubble2', bubble(1));
  // Gwinn with the nose in her mouth, then sitting nicely with it at her feet.
  const gn = (pose: string) => {
    const p = new Pixels(20, 20, 255);
    p.blit(GWINN[pose], 0, 0, 255);
    p.blit(sprite(['.oo.', 'oRRo', 'oRRo', '.oo.'], CK, 17, 5), 0, 0, 255);
    return p;
  };
  b.pic('gwinnNose1', gn('gwinn1')).pic('gwinnNose2', gn('gwinn3'));
  b.pic('gwinnSitNose', gwinnSits(true, 0), { effect: CTR.props, eamt: 1, score: 500 });
  b.pic('gwinnSit1', gwinnSits(false, 0)).pic('gwinnSit2', gwinnSits(false, 1));

  b.add('hand', { pics: [['hand', 50]], power: POWER.balloon, becomes: 'ticketFall', upscore: 50 });
  b.add('askTix', {
    pics: [
      ['askTix1', 10],
      ['askTix2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'ticketFall2',
    upscore: 50,
  });
  b.add('ticketFall2', { pics: [['ticket1', 2]], power: POWER.pickup, path: [[0, 2, 3]], end: -1, becomes: 'ticket' });
  b.add('askSpin', {
    pics: [
      ['askSpin1', 10],
      ['askSpin2', 10],
    ],
    power: POWER.spinAsk,
    becomes: 'ticket',
    upscore: 50,
  });
  b.add('pins', { pics: [['pins', 50]], power: POWER.stack, becomes: 'pinsDown', upscore: 100 });
  b.add('pinsDown', { pics: [['pinsDown', 50]], power: POWER.friend + 10, end: -2 });
  b.add('pie', {
    pics: [
      ['pie1', 3],
      ['pie2', 3],
    ],
    power: POWER.projectile,
    path: [[-13, 0, 5]],
    end: -1,
  });
  b.add('bubble', {
    pics: [
      ['bubble1', 4],
      ['bubble2', 4],
    ],
    power: 0,
    path: [
      [1, -2, 1],
      [0, -4, 1],
      [1, -6, 1],
    ],
    end: -1,
  });
  // Gwinn will not give back the nose... until Teddy sits pretty, and she sits too.
  b.add('gwinnNose', {
    pics: [
      ['gwinnNose1', 6],
      ['gwinnNose2', 6],
    ],
    power: POWER.sitAsk - 1,
    becomes: 'gwinnSitNose',
    upscore: 200,
  });
  b.add('gwinnSitNose', { pics: [['gwinnSitNose', 50]], power: 2, becomes: 'gwinnGood' });
  b.add('gwinnGood', {
    pics: [
      ['gwinnSit1', 5],
      ['gwinnSit2', 5],
    ],
    power: POWER.friend + 10,
    end: -2,
  });
  return b;
}
