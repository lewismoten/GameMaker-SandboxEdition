// What each game's pixel trinkets (pixelTrinkets.ts) are made from: its hero and one signature figure, read from the
// game's own character, monster and palette files on its built disk. Secret games are left out on purpose.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { chicken } from '../tuneup/src/art/chicken';

export interface Def {
  id: string;
  title: string;
  blurb: string;
  /** A hero (character file: a sequence's first frame) or a monster (monster file, block file and number: its first picture). */
  source: { chr: string; cbl: string; seq?: number } | { draw: () => Pixels } | { mon: string; mbl: string; n: number };
  pal: string;
  /** Palette indices that keep a color of their own (the first is the outline and base). */
  keep?: number[];
}
const hero = (chr: string, cbl: string, pal: string, title: string, blurb: string, id = chr, seq?: number): Def => ({
  id,
  title,
  blurb,
  source: { chr: `${chr}.chr`, cbl: `${cbl}.cbl`, seq },
  pal: `${pal}.pal`,
});
const mon = (mon_: string, n: number, mbl: string, pal: string, id: string, title: string, blurb: string): Def => ({
  id,
  title,
  blurb,
  source: { mon: `${mon_}.mon`, mbl: `${mbl}.mbl`, n },
  pal: `${pal}.pal`,
});

export const GAMES: Record<string, Def[]> = {
  tuneup: [
    {
      id: 'leo',
      title: 'Doc Leo',
      blurb: 'The hobo clown mechanic in his gray fedora, ready to tune up anything.',
      source: { chr: 'leo.chr', cbl: 'leo.cbl' },
      pal: 'gear1.pal',
      keep: [9, 44, 157, 175],
    },
    {
      id: 'regina',
      title: 'Lady Regina III',
      blurb: 'The rubber chicken who laid the egg.',
      source: { draw: () => chicken(1, { lady: true, stand: true }) },
      pal: 'gear1.pal',
      keep: [9, 197, 179, 83],
    },
  ],
  teddy: [
    {
      id: 'teddy',
      title: 'Teddy',
      blurb: 'The little corgi with a ton of tricks.',
      source: { chr: 'teddy.chr', cbl: 'teddy.cbl', seq: 5 },
      pal: 'backyard.pal',
    },
    {
      id: 'gwinn',
      title: 'Gwinn',
      blurb: 'Teddy’s big sister, all muscle and tongue.',
      source: { mon: 'backyard.mon', mbl: 'backyard.mbl', n: 10 },
      pal: 'backyard.pal',
    },
  ],
};

