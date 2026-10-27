// The front of house: floors, walls, the doors and gates (locked ones open for a key, used
// up; the green room door holds the evidence while Ada is inside), stairs, seats, the
// orchestra rail and the footlights. Returns the floors the other areas draw on.
import { microC } from '../art/draw';
import { c } from '../art/pal';
import { CTR } from '../ids';
import {
  Add,
  S,
  T,
  backdrop,
  boards,
  carpet,
  closedDoor,
  doorway,
  flagstones,
  footlight,
  legs,
  marble,
  on,
  pitBoards,
  rail,
  rug,
  sconce,
  seat,
  stageBoards,
  stoneFace,
  wallFace,
  wallTop,
} from './painters';

export function addHouse(add: Add) {
  // Floors
  const B = boards(1);
  add('boards', B);
  add('boards2', boards(6));
  const ST = stageBoards(2);
  add('stage', ST);
  add(
    'stage2',
    on(ST, (p) => p.rect(8, 9, 5, 2, c('glow', 2)).rect(9, 8, 2, 4, c('glow', 2))),
  ); // spike tape
  const CP = carpet(0);
  add('carpet', CP);
  add('marble', marble());
  add('pit', pitBoards(3));
  const RG = rug('plum');
  add('rug', RG);
  add('rug2', rug('green'));
  add('litfloor', flagstones(5));
  add('litfloor2', flagstones(6));

  // Walls
  add('void', T(0), S);
  add('walltop', wallTop(), S);
  add('wall', wallFace(0), S);
  add('wall2', wallFace(1), S);
  add('sconce', sconce(), S);
  add('litwall', stoneFace(), S);
  for (let i = 0; i < 3; i++) add(`backdrop${i}`, backdrop(i), S);
  add('legs', legs(), S);

  // Doors and gates
  add('door_crane', doorway('STAR'));
  add('door_lila', doorway('LILA'));
  add('door_chorus', doorway('CAST'));
  add('door_props', doorway('PROPS'));
  add('door_watch', doorway('WATCH'));
  add('doorway', doorway('', CP));
  add('door_booth', doorway('BOOTH', B));
  add('office_open', doorway('CRANE'));
  // Locked: a key from the ring opens it for good (the key is used up).
  add('office_locked', closedDoor('CRANE'), { ...S, effect: CTR.keys, eamt: -1, touch: 'office_open', score: 25 });
  // The green room door counts the evidence: it takes it as Ada pushes and gives it back
  // when she pushes again (the second push swings it open), so nothing is lost.
  add('green_open', doorway('GREEN', B));
  for (const [act, need] of [
    [1, 4],
    [2, 8],
  ]) {
    add(
      `green_ajar${act}`,
      on(closedDoor('GREEN', 'green'), (p) => p.rect(15, 9, 3, 11, c('glow', 3)).rect(16, 9, 1, 11, c('glow', 4))),
      { ...S, effect: CTR.evidence, eamt: need, touch: 'green_open' },
    );
    add(`green_shut${act}`, closedDoor('GREEN', 'green'), { ...S, effect: CTR.evidence, eamt: -need, touch: `green_ajar${act}` });
  }
  add('pitdoor_shut', closedDoor('PIT', 'panel'), S);
  add('pitdoor', doorway('PIT', B));
  add(
    'shutter',
    on(wallFace(), (p) => {
      p.rect(1, 3, 18, 15, c('gray', 2));
      for (let y = 4; y < 18; y += 2) p.rect(1, y, 18, 1, c('gray', 1));
      p.rect(4, 8, 12, 5, c('paper', 4));
      microC(p, 10, 8, 'SHUT', c('velvet', 2));
    }),
    S,
  );
  add('cloak_open', doorway('COATS', B));
  add(
    'rope',
    on(CP, (p) => {
      p.rect(2, 6, 3, 12, c('gold', 2)).rect(15, 6, 3, 12, c('gold', 2));
      p.disc(3, 6, 2, c('gold', 4)).disc(16, 6, 2, c('gold', 4));
      for (let x = 4; x < 16; x++) p.rect(x, 8 + Math.round(Math.sin(((x - 4) / 11) * Math.PI) * 3), 1, 2, c('velvet', 5));
    }),
    S,
  );
  const stairs = T();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) stairs.set(x, y, c('wood', y % 5 === 0 ? 0 : 1 + Math.floor((19 - y) / 5)));
  add('stairs', stairs);
  add(
    'boarded',
    on(stairs, (p) => {
      p.rect(0, 3, 20, 4, c('wood', 4)).rect(0, 12, 20, 4, c('wood', 3));
      p.set(2, 5, c('gray', 5)).set(17, 5, c('gray', 5)).set(2, 14, c('gray', 5)).set(17, 14, c('gray', 5));
    }),
    S,
  );
  add(
    'glassdoor',
    on(T(c('rain', 1)), (p) => {
      p.frame(0, 0, 20, 20, c('gold', 2)).frame(1, 1, 18, 18, c('gold', 1));
      for (let i = 0; i < 6; i++) p.line(3 + i * 3, 2, 1 + i * 3, 17, c('rain', 3));
      p.rect(14, 8, 2, 4, c('gold', 4));
    }),
    S,
  );
  add(
    'stagedoor',
    on(closedDoor('STAGE', 'gray'), (p) => {
      for (let x = 0; x < 20; x++) p.set(x, 11 + Math.floor(x / 4), c('glow', 4)).set(x, 12 + Math.floor(x / 4), c('black', 0));
    }),
    S,
  );
  add(
    'pitgate',
    on(carpet(3), (p) => {
      p.rect(0, 7, 3, 3, c('gold', 3)).rect(17, 7, 3, 3, c('gold', 3));
      p.line(3, 8, 9, 2, c('gold', 2));
    }),
  );

  // Seats, rail, footlights
  add('seat', seat(), S);
  add('rail', rail(), S);
  add('footlight', footlight(0), { ...S, next: 'footlight2', ntime: 9 });
  add('footlight2', footlight(1), { ...S, next: 'footlight', ntime: 7 });
  return { B, ST, RG, stairs };
}
