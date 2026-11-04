# Changelog

Changes to the Game-Maker: Sandbox Edition site, released as `pages-v*` tags. Each package has its own
changelog: [engine](web/packages/engine/CHANGELOG.md), [archives](web/packages/archives/CHANGELOG.md) and
[tools](web/packages/tools/CHANGELOG.md). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

The 1994 desk gets a fuller PC and a box of feelies, the editors become easier on touch screens and keyboards,
the Phone of the Future kit grows, and Tune-Up's rubber chicken has a story to finish.

### Added

- A "Uses" line beside "Used by": a scene lists the files it is made of and a map its block sets and monsters, each a link that keeps Back and the breadcrumb working. A link to the open game with another scene now selects that scene (and Back and Forward step through them), and a page you go Back to waits up to 3 seconds for its content before giving up on its scroll spot.
- A breadcrumb above every open file (Overview › Maps › bus2.map) and a Back to the file you came from. "Used by" links now open the scene they name, and Back to an Overview page lands where you left it.
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
- Redo in the recording editor, and Ctrl/Cmd+Z, Shift+Z and Y anywhere on the music, animation and sample editors.
- A Downloads page card for every game, with its real level picture.
- Update notice: it waits while a game plays and fades after about 15 seconds, and Settings keeps a New version ready item.
- Level check: the hidden-exit finding suggests a door, sign or arrow where a link leaves plain background.
- `npm run editor:touch`, `smoke:engines` and `editor:shots` for checking the editors on phones and across browsers.

### Changed

- Editors: 44 px touch targets throughout, one Tab stop with arrow keys for the file list, slide tray and path tabs, and a small Saved pill where the file list folds away.
- PC games ask for setup on PLAYGAME's own Configure screen, as the DOS program does.
- Box viewer on a phone: the Feelies strip sits above the disks and manual, and dragging always turns the model.
- Header: Games moves into the menu on 390 px phones.
- Music: a Games row in the sound settings scales everything a game makes; Voice also covers phone callers.
- The Optimize dialog works on look-only games by making a copy in My Games, and its picture color tables shrink to the smallest power of two that holds the colors drawn.
- Games with identical palettes share one file, and the cartoons' FLI clips are smaller; Depth's full-screen stills render faster.
- Opening a game and the shelf are faster: zips are peeked for the files asked for, four zips build at a time, and the home page lets go of what it watches.
- Games revised: Final Curtain 1.5, Teddy's Little Biggest Adventure 1.6, Quest for the Round Tuit 1.5, Tune-Up's Beltway and Timing Beat, with visible doorways at the ends of several levels.

### Fixed

- Depth Perception 1.4: THE CHEZ shows its back window, lamps and plate as it drives off in the ending, and turned figures keep their paint (Doc Leo's green tie on his purple shirt).
- The tour's corner guides stay off on every page after their × is pressed.
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