GAMES.brief = [
  hero('joe', 'joe', 'brief', 'Mystery Robot', 'The little robot who has to put every word back.', 'robot'),
  mon('after', 0, 'after', 'brief', 'ghost', 'Library ghost', 'A gray ghost with yellow glasses, haunting the stacks.'),
];
GAMES.carl = [
  hero('carl', 'carl', 'aux', 'Carl', 'The fly in the room, and he is winning.', 'carl'),
  mon('aux', 26, 'carl', 'aux', 'frog', 'Frog', 'A frog who shares the room with Carl.'),
];
GAMES.goat = [
  hero('goat', 'goat', 'caravan', 'The third goat', 'The goat nobody painted.', 'goat'),
  mon('caravan', 2, 'goat', 'caravan', 'sheep', 'Sheep', 'A sheep from the shepherds’ fold.'),
];
GAMES.loaf = [
  hero('loaf', 'loaf', 'baskets', 'Loaf #13', 'The loaf nobody picked, rolling out of the basket.', 'loaf'),
  mon('baskets', 1, 'loaf', 'baskets', 'fish', 'Fish', 'The fish that came with the loaves.'),
];
GAMES.logic = [hero('watt', 'watt', 'watt', 'Watt', 'The pocket-sized repair robot.', 'watt')];
GAMES.loofah = [
  hero('loofah', 'loofah', 'aisle', 'The loofah', 'Peach or coral, smelling of grapefruit.', 'loofah'),
  mon('aisle', 18, 'loofah', 'aisle', 'imp', 'Horned imp', 'A cheerful little horned imp from the aisle.'),
];
GAMES.maximus = [
  hero('courier', 'courier', 'heart', 'Courier Max', 'The courier crossing a galaxy of worlds.', 'max'),
  mon('heart', 0, 'heart', 'heart', 'cyclops', 'Blue cyclops', 'A one-eyed blue blob from the heart worlds.'),
];
GAMES.mustard = [
  hero('seed', 'mustard', 'dust', 'The mustard seed', 'The smallest thing in all the land, with the greatest feet.', 'seed'),
  mon('dust', 19, 'mustard', 'dust', 'bee', 'Bee', 'A bee buzzing the garden.'),
];
GAMES.needle = [
  hero('saddled', 'saddled', 'city', 'Brother Camel', 'The camel with the saddlebags full of gold.', 'camel'),
  mon('city', 15, 'things', 'city', 'needle', 'The needle', 'The eye of the needle itself.'),
];
GAMES.reckoning = [
  hero('leo', 'reckon', 'fridge', 'Doc Leo', 'Tiptoeing to the fridge at 3:17 a.m.', 'leo'),
  mon('bedroom', 17, 'reckon', 'bedroom', 'imp', 'Little devil', 'A little red devil with a cape.'),
];
GAMES.remote = [
  hero('remote', 'remote', 'den', 'The couch potato', 'On the hunt for the remote.', 'hero'),
  mon('den', 4, 'remote', 'den', 'cat', 'The cat', 'Look under the cat.'),
];
GAMES.risi = [
  hero('marcus', 'marcus', 'banquet', 'Marcus Iocundus', 'The comic poet of Rome.', 'marcus'),
  mon('banquet', 6, 'risi', 'banquet', 'rufus', 'Rufus', 'Marcus’s dog.'),
];
GAMES.sandcast = [
  hero('sandcast', 'sandcast', 'sandcast', 'Teddy the knight', 'The corgi knight of the sandbox.', 'knight'),
  mon('sandcast', 29, 'sandcast', 'sandcast', 'gwinn', 'Gwinn', 'Teddy’s big sister, ready to zoom.'),
];
GAMES.sleuth = [
  hero('ada', 'ada', 'dawn', 'Inspector Ada Penn', 'The inspector of the Paragon Theatre.', 'ada'),
  mon('people', 9, 'people', 'dawn', 'ghost', 'The ghost', 'A little ghost of the theater.'),
];
GAMES.smirked = [
  hero('smirked', 'smirked', 'exit', 'The scaredy-dad', 'Taking Lily through the haunted house.', 'hero'),
  mon('exit', 8, 'smirked', 'exit', 'ghost', 'Pink ghost', 'A friendly pink ghost.'),
];
GAMES.snowbound = [
  hero('kid', 'kid', 'noon', 'The shoveler', 'A dollar a scoop on the way to $89.', 'kid'),
  mon('bowden', 22, 'snow', 'noon', 'cardinal', 'Cardinal', 'A red bird in the snow.'),
];
GAMES.sweats = [
  hero('poet', 'poet', 'ants', 'Will', 'Open-mic poet in a starched ruff.', 'will'),
  mon('ants', 17, 'errands', 'ants', 'goose', 'Goose', 'A goose out on errands.'),
];
GAMES.teddy2 = [
  hero('teddy', 'teddy', 'main', 'Teddy', 'Sniffing out Gwinn’s trail.', 'teddy'),
  mon('farm', 23, 'farm', 'main', 'hen', 'Hen', 'A hen at the farm.'),
];
GAMES.teddy3 = [
  hero('gwinn', 'gwinn', 'road', 'Gwinn', 'Playing the meanwhile.', 'gwinn'),
  hero('runner', 'runner', 'road', 'The runner', 'Out for a run.', 'runner'),
];
GAMES.tickle = [
  hero('leo', 'tickle', 'course', 'Doc Leo', 'Certified in rat tickling.', 'leo'),
  mon('course', 7, 'tickle', 'course', 'rat', 'Rat', 'A rat, waiting to be tickled.'),
];
GAMES.year2000 = [
  hero('dex', 'dex', 'y2k', 'Dex Dynamo', 'Looking for his science fair project.', 'dex'),
  mon('y2k', 32, 'y2k', 'y2k', 'robodog', 'Robot dog', 'The robot dog who ate the project.'),
];
