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
import { buildBlocks as loafBlocks } from '../../games/loaf/src/blocks/blocks';
import { buildPalette as loafPalette } from '../../games/loaf/src/art/pal';
import { buildBlocks as smirkedBlocks } from '../../games/smirked/src/blocks/blocks';
import { buildPalette as smirkedPalette } from '../../games/smirked/src/art/pal';
import { buildCampus } from '../../games/risi/src/blocks/campus';
import { buildVilla } from '../../games/risi/src/blocks/villa';
import { buildPalette as risiPalette } from '../../games/risi/src/art/pal';
import { eyeBlocks } from '../../games/needle/src/blocks/eye';
import { tailorBlocks } from '../../games/needle/src/blocks/tailor';
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
import { buildMonsterBlocks as snowMonsterBlocks } from '../../games/snowbound/src/sprites/monsterBlocks';
import { GROUPS as sweatsAllGroups } from '../../games/sweats/src/scenes';
import { commonSprites as sweatsCommonSprites, makeBook as sweatsMakeBook } from '../../games/sweats/src/common/sprites';
import { GWINN } from '../../games/teddy/src/sprites/gwinn';
import { TOYS } from '../../games/teddy/src/sprites/toys';
import { tierBlocks, tierPalette } from './achievementTiers';
import { levelSource } from './achievementLevels';
import { COUNT_LEVELS } from '../src/achievements/levels';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

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

/**
 * A game's character or monster block set (sprites), with its transparent color drawn over a plain backdrop
 * (the palette entry nearest `bg`) so a badge reads on its own: the sprite books are 20x20 like the background sets.
 */
