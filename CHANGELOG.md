# Changelog

Changes to the Game-Maker: Sandbox Edition site, released as `pages-v*` tags. Each package has its own
changelog: [engine](web/packages/engine/CHANGELOG.md), [archives](web/packages/archives/CHANGELOG.md) and
[tools](web/packages/tools/CHANGELOG.md). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

The 1994 desk gets a fuller PC and a box of feelies, the editors become easier on touch screens and keyboards,
the Phone of the Future kit grows, and Tune-Up's rubber chicken has a story to finish.

### Added

- Every game's download ZIP and DOS folder now has a short name of up to 8 letters (KEYSDOOR.ZIP, RECKON.ZIP), so DOS shows it whole instead of as `KEYS-A~1`. The web addresses still use the game's name, and the old ZIP links keep working.
- A saved game with damaged parts (a cut-short or wrong-type file, a bad notes file, a file its game names that is gone) still opens: every good file loads, a note lists what is broken in plain words with Replace and Drop buttons, and the damaged save is kept whole as a "damaged copy" so nothing is overwritten. A browser that won't open its game storage says so instead of showing a blank page.
- When something breaks, a small notice offers Copy error details (the message, the build, the page, the browser's name and the screen size) and Dismiss. It copies only when you press it and sends nothing.
- The Starters tab groups its games the way the Bizarre tab groups its songs, each group with a heading and a line about it (The Basics today), and the "How do I…?" list says which group a question's game is in.
- Throw It, a Starter for the Game Feel group: press Enter and Kit throws a gold star the way he last walked. It pops a mint green gumdrop, falls short if you stand too far away, and clears a grump out of a narrow brick tunnel. Two levels, with signs and a "How this level is made" page each.
- The disk box on the desk holds a Game-Maker Sample Disk with the first three small games, each in its own folder (A:\FIRSTSTP, KEYSDOOR, MONSTERS), as many as fit a 1.44 MB diskette. Game-Maker loads them to play or design, and the Owner's Guide names the folders.
- The CD-ROM on the desk (D:) now has a SAMPLES folder with every Starter in its own 8.3 folder (D:\SAMPLES\FIRSTSTP, KEYSDOOR, MONSTERS, ROOMS, COINS, HAZARDS, POWERUP, THROWIT), and a longer README.TXT. Game-Maker plays them from the CD, or copies one to C:\GM to change it.
- The 1994 Owner's Guide on the desk lists six of the small sample games on the Sample CD, three of them also on the Sample Disk (First Steps, Keys and Doors, Meet the Monsters, Room to Room, Coins and Score, Watch Your Step), one idea each, and says how to open one in the designers.
- Kit, the hero of the Starter games, joins the Cast page with a new Starters section. Kit also moves more in the four Starters: arms up on the way into a jump and out as he comes down, a glance around while he stands, and a shovel dig, a star toss and a cheer in the character file for a game to play.
- A "How do I…?" list on the Starters tab and in the Guide: search a question ("How do I make a door that needs a key?"), then choose Play this level, which starts the game at that level, or See how it's made, which opens its map in the read-only editor at the right spot with a button for the manual's "How this level is made" page. The Guide's new "How do I…?" section and its Try it boxes use the same buttons. A new Starter adds its questions with a `howDoI` list in its manual.json.
- "About this game" (Overview, Tools): title, author, company, year, a short description, story, genre, website, license and credits, kept with the project but never in the game's files. The DOS download gets a FILE_ID.DIZ made from them (10 lines of 45 characters, shown live as you type), and importing a zip with a FILE_ID.DIZ fills them in. The one-page web download adds a visible, folded "Inside this game" section with the game's pictures (each stored once, as an image the page reads back), its text screens as real text, a preview of each animation and sound, and the credits, plus structured data for search engines. The Download dialog has "Include animation and sound previews" (on by default, remembered per game) and says how much page size they add. A starter's title is shown from its animation's first frame.
- The map editor remembers each map's zoom and scroll spot, in every game (read-only ones too): go to another map and back, or reload, and it is as you left it. A map you have not looked at before opens at the zoom of the last map you looked at, centered on where the character enters. Kept only in this browser (up to 200 maps), never in game files or backups.
- Importing a game shows a panel the moment you pick or drop the file: its name, a progress bar with the step (reading, unpacking, finding the game, extracting, opening), the file being extracted (n of m), a Cancel button, and a message if it fails. A second pick waits until the first import ends. The exported one-page game, opened where scripts don't run (such as a Files preview on iPhone), now shows a dark page with the game's title screen and a note on how to open it in a browser to play.
- A "Uses" line beside "Used by": a scene lists the files it is made of and a map its block sets and monsters, each a link that keeps Back and the breadcrumb working. A link to the open game with another scene now selects that scene (and Back and Forward step through them), and a page you go Back to waits up to 3 seconds for its content before giving up on its scroll spot.
- A breadcrumb above every open file (Overview › Maps › bus2.map) and a Back to the file you came from. "Used by" links now open the scene they name, and Back to an Overview page lands where you left it.
- A Starters tab on the home page, just before Sandbox: small games that each show one idea, with signs in the levels that say what you are looking at. The first three are First Steps (walking, jumping, gravity and ladders), Keys and Doors (three levels: a door that is shut before you find its key, a door that needs two of the same key, and different keys for different doors) and Meet the Monsters (a monster that walks a path, one that hurts a little, and one you land on to pop). Each can be copied and edited, and they do not count as Sandbox games.
- Room to Room, a fourth Starter about getting from one room to another: a door into a second room and a brick archway out of it, a house whose doors go there and back (the key you carry comes with you; the room itself starts over), and a fork with two doors to two rooms.
- Coins and Score, a fifth Starter about points: coins add to the score, gems are worth more and a rock takes points away, and a heart adds a life (Game-Maker has no extra life at a score, and the last level says so). F2 shows the score and lives.
- Watch Your Step, a Starter about things that hurt: a spike that stings once and then lies flat, a pool that costs a life and starts the room again where you came in, and a level whose planks and bridge are the safe way past both.
- Power Up, a Starter about powers: a star that gives four high jumps, for an exit on a ledge too high to jump to, and a pair of sneakers that double the walk and the length of a jump, for a canyon too wide to cross. A power counts uses, not seconds: Game-Maker has no clock that switches one off.
- A sting of their own for the four Starters: grass and dirt blocks drop in and stack into the word STARTER, Kit hops up onto the last letter and cheers, and a sign reads "A STARTER GAME". It plays before each Starter's title in place of the Sandbox Software sting.
- A Privacy page (Settings, then Privacy): what the site keeps on this device, how to clear it, and what is sent and when. There is no tracking.
- The box viewer's Feelies strip: every trinket, laser kit, code wheel and printed piece in the box, with its downloads, a 3D coin and a compact phone panel.
- Paper code wheels and code sheets as a printable kind, on screen (with Tell me the answer) or printed to cut out. A game's wheel lies beside the desk monitor on its puzzles' scenes.
- Laser wooden nickels, collectible 1994 tokens with each game's own money, and the Stage Box puzzle kit for Final Curtain.
- 3D-print trinkets for several games, among them Final Curtain, Virus Blaster, Sandcastle Knight, Third Goat from the Left and In The Year 2000!, with a faceted-gem, lettering and pixel-figure toolkit behind them.
- Phone of the Future: the Junior Lab case, a dial module, the Rev C circuit board (99 x 99 mm), firmware, a parts viewer and downloadable printer and board ZIPs. Dex Dynamo's science report, THE POCKET TELEPHONE, comes with it.
- The Hint Giant's hint line: an automated phone tree with menu pages and three hints per game, billed by the minute.
- Desk PC: a RESET button, a TURBO button, drive sounds, a CRT that warms up from black, fans and a BIOS line along the POST screen, and a case front with a key lock and a vertical floppy bay.
- Tune-Up: Lady Regina's tiara once her egg is laid, with a REGGIE.EXE on the BBS to say who the chicken is.
- A Make it smaller dialog in the animation editor, with a size report and a side-by-side preview of the re-encoded picture.
- Map editor pinch, pan and long-press menu on touch screens.
- A + New monster button in the monster editor (a copy of the picked monster in the first unused slot) and a Play here button in the map editor (a play test from the middle of the view, without moving the game's start).
- Redo in the recording editor, and Ctrl/Cmd+Z, Shift+Z and Y anywhere on the music, animation and sample editors.
- A Downloads page card for every game, with its real level picture.
- Update notice: it waits while a game plays and fades after about 15 seconds, and Settings keeps a New version ready item.
- Level check: the hidden-exit finding suggests a door, sign or arrow where a link leaves plain background.
- `npm run editor:touch`, `smoke:engines` and `editor:shots` for checking the editors on phones and across browsers.
- The Starters' opening sting is easier to read: STARTER is built from letters five blocks wide and seven tall with a gap between them, and the words STARTER GAMES are lettered in plain type across the top from the first frame.

### Changed

- On the Starters tab the "How do I…?" list shows its first three questions with a "Show all" button, and a "Skip to the games" button (visible when the keyboard is on it) jumps past it to the game tiles: 14 Tab stops to the games instead of 62.
- The Starters tab and its "How do I…?" list show the games in learning order, First Steps first, not A to Z.

- Pictures redrawn after a "what would a child point out?" pass: the sword on I Screamed, She Smirked's title is a fat orange foam sword; the Cleanse Me, O Loofah sponge is a golden, fuzzy, goofy-faced bath monster with no horns; Veni, Vidi, Risi's Rufus is plainly a dog; Tippy in KEEP IT BRIEF!'s The Scissor Situation card sits up crying; and Final Curtain's umbrella man tips his hat.
- Map editor on iPhone: two fingers over the map pinch the map, not Safari's page, and never leave a stray stroke; a Zoom tool (tap to zoom in) and visible + and − buttons beside the zoom menu; the block highlighter is now "Find block".

- Editors: 44 px touch targets throughout, one Tab stop with arrow keys for the file list, slide tray and path tabs, and a small Saved pill where the file list folds away.
- PC games ask for setup on PLAYGAME's own Configure screen, as the DOS program does.
- Box viewer on a phone: the Feelies strip sits above the disks and manual, and dragging always turns the model.
- Header: Games moves into the menu on 390 px phones.
- Music: a Games row in the sound settings scales everything a game makes; Voice also covers phone callers.
- The Optimize dialog works on look-only games by making a copy in My Games, and its picture color tables shrink to the smallest power of two that holds the colors drawn.
- Games with identical palettes share one file, and the cartoons' FLI clips are smaller; Depth's full-screen stills render faster.
- Opening a game and the shelf are faster: zips are peeked for the files asked for, four zips build at a time, and the home page lets go of what it watches.
- Games revised: Final Curtain 1.5, Teddy's Little Biggest Adventure 1.6, Quest for the Round Tuit 1.5, Tune-Up's Beltway and Timing Beat, with visible doorways at the ends of several levels.
- The Starters have no invisible walls: each room ends in a hedge you can see, and a check fails if a solid block is ever drawn as sky. Room to Room's second room now leaves by an open archway with a THIS WAY OUT sign instead of an invisible edge.

### Fixed

- The Loofah game's title and cover now show the friendly golden bath monster from its levels, with googly eyes and a wide smile, instead of the little horns (version 1.5).
- Choosing the Starters tab twice in a quick keyboard burst no longer shows a second "How do I…?" list.
- The Clown Club is spelled with C's everywhere: the first Teddy game's level files were named with K's (now club.map, club.pal and the rest), and so were the picture sources of its two sequels. Teddy is now 1.3.
- Gwinn's patio in the sand castle game warns of slobbery tennis balls (1.4), the Bard credits picture in the camel game ends "squeezes through." (1.4), one soil block in a Maximus world is a different variant (1.6), and Doc Leo's black-light poster has a flatter, gentler frown.
- The editor's file list no longer jumps when you click a file: scrolled far down (the Slide shows group, say), each click used to slide the list by a few lines, so you had to scroll again after every click. It now stays where you left it.
- Music editor: a song's tracks and instruments take their preset's family color (a Classic piano is red-orange, bass green) instead of every Classic sound showing the same cyan, and two tracks of one family get different shades.
- The home page's games list works by keyboard: it is one Tab stop, the arrows, Home and End move between games, and Enter or a click on a game features it and moves focus to its Play button, so a second Enter plays. Each game says its collection and place ("3 of 18"), picking one is announced, and the focus ring on games and on Play no longer looks like the blue button style.
- Small phones (375 px iPhones, 360 px Android): the header's ⋯ menu is no longer cut off, the "Building…" notice closes when the file is saved (one notice at a time on a phone, at the bottom edge), a second tap on Download while it builds does nothing instead of saving the file twice, and Game assets has room for the cards: search waits behind a 🔍 button, the card count lines go, card names are short, and a game opened to look inside has a one-row read-only bar.
- Depth Perception 1.4: THE CHEZ shows its back window, lamps and plate as it drives off in the ending, and turned figures keep their paint (Doc Leo's green tie on his purple shirt).
- The tour's corner guides stay off on every page after their × is pressed.
- Closing a game box with Escape soon after it opens no longer waits for the sticker sheet, level maps and world map to finish drawing: they are drawn in smaller slices, and only while no keys are being pressed.
- The Caught looking pause on the desk triggers only when you press Doc Leo's velvet poster while he glances aside.
- Dragging a code wheel's small disc no longer selects the lettering under the pointer.
- The top bar, desk and Library no longer leave listeners and music behind when the page changes.
- Tune-Up's Clown Club parade follows THE CHEZ in level 16, and its clock tower stands on its building.
- The music editor no longer freezes on a big song.
- A numbered list in the Owner's Guide that a table splits keeps its number.

### Removed

- The desk PC's empty expansion bays, and the Corn Maze postcard's unused address lines.

## [3.1.0] - 2026-11-02

The first tagged release of the site: the 1994 desk with its PC, BBSes, magazine and Library; today's web editor
for every Game-Maker file type; the web player; and the set of new games built in code.

### Added

- The web port of the PLAYGAME engine, playing original Game-Maker games and the new ones, with OPL2 and CMF music, voices and saves.
- The in-browser editor for maps, blocks, characters, monsters, palettes, pictures, animations, sounds, music, recordings, text screens, slide shows and the game integrator, with undo, a Level check and a walkthrough bot.
- The 1994 desk: a PC running DOS and Game-Maker, two BBSes, the magazine TURBO BUTTON, The Ultimate Owner's Guide, the Library, the cast page and felt eggs to find.
- More than twenty new games built in code, each with its manual, printables, box art, walkthrough and tour.
- Exports to a web page, a DOS ZIP and native players, and opening a game another site links to.
- Achievements, a guided tour with voice clips, and offline use as an installable app.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/pages-v3.1.0...HEAD
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/pages-v3.1.0
