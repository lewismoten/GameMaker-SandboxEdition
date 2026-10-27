// The text pages (shown 31 characters wide by Game-Maker) and README.TXT.
import { withCreditPage } from '../../../kit/license';
import about from '../../about.json';

function check(name: string, s: string, width = 30): string {
  for (const line of s.split('\n')) if (line.length > width) throw new Error(`${name}: line too long (${line.length}): ${line}`);
  return s;
}

export const INSTRUCTIONS = check(
  'howto',
  `ARROW KEYS or W A S D walk Dex
around. Q and E (or 7 and 9 on
the number pad) walk up-left
and up-right; 1 and 3 walk
down-left and down-right.
SPACE fires the Laser-Tag
Zapper (once you find it).

PAGES: Sparky chewed up your
science report and spat the
pages all over the future.
The judges need 20 of them.

QUARTERS: every phone booth is
a Teleport-A-Phone now. Walk
into the door to dial: it
costs 25 cents (one quarter).
Arcade games take them too!

DINNER PILLS fill you up: a
turkey dinner in one capsule!

BATTERIES charge your Zapper.
HOVER-COLA is an extra life.
FRIENDLY ALIENS give hugs, and
hugs are good for you.

KEYS: Grandpa's key ring, the
STAFF ONLY keycard and the
Moon Pass open their doors.

LASER FENCES blink on and off.
Walk through when they're off!

GLASS TUBES and MOONWALK BELTS
carry you along - fast.

GRANDPA'S CITICAR opens with
his keys, and flies itself.
LEFT and RIGHT (or A and D)
steer it from lane to lane.
Dodge cars and trucks, catch
pages and pills. At 0 MI the
exit ramp opens on the right:
keep RIGHT!

ROBOTS can be zapped. CARS,
buggies, dinos and skaters
hurt once, then swerve or
back off. METEORS just hurt!

On the Moon, your moon suit
makes you hop and glide. Let
go early to stop on a dime.

F1 Help   F2 Status (quarters)
F3 Music  F4 Sound
F5 Save   F6 Load   ESC Quit`,
);

const CREDITS_TEXT = check(
  'credits',
  `IN THE YEAR 2000!
Version ${about.version} - 1993

Game design, pictures, music
and robot dog: Claude
for SANDBOX SOFTWARE

Made with GAME-MAKER 3.0 by
Recreational Software Designs.

Special thanks to everyone who
told us what the future will
be like: the Sunday comics,
the World's Fair, Saturday
morning cartoons, and our
5th grade science teacher.

This is SHAREWARE. If you have
fun, please register! Send $12
to Sandbox Software (address
in README.TXT) and we'll mail
you the next game on a real
3 1/2" floppy disk.

See you in the future!`,
);

/** The postcard in the launch pad's closet (16 lines: one page). */
export const POSTCARD = check(
  'postcard',
  `THE TOMORROW EGG

Teal felt, silver waves,
a red rocket with a yarn
flame, chrome sequins.

Sent from the future by
Lewis "Lewie" Moten III
and Claude Opus 5.5

A postcard from the future:
"The grandkids still argue
over the family root beer.
The recipe calls for thirteen
of something. Thirteen eggs,
it turns out, are not it."`,
);
if (POSTCARD.split('\n').length > 16) throw new Error('postcard: more than one page');

/**
 * Wraps a plain-text file to Game-Maker's text width (30 columns: a line of exactly 31
 * leaves a blank line in PLAYGAME). Lines that fit are kept; longer ones wrap with a
 * hanging indent under their bullet or number ("* ", "1. ").
 */
