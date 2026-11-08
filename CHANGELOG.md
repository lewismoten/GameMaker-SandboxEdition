# Changelog

Changes to the Game-Maker: Sandbox Edition site, released as `pages-v*` tags. Each package has its own
changelog: [engine](web/packages/engine/CHANGELOG.md), [archives](web/packages/archives/CHANGELOG.md) and
[tools](web/packages/tools/CHANGELOG.md). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.2.1] - 2026-11-08

Four games grow or get a new look: The Mountain Moved Next Door (3.0), Pass the Pie (3.0, then 3.1 with inked art), Lucky Cat
(3.0, twelve levels) and The Thank-You Parade (3.0, twelve levels, then 3.1). The Library pauses its music while a video plays, and
two small desk and phone fixes come along.

### Changed

- The Mountain Moved Next Door 3.0: a bolder printed look (carved stone, hand-cut titles and level cards, a palette for each time of day, Old Mossback's eyes following Tess), ladders and the lookout's braces that meet what they join, three new levels (Gathering Mist, Excuse Me, The Ford) and longer Stepping Stones, Empty Spot and Windy Ridge.
- Pass the Pie 3.0: seven rebuilt levels with climbs, rooftops, secrets, a timed dish relay, a chase down Main Street and a three-part fight with Big Gobble before the parade starts. Version 3.1 adds inked halftone skies, textured ground and shadowed props.
- Lucky Cat 3.0: four new levels (Saucer Alley, Thirteen Steps, The Mirror Shop, Earlier Still, where you play Rascal again), 12 levels in all.
- The Thank-You Parade 3.0 grows from seven levels to twelve, with a page of story after every level card and a Cannon Truck boss. Version 3.1 spaces the Bakery Row shutter meter's SHUT label evenly and gives the Cannon Truck its own dusk street and fuse-glow colors.
- The Library's background music pauses while a video or walkthrough is open, and the AV cart's TV looks like a 1990s set (a wide 4:3 tube) with a blue-cyan vacuum fluorescent clock on the VCR.

### Fixed

- The phone's Hint Giant says Gwinn, THE CHEZ and the Round Tuit more clearly in the clips that name them.
- On the 1994 desk, Scoot's speech bubble now shows in front of the PC instead of being cut off behind it.

## [3.2.0] - 2026-11-07

Specials arrive: limited-time games that come out only on their day or season, on the home page and on the 1994 desk.
106 Starters, small games that each teach one idea, fill a new tab and the desk's Sample CD, and the Pocket Player plays
games from a microSD card on two small touch-screen boards. The desk gets a fuller PC and a disk box with dividers, the
editors are easier on phones, touch screens and keyboards, and pages and the offline copy download less.

### Added

- Specials: limited-time games that come out only on their day or season, in a new Special tab on the home page and on the 1994 desk. Two new ones: The Mountain Moved Next Door (the three days after Thanksgiving) and The Noodle Observatory (Monkey Day, December 14).
- A Starters tab with 106 Starters, small games that each teach one idea, with signs in their levels, a 32-bar song each, and two achievements: Show and tell and Honor roll.
- The Pocket Player, a small touch-screen board (3.5 inch or 2.8 inch) set up from the site's install page, with a game picker and title search. The Download chooser can save a game as one .gmp file for its microSD card.
- The desk PC runs RSD's batch files as a real PC did, and the desk's disk box files its floppies behind index-card dividers.
- Phone of the Future: the Junior Lab case, a dial module, the Rev C circuit board, firmware, a parts viewer, and printer and board ZIPs to download.
- The Technical Reference adds byte layouts, real-file examples and a utility architecture chapter, and the Ultimate Owner's Guide shows how to write a DOS installation batch file.

### Changed

- The Thank-You Parade is rebuilt as version 2.0, with a parade-poster look, a rival band and a level played as Marge the crop duster pilot.
- Dialogs fit a phone screen without scrolling, and New game keeps its three starts in view on a phone held sideways.
- Pages open with less to download, and the site and its offline copy are smaller: Starter ZIPs share the DOS player and are put back together in the browser, byte for byte the same.
- THE CHEZ makes the factory car's ka-chunk into 24 V, then 48 V as it pulls away, and coasts with a clunk and a fading whine, even past the desk window.
- The 3D-print trinkets and the phone kit download about two thirds less: the site sends small packed files and makes each STL, 3MF and the printer-parts ZIP in the browser when you save it.

### Fixed

- The home page's games list works by keyboard, focus moves to a new page's heading, and dialogs announce their titles to screen readers.
- My games no longer fills with "(damaged copy)" games.
- The mug of pens on the 1994 desk sits on the desk top again instead of hanging over the wall.
- Undo and Redo keep what they should in the background, monster, character, sample and music editors, and the music editor no longer freezes on a big song.

### Removed

- The desk PC's empty expansion bays, and the Corn Maze postcard's unused address lines.

Full list: [changes/release/pages/3.2.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/pages-v3.2.0/changes/release/pages/3.2.0.md)

## [3.1.0] - 2026-11-02

The first tagged release of the site: the 1994 desk with its PC, BBSes, magazine and Library; today's web editor
for every Game-Maker file type; the web player; and the set of new games built in code.

### Added

- Colors That Work, a Starter for the Telling a Story group: two levels about colors everyone can tell apart. In the first, a plate that stings and a plate that is safe differ only by red against green, and a second picture on the level card shows how that can look to a player who sees red and green alike. In the second, spikes look like spikes and the safe path is light and striped, so it reads in any color.

- The web port of the PLAYGAME engine, playing original Game-Maker games and the new ones, with OPL2 and CMF music, voices and saves.
- The in-browser editor for maps, blocks, characters, monsters, palettes, pictures, animations, sounds, music, recordings, text screens, slide shows and the game integrator, with undo, a Level check and a walkthrough bot.
- The 1994 desk: a PC running DOS and Game-Maker, two BBSes, the magazine TURBO BUTTON, The Ultimate Owner's Guide, the Library, the cast page and felt eggs to find.
- More than twenty new games built in code, each with its manual, printables, box art, walkthrough and tour.
- Exports to a web page, a DOS ZIP and native players, and opening a game another site links to.
- Achievements, a guided tour with voice clips, and offline use as an installable app.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/pages-v3.2.1...HEAD
[3.2.1]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/pages-v3.2.0...pages-v3.2.1
[3.2.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/pages-v3.1.0...pages-v3.2.0
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/pages-v3.1.0
