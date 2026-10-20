// Every word Sir Grit's players read: the story, the instructions, the level briefings
// (shown as BBS messages, 30 columns wide), and the shareware notice.

/** Wraps paragraphs to Game-Maker's text screens (30 characters a line, so fgets never splits). */
export function wrap(text: string, width = 30): string {
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
  return out.join('\n') + '\n';
}

export const STORY = wrap(`
Pittsburgh, summer of 1995. Behind a brick house on a hill, past the tomato plants, sits a wooden sandbox. By day the kids build castles in it. By night, while the modem upstairs squeals, the castles belong to the toys.

Sir Grit is the smallest of them: a tin knight with a red plume, no taller than your thumb. He keeps four sandcastles and the toy chest he sleeps in.

This morning he woke to ruin. Lady Whiskerbane, the tabby from next door, has claimed the sandbox. Her kneading paws flattened every tower.

Ants dug into the keep. The hose was left running into the moat. Crabs overran the tide pool, and beetles hold the old burrow.

Take up your shovel, Sir Grit. Rebuild the towers, raise the gates, and win back the Crown of the Sandbox from the cat who sleeps on it.
`);

export const HELP = wrap(`
|ARROWS  walk
|P       pick up (stand on it)
|SPACE   fling sand (shovel)
|B       throw water (bucket)
|F1 help  F2 status  F4 sound
|F5 save  F6 load    ESC quit

SAND: scoop sand piles, and dig dunes by walking into them with the shovel. F2 shows your sand as Money. Sand plugs anthills, fills fords and builds towers.

TOWERS: walk into a tower ring with sand to build it, then walk into it again to plant your flag. Four flags lift a castle gate.

WATER: water balloons and the cat's bowls fill your bucket. Only water flips a crab. With the bucket, walk into a dashed outline to pack a wall of wet sand. Crabs can't get past it.

CURRENTS carry you. Nobody walks upstream.

CRUMBLY BRIDGES fall in behind you. Don't stop on them!

TIDES: waves push you up the beach, and the tidal flat floods now and then. Wait it out on a sandbar.

ACORNS open root doors underground. A cracked wall may not be a wall at all.
`);

export const CREDITS = wrap(`
|SANDCASTLE KNIGHT  v1.0
|(c) 1995 Sandbox Software

Design, pixels and beeps by Claude. Made with GAME-MAKER 3.0 from Recreational Software Designs.

Dedicated to everyone who ever logged on to THE -= S A N D B O X =- BBS in Pittsburgh, PA.

This is SHAREWARE. If you enjoy Sir Grit's adventure, please register for $10. See README.TXT for details.

Greetz to the SysOp, the 2 a.m. door game crowd, and every cat that ever sat on a keyboard.
`);

export const INTRO = {
  hub: wrap(`
|THE SANDBOX

Morning. The castles are flat.

Your shovel lies by the toy chest. Stand on it and press P.

Walk into a dune to dig it. Anthill Keep waits behind the dunes.

Each castle you win back sets you down in a new corner of the sandbox.
`),
  keep: wrap(`
|1. ANTHILL KEEP

Ants have moved into the keep.

Bring sand to each of the four tower rings (walk into the ring), then touch it again to plant your flag. Four flags lift the gate.

Plug anthills with sand. SPACE flings sand at ants.
`),
  moat: wrap(`
|2. HOSEWATER MOAT

Somebody left the hose on, and the keep is an island now.

Fill the staked ford with sand, or run across the sand bridge. It crumbles behind you!

The hose current flows one way only. Ride it.
`),
  lagoon: wrap(`
|3. LOW TIDE LAGOON

The kiddie pool spilled over into a beach with real tides.

Find the bucket (P). Balloons fill it; B throws water. Crabs flip only for water. With the bucket, walk into a dashed outline to pack a wall.

Bring 3 golden shells from the sandbars to the sea gate. Mind the tide!
`),
  burrows: wrap(`
|4. BEETLE BURROWS

Under the sandbox the old burrow runs dark and deep.

Root doors open for acorns. Plug beetle nests with sand.

Some cracked walls are only cracks...

The far ladder climbs to the patio.
`),
  patio: wrap(`
|5. LADY WHISKERBANE

The patio, at sunset. The cat sleeps on the Crown of the Sandbox.

Her paws guard the ways around her. Splash a paw twice and she pulls it back.

Fill your bucket at her water bowls. Mind the hairballs and the yarn!
`),
  bbs: wrap(`
|CONNECT 2400

Welcome to THE -= S A N D B O X =- BBS, Pittsburgh, PA!

You found the secret dial-up. Grab the floppies (shareware!), but watch out for line noise.

Leave by the door of static.
`),
};

export const WON = wrap(`
|*** YOU WON! ***

The Crown of the Sandbox sits on the tallest tower of the keep again.

Lady Whiskerbane has gone home to nap on a warm car hood.

Long live Sir Grit!

Thanks for playing. Please register: see README.TXT.
`);

export const LOST = wrap(`
|NO CARRIER

The tide came in, and Sir Grit is a little heap of sand with a helmet on top.

But sand can always be built again.

Try again, brave knight!
`);

export const README = `SANDCASTLE KNIGHT  v1.0
Copyright (c) 1995 Sandbox Software.  All rights reserved.
=====================================================================

This is SHAREWARE.  You may copy this disk and give it to your
friends, upload it to your favorite BBS, or put it in a shareware
library, as long as all of the files stay together and unchanged.

If you enjoy it, register for $10 with Sandbox Software.  You'll get:

  * the next Sir Grit adventure on disk as soon as it is done,
  * a printed map of the sandbox, with every secret marked,
  * our thanks, and a clear conscience.

Send a check or money order for $10 (US funds) to:

      Sandbox Software
      P.O. Box 4215
      Pittsburgh, PA 15213

Include your name, your address, and the disk size you want
(3.5" or 5.25").

---------------------------------------------------------------------
THE GAME

Lady Whiskerbane, the tabby from next door, has taken over the
sandbox.  Help Sir Grit, a thumb-sized tin knight, rebuild four
sandcastles, beat the ants, the hose, the tide and the beetles, and
take back the Crown of the Sandbox.

To play, run SANDCAST.EXE.  Press F1 while playing for help.

  Arrow keys .... walk          P ........ pick up
  SPACE ......... fling sand    B ........ throw water
  F2 ............ status (your sand is shown as "Money")
  F5 / F6 ....... save / load   ESC ...... quit

Requires a 286 or better, VGA, and 640K.  Sounds play on the PC
speaker; no sound card needed.

---------------------------------------------------------------------
Made with GAME-MAKER 3.0 by Recreational Software Designs.
Greetings to everyone who ever called THE -= S A N D B O X =- BBS.
`;
