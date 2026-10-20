// The text pages (shown 31 characters wide by Game-Maker) and README.TXT.

function check(name: string, s: string, width = 31): string {
  for (const line of s.split('\n')) if (line.length > width) throw new Error(`${name}: line too long (${line.length}): ${line}`);
  return s;
}

export const INSTRUCTIONS = check(
  'howto',
  `ARROW KEYS walk Dex around.
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

FOOD PILLS heal you. A whole
turkey dinner in one capsule!

BATTERIES charge your Zapper.
HOVER-COLA is an extra life.
FRIENDLY ALIENS give hugs, and
hugs are good for you.

KEYS: the garage remote, the
STAFF ONLY keycard and the
Moon Pass open their doors.

LASER FENCES blink on and off.
Walk through while they're off!

GLASS TUBES and MOONWALK BELTS
carry you along - fast.

ROBOTS can be zapped. Cars,
buggies, dinosaurs and
meteors can NOT. Get out of
the way!

On the Moon, your moon suit
makes you hop and glide. Let
go early to stop on a dime.

F1 Help   F2 Status (quarters!)
F3 Music  F4 Sound
F5 Save   F6 Load   ESC Quit`,
);

export const CREDITS = check(
  'credits',
  `IN THE YEAR 2000!
Version 1.0 - 1992

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

export function readme(price: string): string {
  return `IN THE YEAR 2000!                                   Version 1.0
A Future Adventure from Sandbox Software            (C) 1992
=================================================================

It's the year 2000! Cars fly. Robots mow the lawn. Dinner comes in
a pill. The aliens next door are VERY friendly. And there's a phone
booth on every single corner, because every phone booth is a
Teleport-A-Phone now - only 25 cents a call.

Dex Dynamo, age 11, wrote the greatest science fair report in the
solar system: "THE POCKET TELEPHONE." Then Sparky 3000, his robot
dog, ate it. The Science Fair is today, at 3:00. On the Moon.

Help Dex find his pages in six levels of the future:

   1. DOME SWEET DOME ............ the suburbs of Hover Heights
   2. THE INFORMATION SUPERHIGHWAY  fourteen lanes of hover traffic
   3. MEGA MALL 2000 ............. the arcade, TV-RAMA, and PILLS
   4. THE TELEPORT-A-PHONE EXCHANGE  wrong number! (several of them)
   5. THE MOON ................... moon buggies and meteor showers
   6. THE SCIENCE FAIR ........... catch Sparky before the judges go

REQUIREMENTS
------------
  286 or better, VGA graphics, 640K of memory, a hard disk.
  Sound Blaster (or compatible) for music and digitized sound;
  the PC speaker works too.

  To play, copy all the files to one directory and type YEAR2000.

CONTROLS
--------
  Arrow keys .... walk (joystick works too)
  Space ......... fire the Laser-Tag Zapper
  F1 ............ help          F2 .......... status (quarters!)
  F3 ............ music on/off  F4 .......... sound on/off
  F5 ............ save game     F6 .......... load game
  Esc ........... quit

HINTS
-----
  * Phone booths cost a quarter. Keep one in your pocket!
  * Wait for the laser fences to blink off.
  * You can't zap a car. Don't try. Seriously.
  * In the Teleport-A-Phone Exchange, booth number 4 is out of
    order. Try another number - you'll get there eventually.
  * The judges want 20 pages. There are lots more than that.

THIS IS SHAREWARE
-----------------
This is shareware. You may copy it and give it to your friends,
upload it to your favorite BBS, and play it as long as you like.
If you enjoy it, please register for ${price} with Sandbox Software.
Registered players get the next Sandbox Software game on disk, a
printed manual, and our heartfelt thanks (and Sparky's).

   Sandbox Software
   Attn: Registrations
   1234 Tomorrow Lane, Suite 2000
   Pittsburgh, PA 15213

Please make checks payable to Sandbox Software. Allow 4 to 6 weeks
for delivery, or about 30 seconds by Teleport-A-Phone (if they ever
get that working).

Made with GAME-MAKER 3.0 by Recreational Software Designs.
`;
}
