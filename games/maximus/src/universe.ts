// The Hundred Worlds: five sectors of planets, which of them hold the ten star-shards and
// the ten courier modules, and what each planet is like. Scene numbers follow from here.
import type { Biome } from './art/roles';

export type WorldKind = 'surface' | 'rover' | 'ocean' | 'station';

export interface World {
  name: string;
  kind: WorldKind;
  biome: Biome;
  shard?: number;
  module?: number;
  /** One line for the planet card. */
  blurb: string;
}

export interface Sector {
  name: string;
  /** 1..5 */
  level: number;
  /** what the space chart looks like */
  space: number;
  song: string;
  worlds: World[];
}

const W = (name: string, kind: WorldKind, biome: Biome, blurb: string, extra: Partial<World> = {}): World => ({ name, kind, biome, blurb, ...extra });

export const SECTORS: Sector[] = [
  {
    name: 'The Cradle',
    level: 1,
    space: 1,
    song: 'cradle',
    worlds: [
      W('Verdance', 'surface', 'verdant', 'Rolling green hills. A good first stop.'),
      W('Little Hollow', 'surface', 'autumn', 'Caves under every hill.', { module: 0 }),
      W('Ambermoor', 'surface', 'autumn', 'Old ruins in the amber grass.', { shard: 0 }),
      W('Sandglass', 'surface', 'desert', 'Dunes over a buried city.'),
      W('Frostmere', 'surface', 'ice', 'Frozen lakes and frozen caves.'),
      W('Willowisp', 'surface', 'jungle', 'Lights drift in the jungle at dusk.'),
      W('Copperfield', 'surface', 'desert', 'Red cliffs full of ore.', { module: 2 }),
      W('Tamsin Lakes', 'surface', 'verdant', 'More lake than land.'),
      W('Liberty', 'surface', 'autumn', 'A cracked bell rings over the orchards.'),
      W('Brightwater', 'ocean', 'ocean', 'A clear, shallow sea.', { shard: 1 }),
      W('Kelpie', 'ocean', 'ocean', 'Kelp forests and a wreck.'),
      W('Dune Wheel', 'rover', 'desert', 'Flat sands, made for a rover.'),
      W('Saltpan', 'rover', 'ice', 'A white salt flat.'),
      W('Outpost Nine', 'station', 'station', 'A mining outpost gone quiet.', { module: 6 }),
      W('Waystation Ceres', 'station', 'station', 'A truck stop for couriers.'),
      W('Mossback', 'surface', 'jungle', 'The hills are giant mossy shells.'),
      W('Gale Point', 'surface', 'ice', 'Winds howl over the islands.'),
      W('Hearthstone', 'surface', 'verdant', 'Warm stones and quiet caves.'),
    ],
  },
  {
    name: 'Emberreach',
    level: 2,
    space: 2,
    song: 'ember',
    worlds: [
      W('Cinderfall', 'surface', 'lava', 'Ash rains on rivers of fire.', { shard: 2 }),
      W('Ashveil', 'surface', 'ash', 'A grey world under a grey sky.'),
      W('Pyre', 'surface', 'lava', 'Do not touch the floor.', { module: 1 }),
      W('Basalt Bay', 'surface', 'ash', 'Black cliffs over a warm sea.'),
      W('Smolder', 'surface', 'autumn', 'The forests here are always burning.'),
      W('Kiln', 'surface', 'desert', 'Baked clay and baked couriers.'),
      W('Ironfield', 'surface', 'ash', 'Iron spires in an iron plain.'),
      W('Scorchmark', 'surface', 'lava', 'Craters on craters.', { module: 4 }),
      W('Ember Isle', 'ocean', 'ocean', 'A volcano under the waves.'),
      W('Hot Springs', 'ocean', 'ocean', 'The water is hot. Mind the vents.', { shard: 3 }),
      W('Slag Run', 'rover', 'lava', 'A long, hot road.'),
      W('Boxcar Flats', 'rover', 'desert', 'Rails, boxcars and one hobo.'),
      W('Forge Station', 'station', 'station', 'An abandoned foundry.'),
      W('Mine Twelve', 'station', 'station', 'The miners left in a hurry.'),
      W('Redrock', 'surface', 'desert', 'Red rock, red sky, red eyes.', { module: 9 }),
      W('Charcoal', 'surface', 'ash', 'Everything here has burned once.'),
      W('Firefly', 'surface', 'jungle', 'Glowing bugs in a dark jungle.'),
      W('Last Ember', 'surface', 'lava', 'The hottest place in the sector.'),
    ],
  },
  {
    name: 'The Shallows',
    level: 3,
    space: 3,
    song: 'shallows',
    worlds: [
      W('Coralline', 'ocean', 'ocean', 'Reefs as far as you can swim.'),
      W('Tidewater', 'ocean', 'ocean', 'Strong currents. Hold on.', { module: 8 }),
      W('Pearlbed', 'ocean', 'ocean', 'The clams here are rich.', { shard: 4 }),
      W('Riptide', 'ocean', 'ocean', 'The currents all run one way.'),
      W('Kelp Deep', 'ocean', 'abyss', 'A kelp forest over a trench.'),
      W('Lagoon', 'ocean', 'ocean', 'A warm lagoon with a wreck.'),
      W('Saltmarsh', 'surface', 'toxic', 'Bogs and reeds and bugs.'),
      W('Marrowsea', 'ocean', 'abyss', 'Bones on the sea bed.'),
      W('Anchorage', 'station', 'station', 'A harbor station, flooded below.'),
      W('Seafoam', 'ocean', 'ocean', 'Foam and flying fish.'),
      W('Mistral Isle', 'surface', 'jungle', 'Jungle islands in the wind.', { module: 3 }),
      W('Fernreach', 'surface', 'jungle', 'Trees taller than towers.'),
      W('Mushroom Moon', 'surface', 'fungal', 'Mushrooms as tall as houses.', { shard: 5 }),
      W('Sporefield', 'surface', 'fungal', 'Breathe through your helmet.'),
      W('Breakwater', 'rover', 'verdant', 'A causeway between the seas.'),
      W('Dry Dock', 'station', 'station', 'Ships were built here.'),
      W('Lighthouse', 'station', 'station', 'Its light still turns.'),
      W('Undertow', 'ocean', 'abyss', 'It pulls you down.'),
    ],
  },
  {
    name: 'Glasswind',
    level: 4,
    space: 4,
    song: 'glass',
    worlds: [
      W('Prism', 'surface', 'crystal', 'Light breaks into colors here.', { shard: 6 }),
      W('Glasswind', 'surface', 'crystal', 'The wind sings through glass.'),
      W('Shiver', 'surface', 'ice', 'Colder than Frostmere.'),
      W('Rimefall', 'surface', 'ice', 'Ice cliffs and ice caves.', { module: 5 }),
      W('Quartzite', 'surface', 'crystal', 'Crystal caverns, deep and wide.'),
      W('Toxin Bloom', 'surface', 'toxic', 'Pretty flowers. Poison.'),
      W('Venom Marsh', 'surface', 'toxic', 'The marsh bites.', { module: 7 }),
      W('Sulfur', 'surface', 'toxic', 'Yellow sky, green seas.'),
      W('Lumen', 'surface', 'fungal', 'Giant pale mushrooms, deep dark caves.'),
      W('Icicle', 'surface', 'ice', 'Everything points down.'),
      W('Facet', 'rover', 'crystal', 'Glass flats, perfect for racing.'),
      W('Mirror Flats', 'rover', 'ice', 'You can see yourself in the ground.'),
      W('Cryo Lab', 'station', 'station', 'Something escaped the freezers.'),
      W('Glass Abyss', 'ocean', 'abyss', 'A sea under a glass sky.', { shard: 7 }),
      W('Frozen Sea', 'ocean', 'ocean', 'Ice above, water below.'),
      W('Shardfall', 'surface', 'crystal', 'Crystal spires on every hill.'),
      W('Opaline', 'surface', 'crystal', 'Milky stone and rainbow light.'),
      W('Hoarfrost', 'surface', 'ice', 'Frost on everything.'),
    ],
  },
  {
    name: 'The Deep Black',
    level: 5,
    space: 5,
    song: 'black',
    worlds: [
      W('Nadir', 'surface', 'ash', 'The lowest point of the galaxy.'),
      W('Gloom', 'surface', 'fungal', 'Barely any light at all.'),
      W('Hollow Sun', 'surface', 'lava', 'A dying star warms this rock.', { shard: 8 }),
      W('Blacktide', 'ocean', 'abyss', 'A black sea, very deep.'),
      W('Drowned Moon', 'ocean', 'abyss', 'A moon with an ocean inside.'),
      W('Ghost Station', 'station', 'station', 'Nobody answers the hail.', { shard: 9 }),
      W('Galileo', 'station', 'station', 'An old Earth probe. Still blinking.'),
      W('Final Relay', 'station', 'station', 'The last relay before the Core.'),
      W('Dread', 'surface', 'toxic', 'Everyone who lands here hurries.'),
      W('Obsidian', 'surface', 'lava', 'Black glass and red rivers.'),
      W('Pale Reach', 'surface', 'ice', 'Bleached and frozen.'),
      W('Nightglass', 'surface', 'crystal', 'Dark crystal, darker caves.'),
      W('Silent Tor', 'rover', 'ash', 'No wind, no sound, no life.'),
      W('Wither', 'surface', 'autumn', 'A forest in its last autumn.'),
      W('Umbra', 'surface', 'crystal', 'In the shadow of the Core.'),
      W('Event Horizon', 'ocean', 'abyss', 'The water falls toward the Core.'),
    ],
  },
];

/** Scene numbers. */
export const SCENE = {
  start: 0,
  end: 1,
  home: 2,
  galaxy: 3,
  sector: (k: number) => 4 + k,
  maelstrom: 9,
  citadel: 10,
  heart: 11,
  firstWorld: 12,
  /** after the 88 worlds: a scene the pod passes straight through (its picture is the point) */
  between: 100,
};

export function allWorlds(): { world: World; sector: number; index: number; scene: number }[] {
  const out: { world: World; sector: number; index: number; scene: number }[] = [];
  let scene = SCENE.firstWorld;
  SECTORS.forEach((s, k) => s.worlds.forEach((w, i) => out.push({ world: w, sector: k, index: i, scene: scene++ })));
  return out;
}
