// Level 3: MEANWHILE... Gwinn's Night Out, the night of the Big Show. Gwinn (gwinn.chr) slips
// out the doggy door after the parade, chews through the rope on the back gate, BOOFs a
// raccoon out of the alley's trash, crosses the park by lamplight (flop when the owl
// swoops), knocks a pile of boxes flat with her zoomies, digs big under the playground's
// tall fence, gets past a skunk, chews the rope on the hay wagon's tailgate and hops into
// the hay: the Klown Klub's wagon, bound for the Fair. Corn dogs smell like the Fair.
//
// The blocks are in level3Tiles.ts, the monsters in level3Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, nightRow, nightTiles } from './level3Tiles';
import { nightBeasts } from './level3Beasts';

export function night(): Level {
  const bs = nightTiles();
  const beasts = nightBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => nightRow(y));
  m.set(30, 27, 'moon00').set(31, 27, 'moon10').set(30, 28, 'moon01').set(31, 28, 'moon11');
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 99 - G, (_x, y) => (y < G + 4 ? 'dirt' : 'deep'));
  for (let x = 0; x < 100; x++) if (m.get(x, 39).startsWith('sky')) m.set(x, 39, x % 5 === 2 ? 'flower' : 'tuft');

  // Doc Leo's house (dark), its doggy door, Teddy asleep in his doghouse.
  m.rect(0, 30, 3, 10, 'house');
  m.set(1, 32, 'houseWin').set(1, 36, 'houseWin');
  m.set(2, 39, 'doggyDoor');
  m.set(6, 38, 'dogHouse00').set(7, 38, 'dogHouse10').set(6, 39, 'dogHouse01').set(7, 39, 'dogHouse11');
  // the back fence, five boards high, and its gate (the rope knot is a monster)
  const fence = 12;
  m.set(fence, 34, 'fenceTop');
  for (let y = 35; y < 39; y++) m.set(fence, y, 'fence');
  m.set(fence, 39, 'gate');

  // The alley: trash cans, a sign Gwinn can't read.
  m.set(15, 39, 'can').set(19, 39, 'can').set(21, 39, 'can');
  m.set(23, 39, 'signSit');

  // The park: trees (an owl in the big one), lamp posts, a bench, the pond.
  const tree = (x: number, h: number) => {
    for (let y = 39 - h; y < 40; y++) m.set(x, y, y > 36 ? 'trunk' : 'trunk2');
    for (let dy = -3; dy <= 0; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy + 1) < 4) m.set(x + dx, 39 - h + dy, dy < -1 ? 'leaf' : 'leaf2');
  };
  tree(28, 4);
  tree(36, 5);
  tree(57, 4);
  for (const x of [26, 33, 42, 51, 61]) m.set(x, 38, 'lampTop').set(x, 39, 'lampPost');
  m.set(39, 39, 'bench');
  const pond = [44, 49];
  for (let x = pond[0]; x <= pond[1]; x++) {
    m.set(x, 39, 'surface0');
    m.set(x, G, 'pond0').set(x, G + 1, 'pond0');
    m.set(x, G + 2, 'bank');
  }
  m.set(pond[0] - 1, 39, 'reeds').set(pond[1] + 1, 39, 'reeds');
  // the playground: its tall fence (seven high) with hard clay at its foot, a tunnel under
  const pf = 67;
  m.set(pf, 32, 'chainTop');
  for (let y = 33; y < 40; y++) m.set(pf, y, 'chain');
  m.set(pf - 1, G, 'hole');
  m.rect(pf - 1, G + 1, 3, 1, 'tunnel');
  m.set(pf + 1, G, 'hole');
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) m.set(pf - 4 + bx, 37 + by, `play${bx}${by}`);

  // The park's east gate: the hay wagon behind a pickup. The tailgate is tied with rope.
  const wagon = 84;
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 2; by++) m.set(wagon + bx, 38 + by, `wagon${bx}${by}`);
  m.set(wagon + 4, 38, 'pickup00').set(wagon + 5, 38, 'pickup10').set(wagon + 4, 39, 'pickup01').set(wagon + 5, 39, 'pickup11');
  m.set(wagon - 2, 39, 'signFair');
  m.rect(92, 30, 8, 10, 'hedgeWall');
  m.rect(92, 29, 8, 1, 'hedgeTop');

  // Monsters.
  m.mon(fence, 39, 'rope');
  m.mon(17, 39, 'raccoon');
  m.mon(54, 39, 'boxes');
  m.mon(pf - 1, G, 'clay');
  m.mon(75, 39, 'skunk');
  m.mon(wagon, 39, 'rope');
  for (const [x, y] of [
    [30, 34],
    [40, 33],
    [47, 35],
    [60, 34],
    [72, 33],
    [79, 35],
  ])
    m.mon(x, y, 'firefly');
  for (const [x, y] of [
    [24, 36],
    [46, 36],
    [70, 36],
  ])
    m.mon(x, y, 'poodle');
  // the owl's hollow sends a swoop low across the path now and then (a block giving birth)
  m.set(36, 35, 'owlHole');
  bs.def('owlHole').birthMon = beasts.id('swoop');
  bs.def('owlHole').birthTime = 64;
  const treats: [number, number][] = [
    [5, 39],
    [9, 37],
    [10, 37],
    [14, 39],
    [16, 39],
    [18, 39],
    [20, 39],
    [27, 39],
    [29, 39],
    [31, 39],
    [35, 39],
    [37, 39],
    [41, 39],
    [44, 37],
    [46, 37],
    [48, 37],
    [52, 39],
    [56, 39],
    [59, 39],
    [63, 39],
    [69, 39],
    [71, 39],
    [78, 39],
    [80, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  for (const [x, y] of [
    [34, 39],
    [64, 39],
  ])
    m.treat(x, y, 'bone');
  m.mark('start', 4, 39);
  m.mark('exit', wagon + 1, 39);
  return {
    file: 'night',
    hero: 'gwinn',
    title: "Gwinn's Night Out",
    time: 'night',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [44, 35],
    pose: [53, 39, 'gwinnRun1'],
    outro: 'wagon.fli',
  };
}
