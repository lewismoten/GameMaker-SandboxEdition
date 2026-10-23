// Every word Teddy's players read: the story, the instructions, the level briefings
// (shown as BBS messages, 30 columns wide), and the shareware notice.
import { withCreditPage } from '../../../kit/license';

/** The BBS's name, which a line break must never split. */
const BBS_NAME = 'THE -= S A N D B O X =- BBS';
const KEEP = '\u0001'; // stands in for the name's spaces while wrapping

/** Wraps paragraphs to Game-Maker's text screens (30 characters a line, so fgets never splits). */
export function wrap(text: string, width = 30): string {
  text = text.split(BBS_NAME).join(BBS_NAME.replace(/ /g, KEEP));
  const out: string[] = [];
  for (const para of text.trim().split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    if (para.startsWith('|')) {
      out.push(para.slice(1));
      continue;
    }
    let line = '';
    for (const word of para.trim().split(/\s+/)) {
      if (line && (line + ' ' + word).length > width) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) out.push(line);
  }
  for (const l of out) if (l.length > width) throw new Error(`Line too long: "${l}"`);
  return out.join('\n').split(KEEP).join(' ') + '\n';
}

export const STORY = wrap(`
Pittsburgh, the Fourth of July, 1995. Behind a brick house on a hill sits a wooden sandbox, and it has a knight: TEDDY, a Pembroke Welsh Corgi in a tin helmet with a red plume.

Teddy knows lots of tricks. He loves his toys. Everybody on the street loves him.

He also has a big sister. GWINN is a brown pit-lab mix, twice his size, and she ruins everything. Not on purpose. She just has a lot of zoomies.

This morning she came through the sandbox at full speed. Every castle fell flat. She knocked the hose on into the moat, tipped the kiddie pool into the lagoon, dug a hole under it all, and scattered Teddy's toys from one end to the other.

Then she flopped down on the patio for a nap, right on top of the Crown of the Sandbox.

Your shovel lies by the toy chest. Stand on it and press P, then dig through the dunes to Anthill Keep.
`);

export const HELP = wrap(`
|ARROWS or W A S D  walk
|P      pick up
|SPACE  fling sand (shovel)
|B      throw water (bucket)
|F      toss a tennis ball
|TRICKS: 2 sit   3 spin
|4 play dead     5 roll over
|F2 status F5 save F6 load

SAND: scoop sand piles, and dig dunes by walking into them with the shovel. F2 shows your sand as Money. Sand plugs anthills, fills fords and builds towers.

TOWERS: walk into a tower ring with sand to build it, then walk into it again to plant your flag. Four flags lift a castle gate.

GWINN won't budge for sand or water. Toss her a tennis ball (F) and she trots off happy. Walk toward her first: things fly the way you last walked.

SPIN (3) kicks up a whirl of sand that bowls over ants and beetles.

WATER: balloons and Gwinn's bowls fill your bucket. Only water (or a ball) flips a crab. With the bucket, walk into a dashed outline to pack a wall of wet sand.

CURRENTS carry you. CRUMBLY BRIDGES fall in behind you. The tidal flat floods: wait on a sandbar.

ACORNS open root doors. A cracked wall may not be a wall at all.
`);

const CREDITS_TEXT = wrap(`
|SANDCASTLE KNIGHT  v1.1
|(c) 1995 Sandbox Software

Design, pixels and beeps by Claude. Made with GAME-MAKER 3.0 from Recreational Software Designs.

Starring Teddy, a very good boy, and his big sister Gwinn, who is also a good girl, mostly.

This is SHAREWARE. If you enjoy Teddy's adventure, please register for $10. See README.TXT for details.

Greetz to the SysOp, the 2 a.m. door game crowd, and every dog who ever sat on a keyboard.
`);