function wrapDoc(text: string, width = 30): string {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line.length <= width) {
      out.push(line);
      continue;
    }
    const lead = /^(\s*(?:[*-] |\d+\. )?)/.exec(line)![1];
    const hang = ' '.repeat(lead.length);
    let cur = lead;
    for (const w of line.slice(lead.length).split(/\s+/).filter(Boolean)) {
      if ((cur + ' ' + w).length > width && cur.length > hang.length) {
        out.push(cur);
        cur = hang + w;
      } else cur += (cur.length > lead.length || cur !== lead ? ' ' : '') + w;
    }
    out.push(cur);
  }
  for (const l of out) if (l.length > width) throw new Error(`readme: a word won't fit in ${width} columns: ${l}`);
  return out.join('\n').replace(/\n*$/, '\n');
}

export function readme(price: string): string {
  return wrapDoc(`IN THE YEAR 2000!
A Future Adventure
Sandbox Software, (C) 1993
Version ${about.version}
==============================

It's the year 2000! Cars fly. Robots mow the lawn. Dinner comes in a pill. The aliens next door are VERY friendly. And there's a phone booth on every single corner, because every phone booth is a Teleport-A-Phone now - only 25 cents a call.

Dex Dynamo, age 11, wrote the greatest science fair report in the solar system: "THE POCKET TELEPHONE." Then Sparky 3000, his robot dog, ate it. The Science Fair is today, at 3:00. On the Moon.

Help Dex find his pages in seven levels of the future:

1. DOME SWEET DOME: the suburbs of Hover Heights
2. THE CLOUD LANE: Grandpa's flying CitiCar, nine miles to the Skyway
3. THE INFORMATION SUPERHIGHWAY: fourteen lanes of hover traffic
4. MEGA MALL 2000: the arcade, TV-RAMA, and the food court
5. THE TELEPORT-A-PHONE EXCHANGE: wrong number! (several of them)
6. THE MOON: moon buggies and meteor showers
7. THE SCIENCE FAIR: catch Sparky before the judges go

REQUIREMENTS
------------
* 286 or better, VGA graphics, 640K of memory, a hard disk.
* Sound Blaster (or compatible) for music and digitized sound; the PC speaker works too.

To play, copy all the files to one directory and type YEAR2000.

CONTROLS
--------
* Arrow keys: walk (joystick works too); in Grandpa's CitiCar, Left and Right steer
* W A S D: walk, same as the arrows
* Q / E: walk up-left / up-right
* Keypad 7 9 1 3: walk diagonally
* Space: fire the Laser-Tag Zapper
* F1 help, F2 status (quarters!)
* F3 music, F4 sound on/off
* F5 save, F6 load, Esc quit

HINTS
-----
* Phone booths cost a quarter. Keep one in your pocket!
* Wait for the laser fences to blink off.
* Zapping a car only makes it swerve. Save your charge for robots.
* In the Teleport-A-Phone Exchange, booth number 4 is out of order. Try another number - you'll get there eventually.
* Read the teletype in the exchange hall. It knows a thing or two.
* Grandpa lost his key ring in the hedge garden. His CitiCar won't open without it.
* Grandpa's CitiCar likes a honk.
* In the Cloud Lane, traffic starts as a dot on the horizon. Pick a clear lane early, and keep right when the sign nears 0 MI.
* The judges want 20 pages. There are lots more than that.
* Came to the fair short? The school copier prints more.

THIS IS SHAREWARE
-----------------
You may copy it and give it to your friends, upload it to your favorite BBS, and play it as long as you like. If you enjoy it, please register for ${price} with Sandbox Software. Registered players get the next Sandbox Software game on disk, a printed manual, and our heartfelt thanks (and Sparky's).

  Sandbox Software
  Attn: Registrations
  P.O. Box 000
  Pittsburgh, PA 15213

(This address is made up! Sandbox Software is part of a 1990s-style recreation. Please don't mail anything; registration is free and everything is already in the box.)

Please make checks payable to Sandbox Software. Allow 4 to 6 weeks for delivery, or about 30 seconds by Teleport-A-Phone (if they ever get that working).

Made with GAME-MAKER 3.0 by Recreational Software Designs.
`);
}

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
