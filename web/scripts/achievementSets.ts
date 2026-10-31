// The public games' 20x20 block sets that achievement badges are cut from, built from each game's own src/
// builders (nothing here enters the browser bundle) and the picks that name a block by achievement id.
// Used by achievementArt.ts; a set is a name -> block map with the palette the game draws it in.
import { streetTiles } from '../../games/teddy/src/levels/level2Tiles';
import { parkTiles } from '../../games/teddy/src/levels/level3Tiles';
import { cityTiles } from '../../games/teddy/src/levels/level4Tiles';
import { POSES } from '../../games/teddy/src/sprites/teddy';
import { P } from '../../games/teddy/src/art/pal';
import { buildBlocks as goatBlocks } from '../../games/goat/src/blocks/blocks';
import { buildPalette as goatPalette } from '../../games/goat/src/art/pal';
import { buildBlocks as remoteBlocks } from '../../games/remote/src/blocks/blocks';
import { buildPalette as remotePalette } from '../../games/remote/src/art/pal';
import { buildBlocks as snowBlocks } from '../../games/snowbound/src/blocks/blocks';
import { buildPalette as snowPalette } from '../../games/snowbound/src/art/pal';
import { buildBlocks as reckonBlocks } from '../../games/reckoning/src/blocks/blocks';
import { buildPalette as reckonPalette } from '../../games/reckoning/src/art/pal';
import { buildHouse } from '../../games/carl/src/blocks/house';
import { buildYard as buildCarlYard } from '../../games/carl/src/blocks/yard';
import { buildPalette as carlPalette } from '../../games/carl/src/art/pal';
import { buildVilla } from '../../games/risi/src/blocks/villa';
import { buildPalette as risiPalette } from '../../games/risi/src/art/pal';
import { eyeBlocks } from '../../games/needle/src/blocks/eye';
import { buildPalette as needlePalette } from '../../games/needle/src/art/pal';
import { buildParlorBlocks } from '../../games/sleuth/src/levels/parlorBlocks';
import { buildTheaterBlocks } from '../../games/sleuth/src/blocks/tiles';
import { buildPalette as sleuthPalette } from '../../games/sleuth/src/art/pal';
import { BG as sandcastBlocks } from '../../games/sandcast/src/blocks/bblocks';
import { DAY as sandcastPalette } from '../../games/sandcast/src/art/palette';
import { citySet, moonSet, suburbSet } from '../../games/year2000/src/blocks/blocks';
import { PAL as y2kPalette } from '../../games/year2000/src/art/pal';
import { compileAll as briefAll } from '../../games/brief/src/compile';
import { PAL as briefPalette } from '../../games/brief/src/art/pal';
import { GROUPS as sweatsGroups } from '../../games/sweats/src/scenes';
import { BlockBook as SweatsBook } from '../../games/sweats/src/common/blocks';
import { buildPalette as sweatsPalette } from '../../games/sweats/src/art/pal';
import { LEVELS as teddy2Levels } from '../../games/teddy2/src/game';
import { buildPalette as teddy2Palette } from '../../games/teddy2/src/art/pal';
import { buildBlocks as tickleBlocks } from '../../games/tickle/src/blocks/blocks';
import { buildPalette as ticklePalette } from '../../games/tickle/src/art/pal';
import { tierBlocks, tierPalette } from './achievementTiers';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export interface Source {
  game: string;
  blocks: Map<string, Pixels>;
  palette: Uint8Array;
}

/** Any of the games' block containers: a Map of pics, or parallel names and pics arrays. */
type Holder = { pics: Map<string, Pixels> | Pixels[]; names?: string[] };
const named = (h: Holder): Map<string, Pixels> => {
  if (h.pics instanceof Map) return h.pics;
  const out = new Map<string, Pixels>();
  h.names!.forEach((n, i) => out.set(n, (h.pics as Pixels[])[i]));
  return out;
};

const goat = goatPalette('day');
const remote = remotePalette('plain');
const snow = snowPalette('noon');
const street = streetTiles();
const park = parkTiles();
const city = cityTiles();
const brief = briefAll();
const briefBlocks = new Map<string, Pixels>();
for (const area of [brief.hub.area, ...brief.wings.map((w) => w.area)]) for (const [k, v] of named(area.tiles)) briefBlocks.set(`${area.file}/${k}`, v);
const sweatsGroup = (id: string): Source => {
  const g = sweatsGroups.find((x) => x.id === id)!;
  const pal = sweatsPalette(g.ramps);
  const book = new SweatsBook();
  g.blocks(book, pal);
  return { game: 'sweats', blocks: named(book), palette: pal.pal };
};
const teddy2Level = (file: string): Source => {
  const l = teddy2Levels.map((make) => make()).find((x) => x.file === file)!;
  return { game: 'teddy2', blocks: named(l.bs), palette: teddy2Palette(l.time).pal };
};