export const INTRO = {
  keep: wrap(`
|1. ANTHILL KEEP

Gwinn's zoomies knocked the keep flat, and ants moved in.

Bring sand to each of the four tower rings (walk into the ring), then touch it again to plant your flag. Four flags lift the gate.

Plug anthills with sand. SPACE flings sand at ants.

Gwinn is asleep in the doorway. Find a tennis ball!
`),
  moat: wrap(`
|2. HOSEWATER MOAT

Gwinn stepped on the hose, and now the keep is an island.

Fill the staked ford with sand, or run across the sand bridge. It crumbles behind you!

The hose current flows one way only. Ride it.
`),
  lagoon: wrap(`
|3. LOW TIDE LAGOON

Gwinn tipped the kiddie pool over, and now the beach has real tides.

Find the bucket (P). Balloons fill it; B throws water. Crabs flip for water. With the bucket, walk into a dashed outline to pack a wall.

Bring 3 golden shells to the sea gate. Mind the tide!
`),
  burrows: wrap(`
|4. BEETLE BURROWS

Gwinn dug a hole under the sandbox. A BIG one. The beetles love it.

Root doors open for acorns. Plug beetle nests with sand.

Some cracked walls are only cracks...

The far ladder climbs to the patio.
`),
  patio: wrap(`
|5. GWINN'S NAP

The patio, at sunset. Gwinn is snoring on the Crown of the Sandbox.

Splash a paw twice and she tucks it in: the left one by her side, then the right one by the crown.

Her snores blow down the path. When the dust stirs, wait.

Her bowls never run dry. Mind the slobbery balls and rope toys!
`),
  bbs: wrap(`
|CONNECT 2400

Welcome to THE -= S A N D B O X =- BBS, Pittsburgh, PA!

SysOp: Lewis. Co-SysOp: Doc Leo, PhD (Comedic Science).

You found the secret dial-up. Grab the floppies (shareware!), but watch out for line noise. Leave by the door of static.

New upload: SYSOP.GIF!
`),
};

/** Climbing out of Gwinn's dig with what was buried there. */
export const DUG = wrap(`
|THE SANDCASTLE EGG

Sandy tan felt, blue waves, a turreted castle with a pink pennant, one brown paw print.

Pressed into the wet sand: "ONCE," then a measuring cup, a ladle and twelve little egg shapes in a row. One more sits apart, half dug, as if somebody got called in for supper.

|Dug up by Gwinn, with help
|(and a nap) from Teddy.
`);

export const WON = wrap(`
|*** GOOD BOY! ***

The Crown of the Sandbox is back on the tallest tower, under a thirteen-star flag.

Fireworks went up for the Fourth. Teddy sat, like a good boy. Gwinn barked at every one.

She gave Teddy a big sloppy lick and helped carry his toys home. (Most of them.)

Thanks for playing! Register: see README.TXT.
`);

export const LOST = wrap(`
|NO CARRIER

Teddy is all tuckered out, flat on his back in the sand.

Gwinn came over and licked his ear, which helped a little.

Shake it off and try again, brave knight!
`);

export const README = wrap(
  `
|SANDCASTLE KNIGHT  v1.1
|(c) 1995 Sandbox Software.
|All rights reserved.
|===============================

This is SHAREWARE. You may copy this disk and give it to your friends, upload it to your favorite BBS, or put it in a shareware library, as long as all of the files stay together and unchanged.

If you enjoy it, register for $10 with Sandbox Software. You'll get:

|  * the next Teddy adventure
|    on disk as soon as it is
|    done,
|  * a printed map of the
|    sandbox, with every secret
|    marked,
|  * our thanks, and a clear
|    conscience.

Send a check or money order for $10 (US funds) to:

|    Sandbox Software
|    P.O. Box 000
|    Pittsburgh, PA 15213

(This address is fictional, made up for this game. Please don't mail anything to it!)

Include your name, your address, and the disk size you want (3.5" or 5.25").

|-------------------------------
|THE GAME

Teddy is a Pembroke Welsh Corgi, the knight of the backyard sandbox. His big sister Gwinn, a brown pit-lab mix twice his size, just ran through it with the zoomies: castles flattened, hose running, kiddie pool tipped, toys everywhere. Help Teddy rebuild four sandcastles, beat the ants, the hose, the tide and the beetles, and get the Crown of the Sandbox back from under his snoring sister.

To play, run SANDCAST.EXE. Press F1 while playing for help.

|  Arrows or W A S D .. walk
|  P ....... pick up
|  SPACE ... fling sand
|  B ....... throw water
|  F ....... toss a tennis ball
|            (Gwinn can't resist
|            one)
|  Tricks .. 2 sit, 3 spin,
|            4 play dead,
|            5 roll over
|  F2 ...... status (your sand
|            is shown as
|            "Money")
|  F5 / F6 . save / load
|  ESC ..... quit

Requires a 286 or better, VGA, and 640K. Sounds play on the PC speaker; no sound card needed.

|-------------------------------
Made with GAME-MAKER 3.0 by Recreational Software Designs. Greetings to everyone who ever called THE -= S A N D B O X =- BBS.
`,
  31,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
