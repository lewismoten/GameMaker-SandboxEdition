// The Living Room (the Live Wire Egg from Ohm Sweet Ohm): Dad's Weather System, The End?, It
// Was Probably The Lighting, and Alone With a Broken Bulb.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, figure, floor, gwinn, on, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

function couch(under: Pixels, half: 0 | 1): Pixels {
  const p = on(under);
  p.rect(0, 5, 20, 11, c('teal', 2)).rect(0, 5, 20, 2, c('teal', 3)).rect(0, 16, 20, 2, c('teal', 1));
  p.rect(half ? 16 : 0, 3, 4, 14, c('teal', 1));
  p.rect(half ? 2 : 6, 9, 12, 5, c('teal', 3));
  return p;
}

function endTable(under: Pixels): Pixels {
  const p = on(under);
  p.rect(1, 3, 18, 3, c('wood', 3)).rect(2, 6, 2, 13, c('wood', 2)).rect(16, 6, 2, 13, c('wood', 2));
  // Jenny underneath, drawing with crayons
  p.rect(7, 10, 5, 5, c('skin', 3)).rect(7, 9, 5, 2, c('yellow', 3)).rect(6, 15, 7, 4, c('pink', 3));
  p.line(13, 17, 15, 15, c('red', 3)).line(14, 18, 16, 16, c('blue', 3));
  return p;
}

/** Jenny's drawing, on the fridge door: Jenny, her mother, and a brown cloud named Dad. */
function fridge(withDrawing: boolean): Pixels {
  const p = new Pixels(20, 20, c('grey', 5));
  p.frame(0, 0, 20, 20, c('grey', 2)).rect(0, 7, 20, 1, c('grey', 2)).rect(16, 2, 2, 4, c('grey', 2)).rect(16, 10, 2, 7, c('grey', 2));
  if (withDrawing) {
    p.rect(2, 8, 13, 11, c('paper', 4));
    p.rect(3, 13, 1, 4, c('pink', 2)).disc(3.5, 11, 1.5, c('yellow', 3)); // Jenny
    p.rect(6, 12, 2, 5, c('purple', 3)).disc(7, 10, 1.5, c('brown', 3)); // her mother
    blob(p, 11.5, 12, 3, 2.5, r('brown'), 1, 2); // Dad
    micro(p, 9, 15 - 1, 'DAD', c('brown', 0));
    p.disc(14, 1, 1, c('red', 3)); // a fridge magnet
  }
  return p;
}

function tv(under: Pixels, dead: boolean, frame = 0): Pixels {
  const p = on(under);
  bevel(p, 1, 3, 18, 14, r('wood'), 2, 1);
  p.rect(3, 5, 12, 10, dead ? c('ink', 0) : c('blue', 1 + frame));
  if (!dead) for (let y = 5; y < 15; y += 2) p.rect(3, y, 12, 1, c('blue', 3 - frame));
  p.disc(17, 7, 1, c('brass', 3)).disc(17, 11, 1, c('brass', 3));
  p.line(6, 2, 4, 0, c('grey', 3)).line(12, 2, 14, 0, c('grey', 3));
  return p;
}

function recliner(under: Pixels): Pixels {
  const p = on(under, figure({ shirt: ['blue', 3], pants: ['brown', 1], hair: ['brown', 1], face: 'happy' }));
  p.rect(0, 12, 20, 8, c('brown', 2)).rect(0, 12, 20, 1, c('brown', 3)).rect(0, 8, 3, 12, c('brown', 1)).rect(17, 8, 3, 12, c('brown', 1));
  return p;
}

function gasCloud(frame: number): Pixels {
  const p = blank();
  for (const [x, y, rr] of [[7, 10, 5], [12, 8, 5], [14, 13, 4], [6, 14, 3.5]]) blob(p, x + frame, y, rr, rr * 0.85, r('brown'), 1, 3);
  if (frame) micro(p, 0, 0, 'RMBL', c('yellow', 3));
  return p;
}

