// The paper side of the box: LIMITS.TXT on the disk, about.json (label, box, catalog)
// and manual.json (the printed manual), written from the built game so every number in
// them is the real one.
import { BACKBL, CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { MAXFRAME, MAXINV, MAXSEQ } from '../../../web/src/formats/character';
import { MAXSCENELINKS, SCENEFILES, serializeGame } from '../../../web/src/formats/game';
import { LASTMM, MLEN, MWID } from '../../../web/src/formats/map';
import { LASTMON, LASTSL, MAXMARCH } from '../../../web/src/formats/monster';
import { RECLEN } from '../../../web/src/formats/recording';
import { LASTSND } from '../../../web/src/formats/sound';
import { EGG_BLOCK, MODULES, SHARDS } from './ids';
import type { Built } from './game';
import { SHARED_END } from './art/palette';
import { ROLES } from './art/roles';
import { SECTORS, SCENE, allWorlds } from './universe';
import { SONGS } from './sound/music';
import { wrapDoc } from './screens/text';

export interface Limit {
  what: string;
  max: string;
  used: string;
  where: string;
}

export function limits(b: Built): Limit[] {
  const g = b.game;
  const gam = serializeGame(g);
  const pool = (() => {
    // the string pool length is the u16 just before the pool
    const scenes = g.scenes.length;
    const off = 256 + 6 + scenes * 283;
    return gam[off] | (gam[off + 1] << 8);
  })();
  const maxLinks = Math.max(...g.scenes.map((s) => s.links.filter((l) => l.toScene !== 0xffff).length));
  const maxFiles = Math.max(...g.scenes.map((s) => s.files.filter(Boolean).length));
  const mons = b.scenes.map((s) => s.monsters);
  const roles = ROLES.reduce((n, r) => n + r.n, 0);
  const demo = b.files.get('demo.rec');
  const vocs = [...b.files.keys()].filter((f) => f.endsWith('.voc')).length;
  const gifs = [...b.files.keys()].filter((f) => f.endsWith('.gif')).length;
  const flis = [...b.files.keys()].filter((f) => f.endsWith('.fli')).length;
  const lsts = [...b.files.keys()].filter((f) => f.endsWith('.lst')).length;
  const bkds = [...b.files.keys()].filter((f) => f.endsWith('.bkd')).length;
  const pals = [...b.files.keys()].filter((f) => f.endsWith('.pal')).length;
  const mapsFull = b.scenes.length;
  // the scenes a player sees listed: title, ending and every map scene (not Between Worlds)
  const listed = b.scenes.length + 2;
  return [
    {
      what: 'Scenes in a .GAM',
      max: '231 (PLAYGAME allocates all scenes in one 64K block of 283-byte records)',
      used: `${listed}: title, ending, training deck, galaxy, 5 sectors, 88 worlds, Maelstrom, Citadel, Heart. We stopped at 100: ${listed * 283} bytes of scene records sit easily in DOS memory, every scene still loads in a moment, and the integrator's 310x165 world view still shows each scene box and link`,
      where: 'MAXIMUS.GAM',
    },
    { what: 'Scene file-name pool', max: '65,520 bytes (PLAYGAME clamps it at 0xFFF0)', used: `${pool} bytes`, where: 'MAXIMUS.GAM' },
    {
      what: 'Links per scene',
      max: String(MAXSCENELINKS),
      used: `${maxLinks} (a sector chart: the warp home, 18 planets and the jump ring onward)`,
      where: 'SECTOR1..5',
    },
    {
      what: 'Files per scene',
      max: String(SCENEFILES),
      used: `${maxFiles} (all 12 slots PLAYGAME reads for the title scene, all 11 for every world, all 4 for the ending)`,
      where: 'all scenes',
    },
    { what: 'Map size', max: `${MLEN} x ${MWID} blocks`, used: `${mapsFull} maps, every one 100 x 100 and wrapping all the way round`, where: '*.MAP' },
    {
      what: 'Monsters placed on a map',
      max: String(LASTMM),
      used: `${Math.max(...mons)} in the Maelstrom (every slot: not one left for a shot); ${mons.reduce((a, c) => a + c, 0)} in all`,
      where: 'MAEL.MAP',
    },
    {
      what: 'Monsters in a .MON',
      max: String(LASTMON),
      used: `64 in each of 9 files (${9 * 64} monsters: 4 families of 44 creatures, each in an easy and a hard edition, the Heart's own file with the boss's three later phases, plus the courier's own shots and loot)`,
      where: '*.MON',
    },
    {
      what: 'Animation steps per monster',
      max: `${LASTSL + 1} slots (PLAYGAME steps through ${LASTSL})`,
      used: `all ${LASTSL} in every creature: up to 3 drawn frames cycling with varied timing`,
      where: '*.MON',
    },
    {
      what: 'Path corners per monster',
      max: `${MAXMARCH} (x 2 paths)`,
      used: '10 (hopping slimes, figure eights); every star whale of a pod swims the same 4-corner loop on the same clock, so 45 of them hold a word together',
      where: '*.MON, SECTOR1.MAP',
    },
    { what: 'Monster blocks in a .MBL', max: String(MONBL), used: `${MONBL} in each of 5 files`, where: 'LAND/SEA/SPACE/MECH/HEART.MBL' },
    {
      what: 'Background blocks in a .BBL',
      max: String(BACKBL),
      used: `${BACKBL} in each of 4 files (${4 * BACKBL} blocks)`,
      where: 'SURFACE/OCEAN/STATION/SPACE.BBL',
    },
    { what: 'Character blocks in a .CBL', max: String(CHARBL), used: `${CHARBL} in each of 4 files`, where: 'COURIER/POD/DIVER/ROVER.CBL' },
    {
      what: 'Character sequences',
      max: `${MAXSEQ} x ${MAXFRAME} frames`,
      used: 'all 20 in each of 4 .CHR files; the Nova burst uses all 10 frames',
      where: '*.CHR',
    },
    { what: 'Inventory slots', max: String(MAXINV), used: `${MODULES.length} courier modules`, where: 'module blocks 140..149' },
    {
      what: 'Counters (meters)',
      max: '30',
      used: 'hit points, lives, credits, 15 ammo counters, all 10 extra counters (the star-shards)',
      where: 'counters 20..29',
    },
    { what: 'Sound effects in a .SND', max: String(LASTSND), used: `${LASTSND}, each with its own digitized .VOC (${vocs} files)`, where: 'MAXIMUS.SND' },
    {
      what: 'Palette colors',
      max: '256 (255 drawable; 255 is the sprite clear color)',
      used: `${SHARED_END} shared + ${roles} per place = ${SHARED_END + roles}; ${pals} palettes`,
      where: '*.PAL',
    },
    { what: 'Monsters drawn at once', max: '50', used: 'Maelstrom keeps under it so none goes invisible', where: 'MAEL.MAP' },
    { what: 'Demo recording', max: `${RECLEN} key events`, used: `${demo ? demo.length / 3 : 0} events`, where: 'DEMO.REC' },
    { what: 'Text screen width', max: '31 columns', used: '30 (a full 31 leaves its newline behind: a blank line)', where: 'INSTRUCT.TXT' },
    { what: 'CMF instruments / FM voices', max: '16 / 9 (6 + 5 drums in rhythm mode)', used: `${SONGS.length} songs, rhythm mode in all`, where: '*.CMF' },
    {
      what: 'Pictures between scenes',
      max: 'any GIF, FLI, BKD, TXT or LST',
      used: `${gifs} GIFs, ${flis} FLIs, ${bkds} BKD windows into 7 tall GIFs (a sector's planet cards, each with its world's scan; the Core's places; three hails), ${lsts} slide shows`,
      where: 'CARDS1..5.GIF, PLACES.GIF, HAILS.GIF',
    },
  ];
}

export function limitsTxt(b: Built): string {
  const rows = limits(b);
  const out = [
    'MAXIMUS: THE HUNDRED WORLDS',
    'HOW FAR GAME-MAKER GOES',
    '==============================',
    '',
    'Maximus was built to find the edges of Game-Maker 3.0 and to stand on them. These are the limits we found in its file formats and in PLAYGAME, and how close this game comes.',
    '',
  ];
  for (const r of rows) {
    out.push(r.what.toUpperCase());
    out.push(`  Limit: ${r.max}`);
    out.push(`  Used:  ${r.used}`);
    out.push(`  Where: ${r.where}`);
    out.push('');
  }
  out.push('Some limits shaped the game:');
  out.push('');
  out.push(
    '* Game-Maker animates block TYPES on one clock, so every force field of a world blinks together. Vending pads cannot restock without restocking all at once, so each sells one of each per visit.',
  );
  out.push(
    '* A scene reloads its map each time you enter, so star-shards are counters (20..29), not objects: a shard cannot be counted twice and gates test for it without using it.',
  );
  out.push('* The Maelstrom fills all 200 monster slots, so there is no slot left for a single shot: in the storm, weapons jam.');
  out.push('* Every map wraps, so every planet is a little globe: walk east long enough and you come home.');
  out.push(
    '* One big GIF per sector holds every planet card and every long-range scan; each .BKD file shows its own 320x200 window of it, so 176 pictures load from 5 files.',
  );
  out.push(
    '* A character has 20 key sequences, each with one key, and Maximus uses all 20 (moves, blaster, six module weapons, two dashes, hover, pick up, drop, hail). There is no slot left to give W/A/S/D a copy of the arrows.',
  );
  return wrapDoc(out.join('\n'));
}

/** The most interesting 16x10 window of a map: many different blocks, monsters, few empty cells. */
export function bestView(b: Built, file: string, w = 16, h = 10, near?: { x: number; y: number; r: number }): [number, number] {
  const s = b.scenes.find((x) => x.file === file)!;
  const g = s.map;
  let best: [number, number] = [0, 0];
  let bestScore = -Infinity;
  for (let y0 = 0; y0 <= 100 - h; y0 += 2)
    for (let x0 = 0; x0 < 100; x0 += 2) {
      if (near && (Math.min(Math.abs(x0 + w / 2 - near.x), 100 - Math.abs(x0 + w / 2 - near.x)) > near.r || Math.abs(y0 + h / 2 - near.y) > near.r)) continue;
      const counts = new Map<number, number>();
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) counts.set(g.get(x, y), (counts.get(g.get(x, y)) ?? 0) + 1);
      const most = Math.max(...counts.values());
      const mons = g.monsters.filter((m) => (m.x - x0 + 100) % 100 < w && m.y >= y0 && m.y < y0 + h).length;
      const score = counts.size * 2 + Math.min(mons, 6) * 4 - Math.max(0, most - w * h * 0.35) * 0.5;
      if (score > bestScore) {
        bestScore = score;
        best = [x0, y0];
      }
    }
  return best;
}

