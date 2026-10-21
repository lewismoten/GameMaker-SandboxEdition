// Level 1: DOME SWEET DOME. Hover Heights, a subdivision of dome homes where the robots
// mow the lawns and the newspaper is fired from a cannon. Sparky has scattered Dex's
// report all over the neighborhood. The garage remote is lost in the hedge garden, the
// Zapper is in the backyard, and the Teleport-A-Phone on the corner goes to the Skyway.
// Grandpa's 1976½ CitiCar sits on its charger by the house: honk it for 1976 points.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

const LEGEND: Legend = {
  '.': 'grass',
  ',': 'flowers',
  ':': 'sidewalk',
  '|': 'roadV',
  '=': 'roadH',
  '+': 'road',
  F: 'fenceH',
  I: 'fenceV',
  o: 'post',
  h: 'hedge',
  T: 'tree',
  M: 'mailbox',
  S: 'dish',
  K: 'doghouse',
  P: 'pool',
  W: 'mowdock',
  N: 'newscannon',
  G: 'garagedoor',
  g: 'garagewall',
  B: 'booth_top',
  b: { tile: 'booth_door', mark: 'exit' },
  x: 'booth_dead',
  r: 'booth_ring',
  p: 'page_grass',
  q: 'quarter_grass',
  Q: 'quarter_sidewalk',
  '&': 'page_sidewalk',
  '*': 'pill_grass',
  a: 'battery_grass',
  z: 'zapper_grass',
  L: 'cola_grass',
  R: 'remote_grass',
  D: { big: 'dome', w: 4, h: 3 },
  E: { big: 'domeB', w: 4, h: 3 },
  C: { big: 'citi', w: 2, h: 2 },
  c: 'charger',
  H: { big: 'bbHome', w: 3, h: 2 },
  '@': { tile: 'grass', mark: 'start' },
  '1': { mon: MON.mowerH },
  '2': { mon: MON.mowerV },
  '3': { mon: MON.dog },
  '4': { mon: MON.paperbot },
  '5': { mon: MON.alien },
  '6': { mon: MON.alien2 },
  '7': { tile: 'roadH', mon: MON.skater },
  '8': { tile: 'roadV', mon: MON.skaterV },
};

//           x: 0         1         2         3         4
//              012345678901234567890123456789012345678901234567
const ROWS = [
  'oFFFFFFFFFFFFo||FFFFFFFFFFFFFFFF||FFFFFFFFFFFFFo', // 0
  'I..p..PP....aI||..EEEE.....T....||N....,....T..I', // 1
  'I.....PP.T...I||..EEEE..1.......||:..q.........I', // 2
  'I.T......,,..I||..EEEE..........||:...4........I', // 3
  'I...z....,,.qI||.,.q.......,,...8|:.......p....I', // 4
  'I.....h......I||.T....5.........||:..T.........I', // 5
  'I*.......T...I||........M.......||:.....hh.....I', // 6
  'I..p.....a...I||..2.......T.....||:.....hh..3..I', // 7
  'I............I||.....hhhh.......||:............I', // 8
  'ggggggGggggggo||.....h..h...q...||:.....5......I', // 9
  'I.DDDD...K...:||..p..h.Lh.......||:...T....q...I', // 10
  'I.DDDD...CC..:||.....h..h...6...||N.........,,.I', // 11
  'I.DDDD...CCc.:||..EEEE.........,||:..1.........I', // 12
  'I...@..q.....:||..EEEE...1......||:......B..B..I', // 13
  'I.M.....,....:||..EEEE..........||:......x..r..I', // 14
  'I............:||.....q.......3..||:..*.........I', // 15
  'I.,,.....T...:||.T..............||:.......q...BI', // 16
  'I..........3.:||.....2......T...||:...T.......bI', // 17
  'I.q..HHH.....:||..,,.......q....||:............I', // 18
  'I....HHH.....:||................||:.....,,.....I', // 19
  '==============++================++=============I', // 20
  '==============++======7=========++=============I', // 21
  'Ihhhhhh.hhhhh.' + '||' + '..T....T....T...' + '||' + '.....h.h.....' + 'I', // 22
  'Ih..........h.' + '|8' + '................' + '||' + '.....h.h..T..' + 'I', // 23
  'Ih.2.hh...q.h.' + '||' + '...DDDD...5.EEEE' + '||' + '.....hph.....' + 'I', // 24
  'Ih...hR.....h.' + '||' + '...DDDD.....EEEE' + '||' + '.....hhh.....' + 'I', // 25
  'Ih...hh..2..h.' + '||' + '...DDDD..p..EEEE' + '||' + '..3..........' + 'I', // 26
  'Ih..........h.' + '||' + '....q....1......' + '||' + '.........q...' + 'I', // 27
  'Ihhhhh..hhhhh.' + '||' + '........T.......' + '||' + '...T.....5...' + 'I', // 28
  'I..p..........' + '||' + '..*.........q...' + '||' + '.q...........' + 'I', // 29
  'I.....q.......' + '||' + '................' + '||' + '.......L.....' + 'I', // 30
  'oFFFFFFFFFFFFo' + '||' + 'FFFFFFFFFFFFFFFF' + '||' + 'FFFFFFFFFFFFF' + 'o', // 31
];

export function level1(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'void');
  m.stamp(0, 0, ROWS, LEGEND, 'grass');
  return m;
}