function twisterMat(): Pixels {
  const p = new Pixels(20, 20, c('paper', 4));
  const cols = ['red', 'blue', 'yellow', 'green'];
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.disc(5 + x * 10, 5 + y * 10, 4, c(cols[(x + y * 2) % 4], 3));
  return p;
}

function armchairCube(under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 1, 5, 18, 14, r('purple'), 2, 2);
  p.rect(4, 8, 12, 6, c('purple', 3));
  p.rect(8, 3, 5, 5, c('red', 3)).rect(8, 3, 2, 2, c('yellow', 3)).rect(11, 6, 2, 2, c('blue', 3)).rect(8, 6, 2, 2, c('green', 3));
  return p;
}

function recordPlayer(frame: number, under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 1, 8, 18, 10, r('wood'), 3, 1);
  p.disc(9, 10, 6, c('ink', 0)).disc(9, 10, 2, c('red', 3));
  p.set(9 + (frame ? 3 : -3), 8, c('grey', 4));
  p.line(16, 6, 12, 10, c('tin', 5));
  return p;
}

function windowTwister(): Pixels {
  const p = wall('wallpaper', 'orange', 3);
  p.rect(3, 2, 14, 12, c('ink', 0)).rect(4, 3, 12, 10, c('sky', 1));
  for (let y = 3; y < 13; y++) p.rect(10 - (13 - y) * 0.4, y, 1 + (13 - y) * 0.8, 1, c('grey', 2));
  return p;
}

function tornado(frame: number): Pixels {
  const p = blank();
  for (let y = 1; y < 19; y++) {
    const w = 1 + (19 - y) * 0.45;
    const x = 10 + Math.sin(y * 0.5 + frame * 2) * 2;
    p.rect(Math.round(x - w), y, Math.round(w * 2), 1, c('grey', y % 3 ? 2 : 3));
  }
  return p;
}

function dancer(step: number): Pixels {
  return figure({ shirt: ['yellow', 3], pants: ['blue', 2], hair: ['ink', 1], arms: step ? 'up' : 'out', face: 'happy' }, step);
}

function seated(under: Pixels, shirt: string, hair: [string, number]): Pixels {
  const p = on(under, figure({ shirt: [shirt, 3], pants: ['ink', 1], hair, face: 'sad' }));
  p.rect(2, 13, 16, 3, c('wood', 2)).rect(2, 16, 2, 3, c('wood', 1)).rect(16, 16, 2, 3, c('wood', 1));
  return p;
}

function coatRack(under: Pixels): Pixels {
  const p = on(under);
  p.rect(9, 2, 2, 16, c('wood', 1)).rect(6, 18, 8, 1, c('wood', 1)).rect(6, 2, 8, 1, c('wood', 2));
  p.rect(10, 3, 7, 11, c('yellow', 3)).rect(10, 3, 7, 1, c('yellow', 2)); // Nancy's yellow coat
  return p;
}

function lawyerDesk(under: Pixels): Pixels {
  const p = on(under);
  p.rect(0, 9, 20, 7, c('wood', 1)).rect(0, 9, 20, 1, c('wood', 3));
  p.rect(5, 5, 10, 4, c('paper', 4));
  micro(p, 6, 5, 'WILL', c('ink', 0));
  return p;
}

function lamp(under: Pixels, lit: boolean): Pixels {
  const p = on(under);
  if (lit) blob(p, 10, 9, 9, 8, r('yellow'), 0, 2);
  p.rect(6, 3, 8, 5, c('paper', 3)).rect(9, 8, 2, 9, c('brass', 2)).rect(6, 17, 8, 2, c('brass', 1));
  return p;
}

const courier = (step: number) => figure({ shirt: ['yellow', 1], pants: ['brown', 1], hat: { kind: 'cap', color: ['brown', 2] }, arms: 'out', hair: ['ink', 1] }, step);