export const sets: Record<string, Source> = {
  street: { game: 'teddy', blocks: named({ pics: street.pics, names: street.names }), palette: P.pal },
  park: { game: 'teddy', blocks: named({ pics: park.pics, names: park.names }), palette: P.pal },
  city: { game: 'teddy', blocks: named({ pics: city.pics, names: city.names }), palette: P.pal },
  teddy: { game: 'teddy', blocks: new Map(Object.entries(POSES)), palette: P.pal },
  tiers: { game: 'teddy', blocks: tierBlocks(), palette: tierPalette },
  tickle: { game: 'tickle', blocks: tickleBlocks(ticklePalette('plain')).pics, palette: ticklePalette('plain').pal },
  goat: { game: 'goat', blocks: goatBlocks(goat).pics, palette: goat.pal },
  remote: { game: 'remote', blocks: remoteBlocks(remote).pics, palette: remote.pal },
  snowbound: { game: 'snowbound', blocks: snowBlocks(snow).pics, palette: snow.pal },
  reckoning: { game: 'reckoning', blocks: reckonBlocks(reckonPalette('plain')).pics, palette: reckonPalette('plain').pal },
  carl: { game: 'carl', blocks: buildHouse(carlPalette('plain')).pics, palette: carlPalette('plain').pal },
  carlYard: { game: 'carl', blocks: buildCarlYard(carlPalette('plain')).pics, palette: carlPalette('plain').pal },
  risi: { game: 'risi', blocks: buildVilla(risiPalette('plain')).pics, palette: risiPalette('plain').pal },
  needle: { game: 'needle', blocks: eyeBlocks(needlePalette('plain')).book.pics, palette: needlePalette('plain').pal },
  sleuthParlor: { game: 'sleuth', blocks: named(buildParlorBlocks()), palette: sleuthPalette('house').pal },
  sleuthTheater: { game: 'sleuth', blocks: named(buildTheaterBlocks()), palette: sleuthPalette('house').pal },
  sandcast: { game: 'sandcast', blocks: named(sandcastBlocks as unknown as Holder), palette: sandcastPalette },
  y2kSuburb: { game: 'year2000', blocks: named(suburbSet()), palette: y2kPalette.pal },
  y2kCity: { game: 'year2000', blocks: named(citySet()), palette: y2kPalette.pal },
  y2kMoon: { game: 'year2000', blocks: named(moonSet()), palette: y2kPalette.pal },
  brief: { game: 'brief', blocks: briefBlocks, palette: briefPalette.pal },
  sweatsHive: sweatsGroup('hive'),
  sweatsWork: sweatsGroup('work'),
  sweatsOutside: sweatsGroup('outside'),
  teddy2Main: teddy2Level('main'),
  teddy2House: teddy2Level('house'),
};