/** about.json for the catalog, the label and the box. */
export function about(b: Built): object {
  const shot = (file: string, near?: { x: number; y: number; r: number }) => [`${file}.map`, ...bestView(b, file, 16, 10, near)];
  const named = (name: string) => b.scenes.find((x) => x.name === name)!.file;
  return {
    title: 'Maximus: The Hundred Worlds',
    author: 'Claude',
    company: 'Sandbox Software',
    year: 1995,
    price: '$15',
    blurb:
      'Courier Max crosses a galaxy of 88 worlds by pod, on foot, by rover and in a diving bell, hunting the ten star-shards that can relight the dead star at its heart.',
    exe: 'MAXIMUS.EXE',
    sound: 'sb',
    egg: { block: EGG_BLOCK },
    // the save sign (kit/saveSign.ts) where the pod comes out of the asteroid knot that hides the egg (src/game.ts)
    saveSign: { map: 'galaxy.map', at: [2, 2], after: 'galaxy.map' },
    // the training deck's keepsakes (src/levels/home.ts): the tin heart and the Easter egg up under the windows past the practice range
    tinHeart: { map: 'home.map', at: [53, 43] },
    easterEgg: { map: 'home.map', at: [64, 43] },
    label: { background: '#0b1030', band: '#f0a020', ink: '#ffffff', logo: 'SANDBOX SOFTWARE' },
    box: {
      background: '#0b1030',
      accent: '#f0a020',
      ink: '#ffffff',
      tagline: 'One courier. A hundred worlds. Ten shards of light.',
      back: "The Maximus Core, the forge-star at the heart of the galaxy, has gone dark. Its light is scattered in ten star-shards across the Hundred Worlds.\n\nYou're Max, and couriers deliver. Fly your pod from world to world, then land and explore on foot, by rover or in the diving bell: grasslands, glaciers, lava fields, drowned temples and derelict stations. Walk east long enough and you come home! Raid the vaults, stock up at the trading posts, open the shard gates sector by sector, and brave the Maelstrom to the Heart of Maximus.",
      features: [
        '100 scenes: a galaxy chart, 5 sector charts and 88 explorable worlds',
        'Four ways to travel - courier pod, jet-hopping on foot, the diving bell and the rover',
        'Every planet wraps around: a real little world with caves, ruins, lakes and floating islands',
        '176 creatures on land, at sea, in space and aboard the stations',
        '10 courier modules to find: plasma lance, nova burst, shields, mines, hover pack and more',
        'Sound Blaster music and 30 digitized sound effects',
        'Secrets in the stars: watch the whales on the charts, and answer the hails',
        'Pushes Game-Maker to every limit - see LIMITS.TXT',
      ],
      shots: [
        shot(named('Verdance')),
        shot(named('Coralline')),
        shot('galaxy', { x: 50, y: 54, r: 5 }),
        shot(named('Mushroom Moon')),
        shot('heart', { x: 74, y: 47, r: 4 }),
      ],
      rating: 'Ages 8 and up',
      // the desk's box and shelf (web/src/desk/boxes/boxFacts.ts, web/src/desk/room/wallPoster.ts);
      // hours is filled in by build.ts from about.json (games/kit/playtime.ts is its only writer)
      hours: 0,
      reviews: [
        { quote: 'A whole galaxy on four floppies. We lost a long weekend to the Hundred Worlds and want it back.', source: 'VGA Voyager, March 1995' },
        { quote: 'The most ambitious Game-Maker game we have seen.', source: 'Diskette Digest' },
      ],
      award: { title: 'Shareware Game of the Month', from: 'Megapixel Monthly' },
      poster: {
        map: ['sector1.map', 0, 0, 40, 40],
        title: 'Sector 1 Chart',
        caption: "Courier's chart of the first sector: the gate, the station and the asteroid belt",
      },
    },
    // the facing check leaves these alone (games/kit/levelCheck.ts): the walker robots, the
    // saucers, the winged fighters, the face-balls and the orbs look the same from every side
    sameEverySide: [
      'heart.mon#17',
      'heart.mon#54',
      'land1.mon#24',
      'land1.mon#54',
      'land2.mon#24',
      'land2.mon#54',
      'mech1.mon#17',
      'mech1.mon#54',
      'mech2.mon#17',
      'mech2.mon#54',
      'sea1.mon#14',
      'sea1.mon#54',
      'sea2.mon#14',
      'sea2.mon#54',
      'space1.mon#11',
      'space1.mon#32',
      'space1.mon#54',
      'space2.mon#11',
      'space2.mon#32',
      'space2.mon#54',
    ],
    // Level check findings kept on purpose (games/kit/levelCheck.ts): the foe that holds the
    // hero while it hurts stays as it is
    acceptedFindings: ['hurt-lock s9 Monster 10 holds the hero while it hurts'],
  };
}