function closetShelf(): Pixels {
  const p = new Pixels(20, 20, c('ink', 1));
  for (const y of [6, 13]) p.rect(0, y, 20, 2, c('wood', 1));
  p.rect(2, 1, 7, 5, c('brown', 1)).rect(11, 2, 6, 4, c('brown', 0)).rect(3, 9, 10, 4, c('brown', 1));
  return p;
}

function brokenBulb(under: Pixels): Pixels {
  const p = on(under);
  p.rect(9, 0, 1, 4, c('grey', 2)).rect(8, 4, 4, 3, c('grey', 3));
  p.line(7, 7, 6, 12, c('grey', 4)).line(12, 7, 14, 11, c('grey', 4)).line(6, 12, 9, 10, c('grey', 4)).line(14, 11, 11, 13, c('grey', 4));
  p.set(5, 15, c('grey', 4)).set(13, 17, c('grey', 4));
  return p;
}

function lightSwitch(): Pixels {
  const p = wall('panel');
  p.rect(7, 6, 6, 9, c('paper', 4)).rect(9, 8, 2, 4, c('grey', 2));
  return p;
}

function alexa(frame: number, under: Pixels): Pixels {
  const p = on(under);
  p.rect(6, 6, 8, 12, c('ink', 1)).rect(6, 6, 8, 2, frame ? c('sky', 4) : c('blue', 3));
  for (let y = 9; y < 17; y += 2) p.rect(7, y, 6, 1, c('ink', 0));
  return p;
}

function moth(frame: number): Pixels {
  const p = blank();
  p.rect(9, 8, 2, 6, c('brown', 3));
  if (frame) p.rect(3, 6, 6, 5, c('grey', 4)).rect(11, 6, 6, 5, c('grey', 4));
  else p.rect(5, 10, 4, 6, c('grey', 4)).rect(11, 10, 4, 6, c('grey', 4));
  return p;
}