/** Achievement id -> [set, block] for badges cut from an existing 20x20 block. */
export const picks: Record<string, [string, string]> = {
  'make-edit': ['remote', 'pen'],
  'export-windows': ['goat', 'window'],
  'export-mac': ['city', 'apples'],
  'export-files': ['goat', 'crate'],
  'first-steps': ['goat', 'sandal'],
  'make-cards': ['city', 'poster'],
  'play-first': ['remote', 'handheld'],
  'play-sandbox': ['park', 'bucket'],
  'play-teddy': ['teddy', 'stand'],
  'heart-first': ['goat', 'tinHeart'],
  'egg-first': ['goat', 'easterEgg'],
  'watch-one': ['remote', 'vcrPlaying'],
  'desk-bbs': ['remote', 'phone'],
  'desk-copycheck': ['remote', 'guide'],
  'desk-clock': ['remote', 'clock'],
  'desk-wastebasket': ['remote', 'trash'],
  'desk-door': ['goat', 'door'],
  'desk-window': ['remote', 'window'],
  'desk-chicken': ['city', 'chicken'],
  'desk-mail': ['street', 'mailbox'],
  'desk-zine': ['remote', 'mags'],
  'desk-light': ['remote', 'lamp'],
  'watch-all': ['remote', 'vcr'],
  'offline-copy': ['remote', 'vcrOff'],
  'mag-features': ['remote', 'magsSpread'],
  'desk-backup': ['remote', 'drawerOpen'],
  'make-take': ['remote', 'tapes'],
  'desk-gm': ['remote', 'keyboard'],
  'bbs-every-speed': ['remote', 'modem'],
  'desk-power': ['remote', 'plug'],
  'desk-gamepad': ['remote', 'gamepad'],
  'desk-mousepad': ['remote', 'mousepad'],
  'record-video': ['remote', 'camcorder'],
  'desk-bbs-file': ['remote', 'diskDrive'],
  'mag-disc': ['remote', 'discSleeve'],
  'play-save': ['remote', 'saveTape'],
  'blaster-big-name': ['carl', 'speaker'],
  'desk-curtains': ['sleuthParlor', 'curtain0'],
  'cast-parade': ['sleuthParlor', 'footlights'],
  'desk-time-reset': ['carl', 'alarm'],
  'bbs-time-travel': ['reckoning', 'clock0'],
  'library-kinds': ['reckoning', 'books'],
  'desk-moon': ['needle', 'moon'],
  'make-save': ['sandcast', 'floppy'],
  'sofa-chat': ['sandcast', 'terminal'],
  'trophy-top': ['sandcast', 'crown'],
  'export-web': ['brief', 'library/globe'],
  'finish-sandbox': ['brief', 'yard/medal'],
  'export-dos': ['sweatsWork', 'monitor'],
  'check-fix': ['sweatsOutside', 'wrench'],
  'finish-bizarre': ['sweatsHive', 'openMic'],
  'make-walk': ['y2kMoon', 'robotproj'],
  'link-in': ['y2kSuburb', 'mailbox'],
  'desk-egg': ['y2kSuburb', 'egg'],
  'play-finish': ['snowbound', 'finish'],
  'egg-all': ['teddy2House', 'basket'],
  'make-every-kind': ['tickle', 'toolbox'],
  'check-upload': ['tickle', 'clipboardOk'],
  'sfx-maker': ['tickle', 'mixer'],
  'desk-uv': ['tickle', 'uvBulb'],
  'desk-blacklight': ['tickle', 'blacklight'],
  'desk-degauss': ['tickle', 'crtRings'],
  'desk-soundcard': ['tickle', 'soundCard'],
  'desk-hexedit': ['tickle', 'hexPad'],
  'desk-savehack': ['tickle', 'screwdriverDisk'],
  'desk-gmcrack': ['tickle', 'pirateDos'],
  'finish-web': ['tickle', 'surfer'],
  'tty-call': ['tickle', 'fax'],
  'tty-sk': ['tickle', 'helloTerm'],
  'bbs-door': ['sleuthParlor', 'rotaryDial'],
  'bbs-door-win': ['sleuthParlor', 'numberCard'],
  'cast-visit': ['sleuthParlor', 'maskPair'],
  'brief-chapters': ['sleuthParlor', 'ribbonBook'],
  'help-all': ['sleuthParlor', 'leaflet'],
  'desk-register': ['sleuthParlor', 'regForm'],
  'desk-achieve': ['sleuthParlor', 'badgeClip'],
  'make-new': ['sleuthParlor', 'blankSheet'],
  'watch-seek': ['sleuthParlor', 'filmJump'],
  'make-opening': ['sleuthParlor', 'clapper'],
  'check-run': ['sleuthParlor', 'loupeGrid'],
  'desk-glance': ['sleuthParlor', 'peekCurtain'],
  'tty-wallphone': ['sleuthParlor', 'deskPhone'],
  'sofa-busy': ['sleuthParlor', 'busyLine'],
  'make-heat': ['sleuthParlor', 'heatMap'],
  'desk-speaker': ['sleuthParlor', 'deskSpeaker'],
  'trophy-first': ['sleuthParlor', 'meritMedal'],
  'heart-all': ['sleuthParlor', 'heartWreath'],
  'export-all': ['carlYard', 'parcelWings'],
  'desk-mailjeep': ['carlYard', 'mailJeep'],
  'finish-desk': ['carl', 'packPad'],
  'finish-dos': ['carl', 'dosDisk'],
  'finish-phone-wide': ['carl', 'phoneWide'],
  'finish-phone-tall': ['carl', 'phoneTall'],
  'every-life-1': ['tiers', 'every-life-1'],
  'every-life-3': ['tiers', 'every-life-3'],
  'every-life-10': ['tiers', 'every-life-10'],
  'every-loss-1': ['tiers', 'every-loss-1'],
  'every-loss-3': ['tiers', 'every-loss-3'],
  'every-loss-10': ['tiers', 'every-loss-10'],
  'every-win-1': ['tiers', 'every-win-1'],
  'every-win-3': ['tiers', 'every-win-3'],
  'every-win-10': ['tiers', 'every-win-10'],
};
