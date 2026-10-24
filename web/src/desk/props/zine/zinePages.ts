// The pages of NO CARRIER #3 (zine.ts), a photocopied hacker zine about the
// desk PC's power tools, every line checked against how the tools really work (retro/).
// Only this desk's PC, only this desk's phone: nothing here is about real systems.

/** A page: its ransom-note heading, then typed paragraphs, notes scrawled in the margin
 * (shown with a hand-drawn arrow) and, on the phone page, a scribbled list. */
export interface ZinePage {
  title: string;
  lines: string[];
  scrawl?: string[];
  list?: [string, string, string][];
}

export const ZINE_TITLE = 'NO CARRIER';

export const ZINE: ZinePage[] = [
  {
    title: 'NO CARRIER',
    lines: [
      'issue #3 ... spring 1995 ... FREE if you found the whistle',
      'Edited by DiAL ToNE, ex-SysOp of THE STATIC LINE BBS (300/1200/2400 baud, R.I.P., the line got disconnected).',
      'WARNING: for your OWN computer only!! Every trick in here works on the PC on this desk and nowhere else. Do not try this at school. Do not try this at the library. The library is where we photocopied it.',
      'Inside: secret DOS stuff, hex editing, save hacks, backups, the crack scene (lol), eggs, merit badges, a BBS code, and THE PHONE LIST.',
    ],
    scrawl: ['flip the page!!'],
  },
  {
    title: 'DOS SECRETS',
    lines: [
      'HELP lists most commands. It does NOT list ECHO, and it does not list one program that runs from ANY folder (see the egg page).',
      'C:\\DOS, C:\\GM and C:\\COMM are on the PATH, so BACKUP, HEXEDIT, ACHIEVE, OFFLINE, TERMINAL and VPIC run from anywhere. Stuff you download lands in C:\\DOWNLOAD\\<NAME>: CD there first.',
      'DIR /W for wide, DIR /P to pause, wildcards like DIR *.GAM. A: and D: switch drives (an empty drive says Abort, Retry, Fail?).',
      'TIME and DATE set the clock for the WHOLE ROOM, not just the PC. TIME 11:30p and the window goes dark, the moon comes out and the black light comes on. TIME 3:17a and check the wristwatch. TIME 12:01a for a party. DATE 12-25-94 for, you know.',
      'TIME RESET (or DATE RESET) puts it back on the real time. Hover the wristwatch to see if you changed it.',
    ],
    scrawl: ['TIME /? and DATE /? explain it'],
  },
  {
    title: 'HEXEDIT',
    lines: [
      'C:\\DOS\\HEXEDIT.EXE. Type HEXEDIT \\GM\\SAMPLE\\SAMPLE.GAM, or just HEXEDIT to pick a file from the folder.',
      'Every byte in hex and as text. F2 shows what each byte MEANS (it knows the Game-Maker file formats). F3 or J jumps to a scene, block or frame. G goes to an offset, F finds, N finds the next one.',
      'E or Enter starts editing: type over the hex (Tab for the text side). U undoes. Esc stops editing. F10 saves and keeps the old file as .BAK.',
      "SAVE FILES: in a game's folder you also get GAME0-9.SAV, SAVNAMES.DAT and the .HIS high scores. Those you CAN change, even in shareware. It backs them up first (BACKUP /L shows it).",
      "It can't write the CD, a write-protected floppy or a shareware game's own files.",
    ],
    scrawl: ['red bytes = changed'],
  },
  {
    title: 'SAVEHACK',
    lines: [
      'Get it from the Sandbox BBS Warez area (see the BBS page). It unzips to C:\\DOWNLOAD\\SAVEHACK. CD there and type SAVEHACK.',
      'Pick a game, pick a save slot. Arrows pick a stat (score, lives, hit points, money, counters, stuff you carry), Enter types a new value.',
      "M maxes everything out (as high as the game can take). U makes a counter unlimited. Del empties an inventory slot. Enter on the level moves you to another level's start. N makes a brand-new save in an empty slot.",
      'F2 or S saves. It warns you before anything overflows. It backs up your original saves first, and R puts them back.',
      "Then load your hacked game with F6. You're welcome.",
    ],
    scrawl: ['high scores too!!'],
  },
  {
    title: 'BACKUP',
    lines: [
      "C:\\DOS\\BACKUP.EXE keeps copies of your saved games and high scores. BACKUP alone opens the menus: Space marks a game, A marks all, B backs up, Enter shows a game's backups (Enter restores, Del deletes).",
      'Command line: BACKUP * backs up every game with saves. BACKUP TEDDY backs up one. BACKUP /L lists them, newest first. BACKUP /R TEDDY 2 restores backup 2. BACKUP /D TEDDY 2 deletes it (no questions asked!).',
      'A restore backs up what it replaces first, so you can always undo.',
      'HEXEDIT and SAVEHACK save their own backups here too.',
    ],
    scrawl: ['BACKUP /? for the rest'],
  },
  {
    title: 'DISK TRICKS',
    lines: [
      'Out of 1.44 MB disks? Look at a 720K double density disk: ONE square hole, the write-protect one with the little slide. A high density disk has a second hole in the other corner. That hole is how the drive tells them apart.',
      "Punch a hole in that same corner of a 720K disk (a paper hole puncher does it, if you line it up straight) and the drive thinks it's high density. FORMAT A: and you get 1.44 MB on a cheap disk.",
      "It works most of the time. A DD disk's coating isn't made for it, so weeks later it can start losing files. Don't put anything on one you can't lose.",
      'Slide the write-protect tab open (you can see through the hole) and nothing can write to that disk. Do it to your game disks.',
    ],
    scrawl: ['save it twice!!'],
  },
  {
    title: 'THE CRACK SCENE',
    lines: [
      'GMCRACK by DiGiTAL DUNE, from the Warez area, unzips to C:\\DOWNLOAD\\GMCRACK. It shows your serial and whether Game-Maker is registered.',
      '[3] KEYGEN: type a name, watch the hex fly, get a key, and it offers to register with it. GMCRACK /K <name> just prints the key.',
      '[1] registers, [2] un-registers (Game-Maker goes back to asking for a word from the manual).',
      '[4] "cracks" a downloaded shareware game: you get a DiGiTAL DUNE intro first. It\'s still shareware, LOL. [5] uncracks it. [7] is the list of manual-check answers.',
      'GM30, the Warez area\'s "rip" of Game-Maker 3.00: its INSTALL just tells you you already own it, d00d.',
      'Real talk: GM REGISTER and the card from the box do it the honest way.',
    ],
    scrawl: ['register your software, kids'],
  },
  {
    title: 'EGGS & HEARTS',
    lines: [
      "Some games here hide a little felt egg, and some a tin heart. Go find them. We're not telling where.",
      "Type EGG at any prompt. It is in no folder and HELP never mentions it. It's the Egg Inspector: one line per egg and whether your saves have it.",
      'Enter adds or breaks an egg by hand, R resets to what your saves really show, T opens the tin heart ledger. Nothing here touches a saved game.',
      'Find the whole set and... well. Find the whole set.',
    ],
    scrawl: ['look on the shelf too'],
  },
  {
    title: 'BADGES & TAKE-OUT',
    lines: [
      'ACHIEVE (C:\\DOS) is your merit badge log: tabs for Making, Playing, Watching, Desk, Site and Found it. Hidden ones show as ??? with a hint. Running it is worth a badge.',
      'OFFLINE (C:\\DOS) copies the whole thing so it works with no connection: games, the desk, Game-Maker, the manuals. It shows how big it is and asks first. Esc stops (what came in stays). R removes it again.',
      'The room has secrets too. The waste basket, the door, the moon, the curtains, the speaker, the DEGAUSS button, the black light... click EVERYTHING.',
    ],
    scrawl: ['some only happen at night ->'],
  },
  {
    title: 'BBS TRICKS',
    lines: [
      "TERMINAL (C:\\COMM) dials the two boards in PHONE.LST: THE -= S A N D B O X =- BBS and THE SOFA. Hang up the wall phone first, or it's NO DIALTONE.",
      "SANDBOX: log in as anybody (or GUEST). File Areas, D# downloads, games unzip into C:\\DOWNLOAD. The SysOp's own games and the GIFs are free. Never try to upload: somebody always picks up the kitchen phone.",
      "THE WAREZ AREA: press W at the main menu. It isn't on the menu (the menu even says there's no warez area, sure). The access code is in Bulletin 7. Hint: it's sandy.",
      "THE SOFA: type new. T is the teleconference with the regulars (X leaves), W is who's on. It's busy a lot. Keep trying.",
    ],
    scrawl: ['C)hat the SysOp = never answers'],
  },
  {
    title: 'THE PHONE LIST',
    lines: ['Scrawled off the wall by the phone and a few we found. Dial on the wall phone (or the PC keyboard while the handset is up).'],
    list: [
      ['Mom at work', '555-0148', 'the insurance office, hold music, then "do your homework"'],
      ['Dad at work', '555-0187', "Gus at the shop: Dad's out on a job, try his pager"],
      ["Dad's pager", '555-0199', 'punch in a number and #... and Dad calls back. Not happy.'],
      ['Grandma', '555-0123', "let it ring. And ring. She's SO happy you called"],
      ['Mrs. Novak (next door)', '555-0156', 'her TTY: just warbling tones on the phone. Type to her from TERMINAL (M for TDD mode), end with GA'],
      ['Jenny (sitter)', '867-5309', "busy. Always busy. She's on the other line"],
      ['Time & temp', '555-0111', "the time, by the room's clock"],
      ['Weather', '555-0112', "snow. It's always snow"],
      ['Movie line', '555-0113', "what's playing this week"],
      ['Sandbox BBS', '1-412-555-SAND', 'SCREEEECH (a modem: use TERMINAL)'],
      ['The Sofa BBS', '555-0177', 'SCREEEECH (TERMINAL again)'],
      ['Sandcastle BBS', '555-0142', 'more modem screeching'],
      ['Rating Council', '1-800-555-0142', 'from the back of the game boxes. On hold. Forever.'],
      ['Emergency', '911', 'REAL EMERGENCIES ONLY. On this phone... look out the window.'],
      ['anybody else', '???', "not in service, no answer, busy, or somebody's machine"],
    ],
    scrawl: ["NEVER call 911 for real unless it's REAL"],
  },
];