function art(a: Area): void {
  // Dad's Weather System
  a.tile('rug', floor('carpet', 2, 'brown'));
  a.solid('livWall', wall('wallpaper', 'orange', 1));
  a.solid('couchL', couch(a.tiles.pic('rug'), 0));
  a.solid('couchR', couch(a.tiles.pic('rug'), 1));
  a.solid('endtable', endTable(a.tiles.pic('rug')));
  a.solid('fridge', fridge(false));
  a.solid('fridgeArt', fridge(true));
  a.solid('tvOn', tv(a.tiles.pic('rug'), false, 0), { next: 'tvOn2', ntime: 3 });
  a.solid('tvOn2', tv(a.tiles.pic('rug'), false, 1), { next: 'tvOn', ntime: 3 });
  a.solid('recliner', recliner(a.tiles.pic('rug')));
  a.prop('mom', 'rug', figure({ shirt: ['purple', 3], dress: true, hair: ['brown', 2], hairStyle: 'bun', arms: 'out' }));
  sign(['THAT WASN\'T', 'THUNDER', '-MOM'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`thunder${i}`, px));
  a.monster('gas', [[gasCloud(0), 8], [gasCloud(1), 8]], { hazard: true, path: [[3, 0, 1], [0, 2, 1], [-3, 0, 1], [0, -2, 1]] });

  // The End?
  a.tile('mat', twisterMat());
  a.tile('partyfloor', floor('parquet', 3));
  a.solid('partyWall', wall('wallpaper', 'purple', 2));
  a.solid('twistWindow', windowTwister());
  a.solid('cubechair', armchairCube(a.tiles.pic('partyfloor')));
  a.solid('deadTV', tv(a.tiles.pic('partyfloor'), true));
  a.solid('record0', recordPlayer(0, a.tiles.pic('partyfloor')), { next: 'record1', ntime: 3 });
  a.solid('record1', recordPlayer(1, a.tiles.pic('partyfloor')), { next: 'record0', ntime: 3 });
  a.prop('sister', 'partyfloor', figure({ shirt: ['red', 2], dress: true, hair: ['ink', 1], hairStyle: 'pigtails', face: 'happy' }));
  sign(['THEME:', 'TWIST', '(OBVIOUSLY)'], 3, { board: 'yellow' }).forEach((px, i) => a.solid(`theme${i}`, px));
  a.monster('twister', [[tornado(0), 3], [tornado(1), 3]], { hazard: true, path: [[4, 0, 1], [0, 2, 1], [-4, 0, 1], [0, -2, 1]] });
  a.monster('dancer', [[dancer(0), 6], [dancer(1), 6]], { path: [[2, 0, 1], [-2, 0, 1]] });

  // It Was Probably The Lighting
  a.tile('studyrug', floor('carpet', 6, 'red'));
  a.solid('studyWall', wall('panel'));
  a.solid('francis', seated(a.tiles.pic('studyrug'), 'green', ['brown', 2]));
  a.solid('aunt', seated(a.tiles.pic('studyrug'), 'purple', ['grey', 4]));
  a.solid('cousin', seated(a.tiles.pic('studyrug'), 'blue', ['yellow', 3]));
  a.solid('rack', coatRack(a.tiles.pic('studyrug')));
  a.solid('lawyer', lawyerDesk(a.tiles.pic('studyrug')));
  a.solid('lampLit', lamp(a.tiles.pic('studyrug'), true));
  sign(['BEING OF SOUND', 'BODY AND MIND', '-UNCLE JOE'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`will${i}`, px));
  a.monster('courier', [[courier(0), 5], [courier(1), 5]], { path: [[0, 3, 1], [3, 0, 1], [0, -3, 1], [-3, 0, 1]] });

  // Alone With a Broken Bulb
  a.tile('closet', floor('dark', 4));
  a.solid('closetShelf', closetShelf());
  a.solid('bulb', brokenBulb(a.tiles.pic('closet')));
  a.solid('switch', lightSwitch());
  a.solid('alexa0', alexa(0, a.tiles.pic('closet')), { next: 'alexa1', ntime: 8 });
  a.solid('alexa1', alexa(1, a.tiles.pic('closet')), { next: 'alexa0', ntime: 8 });
  a.prop('george', 'closet', figure({ shirt: ['grey', 3], pants: ['brown', 1], hair: ['grey', 2], arms: 'out', face: 'sad' }));
  sign(['IDEAS:', 'PLEASE', 'UPGRADE'], 3, { board: 'grey' }).forEach((px, i) => a.solid(`idea${i}`, px));
  a.monster('moth', [[moth(0), 2], [moth(1), 2]], { hazard: true, path: [[2, 0, 2], [0, 2, 2], [-2, 0, 2], [0, -2, 2]] });

  // the hallway's guest: Gwinn, looking for a couch to sleep on
  a.monster('gwinnNap', [[gwinn(0), 4], [gwinn(1), 4]], { path: [[5, 0, 2], [-5, 0, 2]] });
}

