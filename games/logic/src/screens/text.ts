// The words: storyline, instructions, credits, the endings and README.TXT. PLAYGAME shows
// .TXT pages 31 characters wide and 16 lines a page. Lines are wrapped to 30: a line of
// exactly 31 leaves its line break for the next read, which shows as an extra blank line.
import { withCreditPage } from '../../../kit/license';

/** Wraps paragraphs to `width` columns; lines starting with spaces keep their indent. */
export function wrap(text: string, width = 30): string {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    const indent = /^ */.exec(para)![0];
    let line = '';
    for (const word of para.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : `${indent}${word}`;
      if (next.length > width && line) {
        out.push(line);
        line = `${indent}${word}`;
      } else line = next;
    }
    out.push(line);
  }
  for (const l of out) if (l.length > width) throw new Error(`Line too long: "${l}"`);
  return out.join('\n');
}

/** Pages of 16 lines (PLAYGAME shows MORE... between them). */
export function pages(parts: string[]): string {
  const lines: string[] = [];
  for (const part of parts) {
    const p = wrap(part).split('\n');
    if (p.length > 16) throw new Error(`Page too long:\n${p.join('\n')}`);
    while (lines.length % 16) lines.push('');
    lines.push(...p);
  }
  return lines.join('\n') + '\n';
}

export const STORY = pages([
  `1995. The Bitmore family of Juniper Lane has the first Smart Home on the block: every appliance in the house is wired to every other one.

Then the thunderstorm hit.`,
  `Now the toaster opens the garage door. The fridge changes the TV channel. And the clock radio plays polka at 3 a.m.

Somebody has to fix the wiring. Somebody small.`,
  `WATT is a pocket-sized repair robot who lives in the fuse box. The lightning bounced him all the way into the toaster!

To get home to his charging socket, Watt must roll through the circuit board of every appliance in the house.`,
  `Live current fizzles a robot in a blink. But current is also the only thing that switches off the force-field gates.

Flip the switches, follow the copper, and THINK before you roll.

There's no place like Ohm!`,
]);

export const HELP = pages([
  `KEYS
 Arrows, W A S D or the
 number pad: roll one block
 R: reboot the board (costs
    one spare battery)
 F1 help  F2 batteries left
 F5 save  F6 load
 Esc  quit to the menu

Bump into a switch, button or fuse to work it.`,
  `CURRENT
 Batteries pump current
 along their copper wires.
 Glowing beads are LIVE:
 touch one and you fizzle.
 Current takes time to run
 down a wire, and drains
 out when cut off.

 Force-field GATES are
 deadly until current
 reaches them. Then they
 shut down for good.`,
  `PARTS
 SWITCH: bump to flip it.
  Off stops current.
 TIMER BUTTON: on for a few
  seconds, then off again.
 FUSE: bump to blow it. Its
  wire is dead for good.
 ARROWS (diodes): roll
  through one way only.
 "~" batteries pulse on and
  off; "!" batteries start
  when bumped, and never
  stop.`,
  `RELAYS
 Pink CONTROL current
 throws relays, and they
 stay thrown.
 NO (normally open): lets
  current through once
  thrown.
 NC (normally closed): cuts
  current once thrown.

Roll onto the outlet to go on to the next board. Gold screws and outlets give you a spare battery.`,
  `CHIPS AND GADGETS
 555 TIMER: pulses its wire,
  on twice as long as off.
  Its red OUT light goes
  dark when the current
  does. Roll in right
  behind the last spark!
 LCD SCREEN, and the
  CitiCar's headlights:
  current lights them up,
  then runs on through.`,
]);

const CREDITS_TEXT = pages([
  `OHM SWEET OHM
A logic puzzle in twenty-three circuit boards

Design, art, music and wiring: Claude

Published by Sandbox Software

Made with Game-Maker 3.0 from Recreational Software Designs`,
  `Thanks to the Bitmore family for leaving their toaster unplugged during testing.

No robots were harmed in the making of this game. A few were mildly fizzled.`,
]);

export const WON = pages([
  `Watt rolls out of the last circuit board and into his very own charging socket.

Bzzzt... ahhh.

Every appliance in the house hums the right tune again. The toaster toasts. The garage door stays put. The clock radio plays soft jazz, at a sensible hour.`,
  `Mrs. Bitmore finds a tiny robot asleep in the fuse box, smiling, his little antenna glowing green.

"Huh," she says, and closes the panel very gently.

THE END
There's no place like Ohm.`,
]);

export const LOST = pages([
  `Out of spare batteries!

Watt's lights flicker and go dim. He'll be fine after a good long charge... but the Bitmores will be eating cold toast for a while.

Try again! Think before you roll.`,
]);

export function readme(price: string): string {
  return wrap(`OHM SWEET OHM
Version 1.0 - Shareware
(c) 1995 Sandbox Software

A logic puzzle game for IBM PC compatibles with VGA. Sound Blaster recommended.

TO PLAY
Type OHMSWEET at the DOS prompt (it runs PLAYGAME with OHMSWEET.GAM).

WHAT IS IT?
Watt, a pocket-sized repair robot, must roll through twenty-three haywire circuit boards to get home to his charging socket. Flip switches, blow fuses, throw relays and route live current to shut down the force-field gates... without touching a live wire yourself.

THIS IS SHAREWARE
You may copy this disk and give it to your friends, upload it to bulletin boards and share it with user groups, as long as all the files stay together and unchanged.

If you enjoy OHM SWEET OHM, please register for ${price} with Sandbox Software. Registered players get the printed hint book with every answer, a big wiring poster of all twenty-three boards, and the next Sandbox Software game at a discount.

SEND ${price} (check or money order) TO:
 Sandbox Software
 P.O. Box 1995
 Pittsburgh, PA 15213
(Our mailbox is make-believe, and so is this address.)

FILES ON THIS DISK
 OHMSWEET.GAM the game
 *.MAP *.MON  all the boards
 *.BBL *.MBL  board and parts art
 WATT.CHR     Watt himself
 *.CMF *.VOC  music and sounds
 *.FLI *.GIF  cartoons, screens
 README.TXT   this file

Thanks for playing!
`);
}

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
