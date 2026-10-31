// Extract selected public-game blocks for achievement badges; no game code enters the browser bundle.
// Run from web/: npx vite-node scripts/achievementArt.ts
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ACHIEVEMENTS } from '../src/achievements/catalog';
import { encodeIndexedPng } from './gameShots';
import { picks as selections, sets } from './achievementSets';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

const badges: Record<string, { image: string; game: string; set: string; block: string }> = {};
const seen = new Set<string>();
for (const [id, [set, name]] of Object.entries(selections)) {
  if (!ACHIEVEMENTS.some((a) => a.id === id)) throw new Error(`Unknown achievement ${id}`);
  const source = sets[set];
  if (!source) throw new Error(`Unknown set ${set} for ${id}`);
  const pic: Pixels | undefined = source.blocks.get(name);
  if (!pic || pic.w !== 20 || pic.h !== 20) throw new Error(`Not a 20x20 block: ${set}/${name}`);
  const png = encodeIndexedPng({ width: 20, height: 20, pixels: pic.px, palette: source.palette }, 255);
  const hash = createHash('sha256').update(png).digest('hex');
  if (seen.has(hash)) throw new Error(`Duplicate badge art: ${id}`);
  seen.add(hash);
  badges[id] = { image: `data:image/png;base64,${Buffer.from(png).toString('base64')}`, game: source.game, set, block: name };
}
writeFileSync(
  new URL('../src/achievements/blockArt.json', import.meta.url),
  JSON.stringify(
    {
      notice:
        'Project-owned game art by Lewis Moten using Anthropic Claude; the Teddy tier badges, the Certified Rat Tickler, Final Curtain, A Fly Named Carl, Great Dairy Reckoning, Needle and Risi badge blocks and the extraction by Claude Sonnet 5.5 (earlier extraction with OpenAI Codex). See NOTICE.md and docs/achievement-art.md.',
      badges,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Extracted ${Object.keys(badges).length} unique 20x20 badge blocks.`);

const props: Record<string, string> = {
  '🆕': 'a blank sheet of paper with one folded corner',
  '🧰': 'an open toolbox with a pencil and wrench',
  '🧺': 'a wicker basket full of different felt eggs',
  '💾': 'a floppy disk with a bright paper label',
  '🌐': 'a globe with a tiny network cable',
  '🖥️': 'a beige CRT monitor showing a DOS prompt',
  '🐧': 'a cheerful penguin with a disk tucked under one wing',
  '📦': 'a taped shipping box with little wings',
  '🩺': 'a magnifying glass over a tidy map grid',
  '✨': 'a sparkling wrench',
  '✅': 'a clipboard with a large green check',
  '🤖': 'a friendly wind-up robot',
  '🎛️': 'a mixing panel with three chunky knobs',
  '🎬': 'a clapperboard with a bright opening star',
  '🔥': 'a tiny glowing map with warm footprints',
  '⏺️': 'a tape recorder with a bright red record button',
  '👓': 'a pair of glasses over three clearly distinct color swatches',
  '🏁': 'a checkered finish flag',
  '🎒': 'a school backpack with a game controller sticking out',
  '💽': 'a labeled DOS disk in a sleeve',
  '🏄': 'a tiny surfer riding a curling cable',
  '↔️': 'a landscape phone with left and right arrows',
  '↕️': 'a portrait phone with up and down arrows',
  '📼': 'a cassette marked SAVE',
  '🎻': 'a violin with one jaunty musical note',
  '🥇': 'a gold medal on a striped ribbon',
  '🎤': 'a microphone taking a bow',
  '🔊': 'a speaker with three bright sound rays',
  '🔖': 'a ribbon bookmark in an open book',
  '🎖️': 'a star-shaped merit medal',
  '👑': 'a wonky gold crown with three colored gems',
  '💖': 'a wreath of tiny shining tin hearts',
  '💩': 'a mischievous corgi beside a suspiciously lumpy felt egg',
  '📺': 'a CRT showing a replay arrow',
  '⏭️': 'a film strip jumping over a small gap',
  '📽️': 'a little robot turning a film projector crank',
  '🎥': 'a movie camera with two round reels',
  '🎞️': 'a curled strip of film with three distinct frames',
  '🔌': 'a chunky power plug with a bright indicator',
  '⌨️': 'a beige keyboard with an oversized Enter key',
  '📥': 'an arrow landing in a floppy disk tray',
  '📶': 'a modem with three rising signal bars',
  '🐢': 'a determined turtle carrying a modem',
  '⏩': 'a clock with two fast-forward arrows',
  '🚀': 'a tiny rocket trailing a telephone cable',
  '🐌': 'a snail carrying a half-finished progress bar',
  '⭕': 'a rotary dial with its last hole highlighted',
  '❌': 'a telephone number card crossed out in red',
  '📵': 'a disconnected handset beside a sleeping modem',
  '🛋️': 'a welcoming sofa with a blinking terminal',
  '📠': 'a fax machine unrolling a tiny welcome banner',
  '👋': 'a waving hand beside a terminal',
  '☎️': 'a ringing rotary telephone',
  '⏰': 'an alarm clock with a little callback arrow',
  '🔢': 'a hex keypad with A and F keys',
  '🛠️': 'a screwdriver beside a saved-game disk',
  '🗄️': 'a backup drawer holding three labeled disks',
  '🏴‍☠️': 'a playful pirate hat above a DOS prompt',
  '📝': 'a registration form and a sharpened pencil',
  '🐣': 'a felt chick peeking out of an egg',
  '🗃️': 'an open card file with colorful page tabs',
  '🕹️': 'a chunky directional game pad',
  '🖱️': 'a square patterned mouse pad and a beige mouse',
  '🔇': 'a PC speaker beside a silent sound card',
  '📋': 'a clipboard full of tiny earned badges',
  '🎭': 'two friendly theater masks',
  '👏': 'two applauding hands under a stage light',
  '🧾': 'a folded instruction leaflet',
  '🧭': 'a compass over a winding route',
  '🗺️': 'a folded map with a clearly marked route',
  '📐': 'a ruler and a triangular map outline',
  '🏛️': 'a miniature library facade',
  '📚': 'three books with brightly different spines',
  '🗞️': 'a rolled magazine tied with a ribbon',
  '📑': 'a fanned stack of magazine feature pages',
  '💿': 'a shiny disc in a paper magazine sleeve',
  '📴': 'a powered-down screen with a tiny moon',
  '📬': 'an open mailbox holding a letter',
  '🌙': 'a smiling crescent moon with one star',
  '❄️': 'a mitten tracing a snowflake on glass',
  '🔈': 'a small vibrating desk speaker',
  '🌈': 'a CRT with expanding degauss color rings',
  '🚗': 'THE CHEZ seen from the front, with Teddy in the passenger seat',
  '🟣': 'a purple blacklight tube above a glowing star',
  '💡': 'a glowing ultraviolet bulb',
  '🚜': 'a friendly snowplow pushing a little white drift',
  '🛷': 'a wooden sled leaving two tracks',
  '🐕': 'Teddy and Gwinn in a playful chase',
  '🐐': 'a surprised goat with a tiny musical note',
  '🌠': 'a shooting star with a short stepped trail',
  '🌌': 'a curtain of green and violet northern lights',
  '📮': 'a small mail truck with a raised envelope emblem',
  '🚙': 'a boxy mail jeep with a letter in its window',
  '✉️': 'an open envelope with a handwritten letter',
  '📰': 'a small magazine with a bold cover picture',
  '🔆': 'a desk lamp casting a warm circle',
  '😉': 'a friendly face peeking around a curtain',
  '🟢': 'a clock dial with glowing green hands',
  '🔦': 'a flashlight revealing a felt egg',
  '📓': 'a little notebook with a ribbon marker',
};
const proposal = (a: (typeof ACHIEVEMENTS)[number]): string => {
  if (a.from === 'everyLife') return `A friendly giant lands on a squashy cushion, wearing a helmet marked ${a.times}.`;
  if (a.from === 'everyLoss') return `A friendly giant gathers fallen game pieces beside a retry arrow marked ${a.times}.`;
  if (a.from === 'everyWin') return `A friendly giant balances a trophy stack beside a pennant marked ${a.times}.`;
  return `20×20 block: ${props[a.icon] ?? `a small trophy inspired by “${a.title}”`}, with a dark outline and one clear focal shape.`;
};
const existing = Object.entries(badges)
  .map(([id, b]) => `| ${id} | ${b.game} | ${b.set} / ${b.block} |`)
  .join('\n');
const missing = ACHIEVEMENTS.filter((a) => !badges[a.id])
  .map((a) => `| ${a.id} | ${a.title} | ${proposal(a)} |`)
  .join('\n');
writeFileSync(
  new URL('../../docs/achievement-art.md', import.meta.url),
  `# Achievement block art

Badges reuse the original 20×20 indexed blocks below, at integer-friendly display sizes.
The selected public games are by Lewis Moten using Anthropic Claude (MIT).
The nine every-life, every-loss and every-win tier badges are composed from Teddy's poses
(hop, hurt, bark) with a bronze, silver or gold plate and a 1, 3 or 10 mark, by Claude Sonnet 5.5,
which also extracted the later picks and drew the thirteen new Certified Rat Tickler blocks (a toolbox, clipboard,
mixing panel, UV bulb, blacklight, CRT, sound card, hex keypad, screwdriver and disk, pirate hat, surfer, fax and
waving hand) as scenery in that game, and the eighteen new Final Curtain blocks (a rotary dial, number card, two masks,
ribbon book, leaflet, registration form, badge clipboard, blank sheet, film strip, clapperboard, magnifier, peeking face,
phone, busy line, heat map, speaker, medal and tin-heart wreath) as scenery in the green room, the stage and the curtain.
It also drew the six new A Fly Named Carl blocks (a backpack with a game controller, a DOS disk in its sleeve, a wide and a
tall phone, a winged parcel and a mail jeep) as scenery in the living room and the yard, and four new Great Dairy Reckoning blocks
(a gold cup, a silver cup marked 3, a rolled magazine and a glow-in-the-dark clock) as scenery in the kitchen and bedroom.
It also drew four new Needle blocks (a brass compass over a winding route, a folded map, a ruler and a triangle, and glasses over
three color swatches) as scenery in the tailor's shop.
It also drew a new Risi block (a small library front with columns, steps and a scroll) as scenery in the rooftops.
OpenAI Codex extracted the first images and wrote the
badge integration under Lewis's direction. No third-party emoji artwork is copied into the badge images.

Run \`npx vite-node scripts/achievementArt.ts\` from \`web/\` to regenerate
\`src/achievements/blockArt.json\` and this inventory. The sources and selections are in
\`scripts/achievementSets.ts\` and the tier badges in \`scripts/achievementTiers.ts\`; the generator rejects
duplicate image bytes.

## Selected blocks

| Achievement | Public game | Source set / block |
| --- | --- | --- |
${existing}

## Art still needed

These entries use a neutral question block until suitable, distinct art is selected.
Proposals are drawing briefs, not promises of another game. Each should remain readable
at 20×20 pixels; the friendly giant ideas could share a character while varying the action.
Hidden achievements keep their question block until unlocked, even when art is available.

| Achievement | Title | Proposed art |
| --- | --- | --- |
${missing}
`,
);
