// The words on the disk: instructions and credits pages (shown 31 columns wide by
// Game-Maker), the shareware README.TXT and LIMITS.TXT.
import { MODULES, SHARDS } from './src/ids';
import { SECTORS } from './src/universe';

/** Wraps text for Game-Maker's text screens: fgets reads 31 characters, so a full
 * 31-character line would leave its newline for the next read (a blank line); keep to 30. */
export function wrap31(text: string): string {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of para.split(/\s+/)) {
      if ((line ? line + ' ' + w : w).length > 30) {
        out.push(line);
        line = w;
      } else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
  }
  return out.join('\n') + '\n';
}

export const INSTRUCTIONS = wrap31(`HOW TO PLAY MAXIMUS

Find the ten star-shards and carry their light to the Core.

THE GALAXY
You fly the courier pod. Thrust with the arrow keys. Fly into a warp ring to jump to a sector. Gates of colored crystal bar the outer sectors: touch a gate while you carry its shard and it opens.

SECTOR CHARTS
Fly into the middle of a planet to land. Planets with a gold signal beside them hold a shard. The planet card shows a long-range scan: green is you, gold is the vault. Trading posts sell supplies: nudge a pad to buy, one of each per visit. A jump ring behind gates takes you on to the next sector.

ON FOOT
Left/Right walk (the number pad's 4/6/8/2 work as arrows too). Up fires your jets: tap it again in the air to climb higher. Down curls into a ball. Space fires your blaster the way you last moved. P picks things up. To go back to orbit, walk into the uplink beacon.

UNDER THE SEA
The diving bell swims with the arrows and coasts when you let go. Surface at the buoy to leave.

ROVER WORLDS
The rover drives fast and rides the lifts. With Spring Shocks, Up makes it jump.

MODULES
Ten modules hide in planet vaults. Each adds a key:
Z Plasma Lance (kills armor)
X Nova Core (8-way burst)
Q/E Dash Boots
C Shield Emitter (guard orb)
F Hover Pack
V Mine Layer
H Med Kit
W Flak Cannon
Q/E Hydro Jets (diving bell)
Up Spring Shocks (rover)
T Hail (say hello)

VAULTS
Credit doors cost 10 credits to open. Force fields blink on and off. Crystal walls shatter at a touch.

KEYS
F1 help  F2 status
F3 music F4 sound
F5 save  F6 load
Esc quit

Good luck, courier.`);

export const CREDITS = wrap31(`MAXIMUS: THE HUNDRED WORLDS

Designed and built by
CLAUDE

for SANDBOX SOFTWARE
Pittsburgh, PA

Made with GAME-MAKER 3.0 by
Recreational Software Designs

Every world, sprite, song and sound effect was made by a program, from a seed, so you and your friends fly the same galaxy.

Music for Sound Blaster FM.
Speech and effects digitized at 11 kHz.

Thanks to every courier who ever delivered anything on time.

Dedicated to three real couriers: Lewis's mother, a letter carrier; his father, who kept the post office running in maintenance; and his grandmother, a postal clerk. They were all at the post office when he bought Game-Maker in 1992.

This is shareware. If you enjoy it, please register.`);

/**
 * Wraps a plain-text file (README.TXT, LIMITS.TXT) to Game-Maker's text width: lines that
 * fit are kept as they are (tables, rules); longer ones wrap with a hanging indent under
 * their bullet or label ("* ", "1. ", "Limit: ").
 */
export function wrapDoc(text: string, width = 30): string {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line.length <= width) {
      out.push(line);
      continue;
    }
    const lead = /^(\s*(?:[*-] |\d+\. |[A-Z][a-z]+: +)?)/.exec(line)![1];
    const hang = ' '.repeat(Math.min(lead.length, 10));
    let cur = lead;
    let first = true;
    // A word too long for a line (LAND/SEA/SPACE/MECH.MBL) breaks after its slashes.
    const words = line
      .slice(lead.length)
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((w) => (w.length > width - hang.length ? w.split(/(?<=\/)/).map((p, i) => ({ w: p, glue: i > 0 })) : [{ w, glue: false }]));
    for (const { w, glue } of words) {
      const pad = first || glue ? '' : ' ';
      if ((cur + pad + w).length > width && cur.trim() && cur.length > hang.length) {
        out.push(cur);
        cur = hang + w;
      } else cur += pad + w;
      first = false;
    }
    out.push(cur);
  }
  for (const l of out) if (l.length > width) throw new Error(`wrapDoc: a word won't fit in ${width} columns: ${l}`);
  return out.join('\n').replace(/\n*$/, '\n');
}

export const README = (price: string, files: number, mb: string) =>
  wrapDoc(`MAXIMUS: THE HUNDRED WORLDS
Version 1.0
Sandbox Software, 1995
==============================

This is shareware.

You may copy Maximus and give it to your friends, upload it to your favorite BBS, or put it on a shareware CD, as long as all ${files} files stay together and nobody charges money for it. (A hundred worlds take some room: ${mb} MB. Unzip it all to your hard disk.)

If you enjoy Maximus, please register it! Registration is ${price} and gets you:

* a printed manual with a fold-out galaxy chart
* the courier's sector map of all 88 worlds and their vaults
* the Maximus hint book (where every module is hidden)
* our thanks, and news of the next Sandbox Software game

Send ${price} (check or money order, US funds) to:

  Sandbox Software
  Attn: Maximus Registration
  P.O. Box 4217
  Pittsburgh, PA 15213

Please tell us where you got your copy.

------------------------------
GETTING STARTED

Type MAXIMUS and press Enter. A Sound Blaster or compatible is recommended for the music and digitized sound; the PC speaker works too.

Choose "Read Instructions" from the menu for the controls, or press F1 during play.

THE STORY

The Maximus Core, the forge-star at the heart of the galaxy, has gone dark. Its light was held in ten star-shards, and they are scattered across the Hundred Worlds. Max is a courier. Couriers deliver.

QUICK KEYS

  Arrows .. move/thrust/swim
  Up ...... jet hop (tap
            again to climb)
  Space ... fire
  P / D ... pick up / drop
  Q / E ... dash left/right
  Z X C V H W  module weapons
  F ....... hover
  T ....... hail
  F1 F2 ... help, status
  F5 F6 ... save, load

THE SHARDS

  ${SHARDS.map((s, i) => `${String(i + 1).padStart(2)}. ${s}`).join('\n  ')}

Each pair of shards opens the gates to the next sector. All ten open the Core.

THE MODULES

  ${MODULES.map((m) => `${m.name.padEnd(15)} ${m.key}`).join('\n  ')}

THE SECTORS

  ${SECTORS.map((s, i) => `${i + 1}. ${s.name.padEnd(15)} ${String(s.worlds.length).padStart(2)}`).join('\n  ')}
  (worlds in each sector)

Game-Maker is a trademark of Recreational Software Designs. Sound Blaster is a trademark of Creative Labs.

Thank you for supporting shareware!
`);