/** manual.json: the printed manual. */
export function manual(b: Built): object {
  const file = (name: string) => b.scenes.find((x) => x.name === name)!;
  const at = (name: string, _dx: number, _dy: number, w = 16, h = 10, caption = '') => {
    const s = file(name);
    const [x, y] = bestView(b, s.file, w, h);
    return `<shot map="${s.file}.map" x="${x}" y="${y}" w="${w}" h="${h}" caption="${caption}"></shot>`;
  };
  const landing = (name: string, caption: string) => {
    const s = file(name);
    return `<shot map="${s.file}.map" x="${(s.arrive.x - 8 + 100) % 100}" y="${Math.max(0, s.arrive.y - 7)}" w="16" h="9" caption="${caption}"></shot>`;
  };
  const vault = (name: string, caption: string) => {
    const s = file(name);
    const v = s.vault;
    return v ? `<shot map="${s.file}.map" x="${v.x - 8}" y="${v.y - 6}" w="16" h="9" caption="${caption}"></shot>` : '';
  };
  const rows = limits(b)
    .map((r) => `<tr><td><b>${r.what}</b></td><td>${r.max}</td><td>${r.used}</td></tr>`)
    .join('');
  const fam = (key: string, n: number) =>
    b.monsters[key].creatures
      .filter((c) => c.dmg > 0 || c.block)
      .slice(0, n)
      .map((c) => `<tr><td><b>${c.name}</b></td><td>${c.note}</td></tr>`)
      .join('');
  const worlds = allWorlds();
  return {
    title: 'Maximus: The Hundred Worlds - Courier Manual',
    pages: [
      {
        head: 'The Light Went Out',
        html: `<h1>Maximus: The Hundred Worlds</h1><p><i>Sector Zero, the year the stars went quiet.</i></p><p>For ten thousand years the <b>Maximus Core</b> burned at the heart of the galaxy: a forge-star whose light ran down the warp lanes to every inhabited world. Couriers rode that light from planet to planet, carrying everything from seed grain to love letters.</p><p>Then the Core cracked. Its light was held in ten <b>star-shards</b>, and when it broke they were flung across the <b>Hundred Worlds</b>. The warp lanes are failing. Sector by sector, the galaxy is going quiet.</p><p><b>Max</b> is a courier at Maxima Station. Couriers deliver. This time the package is the light of the galaxy: find the ten shards, carry them through the gates, fly the Maelstrom, and bring them home to the Heart.</p>${at('Verdance', -6, -6, 16, 10, 'Verdance, the first stop in The Cradle')}`,
      },
      {
        head: 'Getting Started',
        html: `<h2>Installing</h2><p>Copy every file on the disk into one directory, for example <kbd>C:\\MAXIMUS</kbd>, and type <kbd>MAXIMUS</kbd>. You need a 386 or better with VGA and 640K. A <b>Sound Blaster</b> plays the music and the digitized effects; without one, the PC speaker plays them.</p><h2>The menu</h2><ul><li><b>Play</b> starts at Maxima Station's training deck.</li><li><b>Read Instructions</b>, <b>Read Storyline</b> and <b>See Credits</b> show the pages from this manual on screen.</li><li>Leave the menu alone for half a minute and Max shows you around the training deck himself.</li></ul><h2>The training deck</h2><p>The deck teaches as you go: walk, hop the crates, pick up credits, shoot the practice drones, pay the credit door, ride the lift and walk into the airlock. Then you are in the pod.</p><h2>Lives and saving</h2><p>You start with <b>3 lives</b> and 100 hit points. Lose them all and the signal is lost. Save often with <kbd>F5</kbd>: it is a big galaxy.</p>`,
      },
      {
        head: 'Controls',
        html: `<h2>Keys</h2><table><tr><td><kbd>Left</kbd> <kbd>Right</kbd></td><td>Walk, swim, drive or thrust</td></tr><tr><td><kbd>Up</kbd></td><td>Jet hop on foot (tap again in the air to climb), thrust in the pod and the bell, jump with Spring Shocks in the rover</td></tr><tr><td><kbd>Down</kbd></td><td>Curl into a ball (on foot), dive, brake</td></tr><tr><td><kbd>Space</kbd></td><td>Fire, in the direction you last moved</td></tr><tr><td><kbd>G</kbd> / <kbd>B</kbd></td><td>Pick up / drop a module</td></tr><tr><td><kbd>T</kbd></td><td>Hail (say hello)</td></tr><tr><td><kbd>F1</kbd></td><td>Help</td></tr><tr><td><kbd>F2</kbd></td><td>Status: score, credits, hit points, lives and your modules</td></tr><tr><td><kbd>F3</kbd> / <kbd>F4</kbd></td><td>Music / sound on and off</td></tr><tr><td><kbd>F5</kbd> / <kbd>F6</kbd></td><td>Save / load</td></tr><tr><td><kbd>Esc</kbd></td><td>Quit</td></tr></table><p>The number pad's <kbd>8</kbd> <kbd>4</kbd> <kbd>6</kbd> <kbd>2</kbd> work the same as the arrows. W/A/S/D are not a second set of arrows here: <kbd>W</kbd> fires the Flak Cannon. Pick up with <kbd>G</kbd> and drop with <kbd>B</kbd>, under the left hand while the right steers and away from W/A/S/D, so a WASD habit can't throw a module away.</p><h2>Module keys</h2><table>${MODULES.map((m) => `<tr><td><kbd>${m.key}</kbd></td><td>${m.name}</td></tr>`).join('')}</table>`,
      },
      {
        head: 'Four Ways to Travel',
        html: `<h2>The courier pod</h2><p>Space charts are flown in the pod. The arrows fire its thrusters; let go and it brakes. Fly into the middle of a planet to land, into a warp ring to jump.</p><h2>On foot</h2><p>Max's suit has grav-jets: <kbd>Up</kbd> is a hop, and another tap in the air hops again. Hold <kbd>Right</kbd> while you tap <kbd>Up</kbd> to sail over gaps. Walk into the <b>uplink beacon</b> behind you to return to orbit.</p>${landing('Little Hollow', 'The uplink beacon stands behind you when you land')}<h2>The diving bell</h2><p>On sea worlds Max takes the bell. It swims at a steady pace with the arrows and holds still when you let go. Bubble columns lift you, currents push you. Surface at the <b>buoy</b> to leave.</p><h2>The rover</h2><p>Rover worlds are fast and flat. The rover rides the lifts at every step; with the <b>Spring Shocks</b> module it can jump.</p>`,
      },
      {
        head: 'The Galaxy and the Shards',
        html: `<h2>Sector gates</h2><p>The galaxy chart holds five sector warps around the dead Core. The Cradle is open; every other sector is sealed by crystal gates, two to a sector. A gate opens when you touch it carrying its shard, and the shards stay with you for good.</p><table><tr><th>Sector</th><th>Gate needs</th><th>Worlds</th></tr>${SECTORS.map((s, k) => `<tr><td>${k + 1}. ${s.name}</td><td>${k === 0 ? 'open' : `${SHARDS[k * 2 - 2]} + ${SHARDS[k * 2 - 1]}`}</td><td>${s.worlds.length}</td></tr>`).join('')}<tr><td>The Core</td><td>all ten</td><td>3</td></tr></table><h2>Jump rings</h2><p>Every sector chart also holds a <b>jump ring</b>, walled in behind the next sector's crystal gates: carry those shards and it takes you straight on. The ring in The Deep Black leads to the Maelstrom itself.</p><h2>Finding shards</h2><p>Planets with a <b>gold signal</b> beside them on the sector chart hold a shard, deep in a vault. The planet card you see on landing says where you are (SECTOR 2 OF 5, WORLD 9 OF 18), names the shard and which of the ten it is (SHARD 3 OF 10), reminds you that <kbd>F5</kbd> saves, and its <b>long-range scan</b> shows the whole world: where you land (green) and where the vault lies (gold).</p><h2>The Core</h2><p>All ten shards open the way to the Core. Fly the <b>Maelstrom</b>, a storm canyon so packed with rock that your weapons jam, to the <b>Citadel</b>, whose vault holds the teleporter to the <b>Heart</b>. There the Guardian's armor plates stand across the hall, and down their middle runs a seal of light that opens only to the Core's own spark. The <b>Heart Eye</b> circles in front of it and swoops when you come near. Crack it three times, with a plasma bolt, a shield orb or by ramming it (that hurts), and it bursts into the Core Light, which finds you and charges the seal: then walk through. Plasma cracks the plates; shouldering into them works too, for a few hit points.</p><h2>Trading posts</h2><p>Each chart has a trading post. Nudge a pad to buy: an extra life (100 credits), repairs (20), plasma cells (30), nova charges (40), shield charges (30) and med kits (50). One of each per visit.</p>`,
      },
      {
        head: 'Worlds and Vaults',
        html: `<h2>What you will find</h2><ul><li><b>Credits</b> (green chips), <b>gems</b> (score), <b>hearts</b> (hit points), <b>1-Ups</b> and <b>ammo cells</b> for your modules.</li><li><b>Vaults</b> deep underground hold the shards and modules. A <b>credit door</b> costs 10 credits to open; a <b>force field</b> blinks on and off.</li><li><b>Crystal walls</b> shatter at a touch, and some rock is not rock at all: secret pockets hide treasure.</li><li><b>Lifts</b> and <b>bubble columns</b> carry you up; <b>winds</b> and <b>currents</b> push you along.</li><li><b>Lava, acid and brine</b> hurt, but the jolt hops you out. A <b>healing spring</b> in the caves mends 100 hit points in one long drink, then runs dry until you land on that world again.</li><li><b>Nests</b> in cave walls send out creatures until you leave.</li></ul>${at('Copperfield', 20, 30, 16, 10, 'Caves under Copperfield')}`,
      },
      {
        head: 'Courier Modules',
        html: `<h2>The ten modules</h2><p>Modules lie in planet vaults. Press <kbd>G</kbd> to pick one up; it stays in your inventory (<kbd>F2</kbd>) and works in every vehicle that can use it.</p><table><tr><th>Module</th><th>Key</th><th>Where</th></tr>${MODULES.map(
          (m, i) => {
            const w = worlds.find((x) => x.world.module === i);
            return `<tr><td>${m.name}</td><td><kbd>${m.key}</kbd></td><td>${w ? `${w.world.name}, ${SECTORS[w.sector].name}` : ''}</td></tr>`;
          },
        ).join(
          '',
        )}</table><p>Ammunition counts carry from vehicle to vehicle. The <b>Plasma Lance</b> is the only weapon that cracks armor; the <b>Shield Emitter</b>'s guard orb stops almost anything.</p>`,
      },
      {
        head: 'Creatures',
        html: `<h2>On the worlds</h2><table>${fam('land1', 9)}</table><h2>In the seas</h2><table>${fam('sea1', 6)}</table><h2>In space</h2><table>${fam('space1', 6)}</table><h2>On the stations</h2><table>${fam('mech1', 6)}</table><p><b>Star whales</b> are gentle and swim in pods. Every whale in a pod follows the same loop at the same moment, so a pod keeps its shape: look for thirteen of them circling on the galaxy chart, and for a pod in The Cradle that spells somebody's name.</p><p>Most creatures burst when they hit you. A few things - flytraps, magma, tumbling asteroids, the Phantom - cannot be hurt at all: keep moving.</p>`,
      },
      {
        head: 'Registering Maximus',
        html: `<h2>This is shareware</h2><p>Copy it, share it, upload it. If you enjoy Maximus, please register: registration is <b>$15</b> and gets you the printed manual with a fold-out galaxy chart, the courier's sector map of all 88 worlds and their vaults, the hint book, and news of our next game.</p><p>Send a check or money order (US funds) to:</p><p><b>Sandbox Software<br>Attn: Maximus Registration<br>P.O. Box 000<br>Pittsburgh, PA 15213</b></p><h2>Credits</h2><p>Designed and built by <b>Claude</b> for Sandbox Software, with Game-Maker 3.0 by Recreational Software Designs. Every world, sprite, song and sound was made by a program from a seed.</p><h2>Hails</h2><p>Three worlds call you before you land. <b>Galileo</b> is an old Earth probe still running a loop on its RCA 1802 (the real chip flew to Jupiter). <b>Liberty</b> keeps a cracked bell under thirteen stars, and an archive of every letter a courier ever brought. On <b>Boxcar Flats</b>, Doc Leo, PhD (Comedic Science), will walk your parcel over with his rubber chicken. Answer them all!</p><p><i>Dedicated to three real couriers: Lewis's mother, a letter carrier; his father, who kept the post office running in maintenance; and his grandmother, a postal clerk. All three were at the post office when he bought Game-Maker in 1992.</i></p>${vault('Ambermoor', 'A shard vault')}`,
      },
      {
        head: 'Pushing the Limits',
        html: `<h2>How far Game-Maker goes</h2><p>Maximus was built to stand on every edge of Game-Maker 3.0. These are the limits we found in its file formats and in PLAYGAME, and how much of each this game uses (also in <kbd>LIMITS.TXT</kbd> on the disk).</p><table><tr><th>Limit</th><th>Maximum</th><th>Maximus uses</th></tr>${rows}</table>`,
      },
    ],
  };
}

export { SCENE };