export const LIVING: WingSpec = {
  wing: WINGS[4],
  tint: 'orange',
  egg: [['orange', 2], ['ink', 1], ['yellow', 3]],
  signs: [
    ['THE COUCH IS', 'NOT A BED.', 'YES, GWINN.'],
    ['HOME IS WHERE', 'THE BOOKS', 'ARE'],
  ],
  guest: 'gwinnNap',
  art,
  books: [
    {
      n: 2,
      floor: 'rug',
      rows: [
        '#wwwwww123wwwww#',
        '#o..F.......f..#',
        '#~..........+..#',
        '#..Qq.e..t...o.#',
        '#*......G......#',
        '#+..o...@..m...#',
        '#.....r......~.#',
        '#o..+......*..o#',
        '#..~...+.......E',
        '#####X#########L',
      ],
      legend: {
        w: 'livWall',
        F: 'fridgeArt',
        f: 'fridge',
        Q: 'couchL',
        q: 'couchR',
        e: 'endtable',
        t: 'tvOn',
        r: 'recliner',
        m: 'mom',
        '1': 'thunder0',
        '2': 'thunder1',
        '3': 'thunder2',
        G: { tile: '.', mon: 'gas' },
      },
      note: 'A large rumbling in the corner of the room. Dad says thunder. Mom says otherwise. Avoid the brown cloud. Do not ask.',
      twist: {
        grid: [['fridgeArt']],
        caption: ['FIG. 2: Jenny, her mother, and a', 'scribbled brown cloud named Dad.'],
      },
    },
    {
      n: 21,
      floor: 'partyfloor',
      rows: [
        '#ppWpp123ppWppp#',
        '#o...........+.#',
        '#.mmm....C...~.#',
        '#.mmm.......~..#',
        '#*......T......#',
        '#+...D..@...d..#',
        '#~.........s...#',
        '#o..+...q...*.o#',
        '#o.......o....+E',
        '###X###########L',
      ],
      legend: {
        p: 'partyWall',
        W: 'twistWindow',
        m: 'mat',
        C: 'cubechair',
        d: 'deadTV',
        q: 'record0',
        s: 'sister',
        '1': 'theme0',
        '2': 'theme1',
        '3': 'theme2',
        T: { tile: '.', mon: 'twister' },
        D: { tile: '.', mon: 'dancer' },
      },
      note: 'Oliver Twist\'s party. Twister, a Rubik\'s Cube, tongue twisters, Chubby Checker. Outside, a twister. Inside, also a twister. It takes words.',
      twist: {
        grid: [
          ['twistWindow', 'deadTV', 'record0'],
          ['m:twister#0', 'sister', 'cubechair'],
        ],
        caption: ['FIG. 21: "But it is the theme,', 'isn\'t it?" she chuckled.'],
      },
    },
    {
      n: 22,
      floor: 'studyrug',
      rows: [
        '#ss123sssssssss#',
        '#o......l.....+#',
        '#.fac.fac..*...#',
        '#~.............#',
        '#.fac.fac...R..#',
        '#+.o....@......#',
        '#..S......K..~.#',
        '#o...+.......o.#',
        '#*..o..~.+.....E',
        '#######X#######L',
      ],
      legend: {
        s: 'studyWall',
        f: 'francis',
        a: 'aunt',
        c: 'cousin',
        R: 'rack',
        l: 'lawyer',
        K: 'lampLit',
        '1': 'will0',
        '2': 'will1',
        '3': 'will2',
        S: { tile: '.', mon: 'courier' },
      },
      note: 'The reading of Uncle Joe\'s will. Everyone is immorally dressed except the guy in the yellow shirt. There is no guy in a yellow shirt. Yet.',
      twist: {
        grid: [
          ['lampLit', 'm:courier#0', 'rack'],
          ['francis', 'lawyer', 'aunt'],
        ],
        caption: ['FIG. 22: An almost yellow shirt.', 'It was probably the lighting.'],
      },
    },
    {
      n: 14,
      floor: 'closet',
      rows: [
        '#hhhh123hhhhhhh#',
        '#o.....b.....+.#',
        '#..........M...#',
        '#~..h.......o..#',
        '#*....g........#',
        '#+..o...@...~..#',
        '#....h.....Aw..#',
        '#o..+......*...#',
        '#~.......+....oE',
        '#X#############L',
      ],
      legend: {
        h: 'closetShelf',
        b: 'bulb',
        w: 'switch',
        g: 'george',
        A: 'alexa0',
        M: { tile: '.', mon: 'moth' },
        '1': 'idea0',
        '2': 'idea1',
        '3': 'idea2',
      },
      note: 'A closet. George, an idea, a broken bulb. It is very dark. Somewhere there is a light switch. Somewhere there is Alexa.',
      twist: {
        grid: [
          ['bulb', 'closet', null],
          ['george', 'switch', 'alexa0'],
        ],
        caption: ['FIG. 14: Looking for a light switch.', 'Most people talk to Alexa.'],
      },
    },
  ],
};