const spriteSet = (game: string, pics: Map<string, Pixels>, palette: Uint8Array, bg: [number, number, number]): Source => {
  const k = Math.max(...palette) > 63 ? 1 : 4;
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < 255; i++) {
    const d = [0, 1, 2].reduce((a, c) => a + (palette[i * 3 + c] * k - bg[c]) ** 2, 0);
    if (d < dist) [best, dist] = [i, d];
  }
  const out = new Map<string, Pixels>();
  for (const [n, p] of pics) {
    const q = new Pixels(p.w, p.h, 0);
    q.px.set(p.px.map((v) => (v === 255 ? best : v)));
    out.set(n, q);
  }
  return { game, blocks: out, palette };
};
const sweatsSprites = (id: string): Source => {
  const g = sweatsAllGroups.find((x) => x.id === id)!;
  const pal = sweatsPalette(g.ramps);
  const book = sweatsMakeBook('mbl');
  sweatsCommonSprites(book, pal);
  g.sprites(book, pal);
  return spriteSet('sweats', book.pics, pal.pal, [196, 220, 236]);
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

/** The count-leveled badges: a block of the remote or tickle set under each level's plate (achievementLevels.ts). */
function levelBases() {
  const tickle = ticklePalette('plain');
  const rb = remoteBlocks(remote).pics;
  const tb = tickleBlocks(tickle).pics;
  const pick = (m: Map<string, Pixels>, n: string) => m.get(n)!;
  return levelSource([
    { family: 'games-played', goals: COUNT_LEVELS['games-played'].goals, pic: pick(rb, 'toyBlock'), palette: remote.pal },
    { family: 'games-finished', goals: COUNT_LEVELS['games-finished'].goals, pic: pick(tb, 'banner'), palette: tickle.pal },
    { family: 'walks-watched', goals: COUNT_LEVELS['walks-watched'].goals, pic: pick(rb, 'vcrPlay'), palette: remote.pal },
  ]);
}

export const sets: Record<string, Source> = {
  street: { game: 'teddy', blocks: named({ pics: street.pics, names: street.names }), palette: P.pal },
  park: { game: 'teddy', blocks: named({ pics: park.pics, names: park.names }), palette: P.pal },
  city: { game: 'teddy', blocks: named({ pics: city.pics, names: city.names }), palette: P.pal },
  teddy: { game: 'teddy', blocks: new Map(Object.entries(POSES)), palette: P.pal },
  tiers: { game: 'teddy', blocks: tierBlocks(), palette: tierPalette },
  levels: { game: 'remote and tickle', ...levelBases() },
  tickle: { game: 'tickle', blocks: tickleBlocks(ticklePalette('plain')).pics, palette: ticklePalette('plain').pal },
  goat: { game: 'goat', blocks: goatBlocks(goat).pics, palette: goat.pal },
  remote: { game: 'remote', blocks: remoteBlocks(remote).pics, palette: remote.pal },
  snowbound: { game: 'snowbound', blocks: snowBlocks(snow).pics, palette: snow.pal },
  reckoning: { game: 'reckoning', blocks: reckonBlocks(reckonPalette('plain')).pics, palette: reckonPalette('plain').pal },
  carl: { game: 'carl', blocks: buildHouse(carlPalette('plain')).pics, palette: carlPalette('plain').pal },
  carlYard: { game: 'carl', blocks: buildCarlYard(carlPalette('plain')).pics, palette: carlPalette('plain').pal },
  risi: { game: 'risi', blocks: buildVilla(risiPalette('plain')).pics, palette: risiPalette('plain').pal },
  risiCampus: { game: 'risi', blocks: buildCampus(risiPalette('plain')).pics, palette: risiPalette('plain').pal },
  loaf: { game: 'loaf', blocks: loafBlocks(loafPalette('plain')).pics, palette: loafPalette('plain').pal },
  smirked: { game: 'smirked', blocks: smirkedBlocks(smirkedPalette('plain')).pics, palette: smirkedPalette('plain').pal },
  needle: { game: 'needle', blocks: eyeBlocks(needlePalette('plain')).book.pics, palette: needlePalette('plain').pal },
  needleTailor: { game: 'needle', blocks: tailorBlocks(needlePalette('plain')).book.pics, palette: needlePalette('plain').pal },
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
  snowSprites: spriteSet('snowbound', snowMonsterBlocks(snow).pics, snow.pal, [150, 190, 224]),
  sweatsHomeSprites: sweatsSprites('home'),
  gwinnSprites: spriteSet('teddy', new Map(Object.entries(GWINN)), P.pal, [150, 200, 120]),
  teddyToys: spriteSet('teddy', new Map(Object.entries(TOYS)), P.pal, [170, 200, 230]),
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
  'watch-one': ['tickle', 'tv1'],
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
  'offline-copy': ['remote', 'nope'],
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
  'sfx-maker': ['tickle', 'detector0'],
  'desk-uv': ['tickle', 'uvBulb'],
  'desk-blacklight': ['tickle', 'blacklight'],
  'egg-teddy': ['tickle', 'eggTeddy'],
  'bbs-cant-wait': ['tickle', 'cheese'],
  'desk-egg-pages': ['tickle', 'cardFile'],
  'desk-egg-uv': ['tickle', 'uvEgg'],
  'desk-degauss': ['tickle', 'crtRings'],
  'desk-soundcard': ['tickle', 'soundCard'],
  'desk-hexedit': ['tickle', 'hexPad'],
  'desk-savehack': ['remote', 'payTv'],
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
  'desk-mailtruck': ['carlYard', 'mailTruck'],
  'finish-desk': ['carl', 'packPad'],
  'finish-dos': ['carl', 'dosDisk'],
  'finish-phone-wide': ['carl', 'phoneWide'],
  'finish-phone-tall': ['carl', 'phoneTall'],
  'saves-panel': ['reckoning', 'trophyGold'],
  'bbs-door-three': ['reckoning', 'trophySilver'],
  'mag-back': ['reckoning', 'magRoll'],
  'desk-lume': ['reckoning', 'lumeDial'],
  'print-level-maps': ['needleTailor', 'compass'],
  'print-world-map': ['needleTailor', 'foldMap'],
  'print-world-styles': ['needleTailor', 'rulerTriangle'],
  'palette-vision': ['needleTailor', 'seenGlasses'],
  'watch-bot': ['needleTailor', 'robotCrank'],
  'hint-phone-bill': ['needleTailor', 'phoneBill'],
  'desk-aurora': ['loaf', 'aurora'],
  'bbs-got-time': ['loaf', 'snail'],
  'download-mp4': ['loaf', 'filmStrip'],
  'desk-star': ['goat', 'shootingStar'],
  'desk-goat': ['goat', 'surprisedGoat'],
  'desk-plow': ['snowSprites', 'plowFront0'],
  'desk-sleds': ['snowSprites', 'sledder0'],
  'bbs-download-every-speed': ['sweatsHomeSprites', 'turtle0'],
  'desk-dogs': ['gwinnSprites', 'gwinnRun1'],
  'zine-read': ['teddyToys', 'book'],
  'play-bizarre': ['smirked', 'violin'],
  'library-visit': ['risiCampus', 'libraryFront'],
  'every-life-1': ['tiers', 'every-life-1'],
  'every-life-3': ['tiers', 'every-life-3'],
  'every-life-10': ['tiers', 'every-life-10'],
  'every-loss-1': ['tiers', 'every-loss-1'],
  'every-loss-3': ['tiers', 'every-loss-3'],
  'every-loss-10': ['tiers', 'every-loss-10'],
  'every-win-1': ['tiers', 'every-win-1'],
  'every-win-3': ['tiers', 'every-win-3'],
  'every-win-10': ['tiers', 'every-win-10'],
  'games-played-3': ['levels', 'games-played-3'],
  'games-played-10': ['levels', 'games-played-10'],
  'games-played-20': ['levels', 'games-played-20'],
  'games-finished-3': ['levels', 'games-finished-3'],
  'games-finished-10': ['levels', 'games-finished-10'],
  'games-finished-20': ['levels', 'games-finished-20'],
  'walks-watched-3': ['levels', 'walks-watched-3'],
  'walks-watched-10': ['levels', 'walks-watched-10'],
  'walks-watched-20': ['levels', 'walks-watched-20'],
};
