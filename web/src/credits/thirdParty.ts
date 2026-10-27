// The engine's, players' and pages' pieces from others, as NOTICE.md credits them, for the
// Credits page: each with its license and what it does here. NOTICE.md stays the legal text.

export interface Piece {
  name: string;
  license: string;
  by: string;
  what: string;
  url?: string;
}

interface PieceGroup {
  id: string;
  title: string;
  note?: string;
  pieces: Piece[];
}

export const PIECE_GROUPS: PieceGroup[] = [
  {
    id: 'credits-web',
    title: 'In the site',
    pieces: [
      {
        name: 'font8x8_basic, font8x8_ext_latin, font8x8_greek and font8x8_misc',
        license: 'Public domain',
        by: 'Daniel Hepper, from the IBM PC BIOS font',
        what: 'The 8×8 text font on the game screen and the PC’s text screens (web/src/gfx/font8x8.ts; its accented letters, Greek letters and some symbols in web/src/gfx/cp437Glyphs.ts).',
        url: 'https://github.com/dhepper/font8x8',
      },
      {
        name: 'Caveat',
        license: 'SIL Open Font License 1.1',
        by: 'Impallari Type',
        what: 'The handwriting on the Owner’s Guide’s registration record. Its 600 weight, cut to Latin-1, is kept with the site (web/src/manual/fonts), so no font server is asked for it; not in exported games.',
        url: 'https://fonts.google.com/specimen/Caveat',
      },
      {
        name: 'CRC-32',
        license: 'Algorithm (no code used)',
        by: 'David Schwaderer, as PKWARE’s APPNOTE.TXT credits it',
        what: 'The checksum in the .zip files the site writes (web/src/project/zip.ts), written for this project from the standard ZIP polynomial and APPNOTE’s layout.',
      },
      {
        name: 'MD5',
        license: 'Algorithm (no code used)',
        by: 'Ronald Rivest, RFC 1321 (MIT Laboratory for Computer Science and RSA Data Security, Inc., 1992)',
        what: 'Tells the CD’s XFERPLAY.EXE from any other file before the DOS player customizer patches it (web/src/dosPlayer/md5.ts), written for this project from the RFC’s description.',
      },
      {
        name: 'FLI format',
        license: 'Format description',
        by: 'Jim Kent and Heidi Brumbaugh (Dancing Flame), via Andy Stone’s FLI.CPP',
        what: 'How the FLI reader (web/src/formats/fli.ts) reads Autodesk Animator files.',
      },
      {
        name: 'OPL2 (YM3812) FM synthesis',
        license: 'Written for this project',
        by: 'The chip is Yamaha’s; the emulation is this project’s own',
        what: 'Plays the CMF music (web/src/audio/opl.ts). No emulator’s code was adapted.',
      },
      {
        name: 'Modem handshakes',
        license: 'Published standards (no code or recordings used)',
        by: 'The Bell System (Bell 103, Bell 212A) and the ITU-T (V.22bis, V.32, V.32bis, V.8, V.34, V.90)',
        what: 'The sounds the desk’s modem makes at each line speed, synthesized from the standards’ tones (web/src/retro/bbs/modem.ts).',
      },
      {
        name: 'TTY Baudot code',
        license: 'Published standards (no code used)',
        by: 'ITU-T V.18 (1994) and ANSI/TIA-825; cross-checked against Asterisk’s tdd.c (GPL v2, Digium), none of it copied',
        what: 'The 45.45-baud text-telephone code for TERMINAL’s TTY calls (web/src/retro/bbs/baudot.ts). Period facts from Gallaudet University, the FCC and Ultratec; Ultratec and Turbo Code are Ultratec, Inc.’s names, and Turbo Code is only named.',
      },
      {
        name: 'viridis',
        license: 'CC0 (public domain dedication)',
        by: 'Stéfan van der Walt and Nathaniel Smith',
        what: 'The six colors of the level check’s heat map, which read with every kind of color vision (web/src/editor/check).',
        url: 'https://bids.github.io/colormap/',
      },
      {
        name: 'WCAG 2 contrast ratio',
        license: 'W3C formula (no code used)',
        by: 'The W3C’s Web Content Accessibility Guidelines',
        what: 'How the level check measures a monster against the scenery behind it, and the Color vision check’s grayscale.',
      },
      {
        name: 'Color vision simulation',
        license: 'Published matrices (no code used)',
        by: 'Gustavo M. Machado, Manuel M. Oliveira and Leandro A. F. Fernandes, IEEE TVCG, 2009',
        what: 'How the palette editor’s Color vision check shows a level with protanopia, deuteranopia or tritanopia (web/src/editor/editors/palette/colorVision.ts).',
      },
      {
        name: 'CIELAB and ΔE (CIE 1976)',
        license: 'Published standard (no code used)',
        by: 'The International Commission on Illumination (CIE); sRGB curve from IEC 61966-2-1',
        what: 'How the Color vision check measures whether two colors look alike.',
      },
      {
        name: 'sfxr (the idea)',
        license: 'An idea, freshly written (no code used)',
        by: 'Tomas Pettersson (DrPetter), 2007',
        what: 'Sliders plus presets that give a new take each time, as in the editor’s 🎛 sound effect maker and PC speaker effects (web/src/audio/sfxSynth.ts, web/src/editor/tools/speakerFx.ts).',
      },
      {
        name: 'A Smarter Way to Find Pitch (the method)',
        license: 'A published method, freshly written (no code used)',
        by: 'Philip McLeod and Geoff Wyvill, ICMC 2005',
        what: 'How the sound set editor’s Preview as PC speaker finds the pitch of a .voc, step by step (web/src/audio/vocToSpeaker.ts).',
      },
      {
        name: 'Mr. Yuck',
        license: 'Trademark of UPMC Children’s Hospital of Pittsburgh',
        by: 'A simple drawing in tribute, not the original artwork',
        what: 'The green poison-warning sticker on the desk’s phone.',
      },
      {
        name: 'Phosphate',
        license: 'Comes with macOS; no font file included',
        by: 'Steve Jackaman and Ashley Muir, © International TypeFounders, Inc.',
        what: 'The DOC LEO lettering on the desk’s black-light poster, drawn into its pictures by Claude with Pillow and NumPy (games/kit/scans/blacklight.py).',
      },
      {
        name: 'A room where everything can be clicked',
        license: 'An inspiration; nothing copied',
        by: 'The Brothers Chaps (Mike and Matt Chapman), who made Homestar Runner and Strong Bad’s emails',
        what: 'The 1994 desk, where nearly everything does something when clicked and some things are hidden to find. Lewis watched their Flash cartoons, where clicking things in the last scene turned up hidden extras. The names are their owners’.',
        url: 'https://homestarrunner.com/',
      },
      {
        name: 'Model Context Protocol',
        license: 'Protocol specification (the SDK used is MIT)',
        by: 'The Model Context Protocol project, begun by Anthropic',
        what: 'How AI tools talk to the local server that opens, checks and edits games (web/scripts/mcp, with its TypeScript SDK) and to the editor’s Assistant through it. None of it is in the site or the downloads.',
        url: 'https://modelcontextprotocol.io/',
      },
      {
        name: 'WebMCP',
        license: 'Draft specification (no code used)',
        by: 'The W3C Web Machine Learning Community Group',
        what: 'How the editor’s Assistant offers its tools to an AI agent built into the browser, when the browser has it and the visitor opts in (web/src/assistant/webmcp.ts).',
        url: 'https://webmachinelearning.github.io/webmcp/',
      },
      {
        name: 'PNG',
        license: 'Format description (RFC 2083)',
        by: 'Thomas Boutell and the PNG Development Group',
        what: 'The pictures the Assistant shows an AI tool (web/src/assistant/png.ts), written for this project from the specification; the browser’s own compression packs them.',
        url: 'https://www.rfc-editor.org/rfc/rfc2083',
      },
    ],
  },
  {
    id: 'credits-magazine',
    title: 'In TURBO BUTTON and the guides',
    note: 'The magazine and The Ultimate Owner’s Guide are written and drawn for this project. These are what they draw on from others, and the names they make up.',
    pieces: [
      {
        name: 'The Shareware Shelf',
        license: 'Titles, years and makers only; no files copied',
        by: 'The Internet Archive’s Game-Maker Archive collection, from archive.org’s public search API',
        what: 'The community games listed on TURBO BUTTON’s Shareware Shelf (web/src/manual/magazine/data/gameMakerArchive.json, fetched by web/scripts/gameMakerArchive.ts). The page links to none of them, and a few titles are left off a family page. The games belong to their authors.',
        url: 'https://archive.org/search?query=subject%3A%22Game-Maker+games%22',
      },
      {
        name: 'Tricks from the shareware authors',
        license: 'Ideas described in this project’s own words; no art, music, sounds or text copied',
        by: 'Community games in the Game-Maker Archive: Blinky 2 and 3, Ninja Tuck, A-J’s Quest, Builder, The Return of A-J and Ricci’s Cow Hunt (A-J Games), Parsec Man 3D (Mark Hadley), Shanna (Angelo Felix), Hurdles (Roland Ludlam), Seal Boarders and Seal Boarders 2, Zarlor 2 and Fox Party (John and Robert Brandon), Time After Time (New Age Warriors), Puzzle and Havok (Eclypse Games), Power Fights A.C.: Power Moves II (Alan Caudel), Jet! (likely Alan Caudel), Party of Four, an unfinished monster-movie fan game, the Return of the Jedi fan game, Ski, RSD’s Penguin Pete and Woman Warrior, and others',
        what: 'Chapter 17 of The Ultimate Owner’s Guide, the archive counts in its “Where Game-Maker Runs Out”, and TURBO BUTTON’s “Tricks of the Shareware Masters”.',
        url: 'https://archive.org/search?query=subject%3A%22Game-Maker+Archive+featured+games%22',
      },
      {
        name: 'Playing the archive',
        license: 'Lewis’s own play-throughs; nothing copied',
        by: 'Lewis Moten',
        what: 'Lewis played and reviewed many of the older DOS games in the Game-Maker Archive to see the techniques different authors used. What he spotted, such as an arrow or a hand as a hero to pick with, choices made by walking through a door, and a diagonal course that loops through the wrap, became sections of chapter 17 of The Ultimate Owner’s Guide.',
        url: 'https://archive.org/search?query=subject%3A%22Game-Maker+games%22',
      },
      {
        name: 'Hex-edited players',
        license: 'Ideas described in this project’s own words; nothing copied',
        by: 'A-J Games: Builder, whose player has its menu words blanked, and the unfinished Rōdïp: Rover of the Deep, whose player renames Hitpoints and Lives to Energy and Failsafes; and Acord Games, whose shared player asks for every file under a renamed extension (.z0g, .z0n…)',
        what: 'These games led this project to map every word Game-Maker’s DOS player shows and where it sits in the file: The Ultimate Owner’s Guide’s “Customizing the player’s own words” and its table, and then the DOS player customizer: the integrator’s DOS player panel and the desk’s PLAYHACK, whose presets blank the menu as Builder did and rename the status words as Rōdïp did, and whose Files tab renames the extensions as Acord did.',
        url: 'https://archive.org/details/game-maker_builder',
      },
      {
        name: 'Lewis’s DOSBox screenshot',
        license: 'Lewis’s own capture, on this fork’s terms',
        by: 'Lewis Moten, testing the games in real DOS',
        what: 'A Fly Named Carl’s garbled title, in the guide’s “Where Game-Maker Runs Out” (web/public/ultimate/carl-dos.webp) and TURBO BUTTON’s “Bugs Only DOS Could Find” (web/public/magazine/dos-carl.webp).',
      },
      {
        name: 'The first Easter eggs',
        license: 'Historical facts; names only',
        by: 'Warren Robinett’s Adventure (Atari 2600, 1980), Atari’s Steve Wright, who gave them the name, and Moonlander (1973)',
        what: 'TURBO BUTTON’s page on the history of Easter eggs. The names are their owners’.',
      },
      {
        name: 'Made-up brands',
        license: 'Parody names, made up for the story',
        by: 'ILLOGITECH, SOUND BOASTER and Overcreative Labs, GRAVITAS, HOLE-Y MOLEY and Punchline Products, PIXELMAX, SQUEAK, AwkWard BIOS, Kiln & Kilobyte, Tin Can Telecom, Shoebox Media Co. and Square Deal Pad Co.',
        what: 'The desk’s hardware and TURBO BUTTON’s ads. None is a real company or product, no connection with or endorsement by any company is implied, and the prices are part of the story. The desk’s sound card is “Sound Blaster compatible”, as the clone cards said; Sound Blaster is Creative Technology’s trademark.',
      },
    ],
  },
  {
    id: 'credits-melodies',
    title: 'Melodies from older music',
    note: 'The site’s own music is arranged and synthesized for this project, so there is no recording to credit. These pieces quote older tunes whose compositions are in the public domain in the US; the last is a third-party game’s, still under copyright.',
    pieces: [
      {
        name: 'Yankee Doodle',
        license: 'Public domain',
        by: 'Traditional American tune, 18th century',
        what: 'The fife on Main Street in Teddy’s Little Bigger Adventure (games/teddy2, MAIN.CMF), arranged for the game.',
      },
      {
        name: 'Toccata and Fugue in D minor, BWV 565',
        license: 'Public domain',
        by: 'Credited to J. S. Bach, about 1704',
        what: 'The haunted house organ’s opening mordent in I Screamed, She Smirked (games/smirked: TITLE.CMF, STORY.CMF, FOYER.CMF), arranged for the game.',
      },
      {
        name: 'Für Elise',
        license: 'Public domain',
        by: 'Ludwig van Beethoven, about 1810 (published 1867)',
        what: 'Its opening is the hold music on the desk phone’s business lines (web/src/desk/room/phone/sounds.ts).',
      },
      {
        name: 'Happy Birthday to You',
        license: 'Public domain',
        by: 'The tune of “Good Morning to All”, Mildred J. Hill, 1893',
        what: 'The ending song of Teddy’s Little Biggest Adventure (games/teddy3), arranged for the game.',
      },
      {
        name: 'Yankee Doodle (again)',
        license: 'Public domain',
        by: 'Traditional American tune, 18th century',
        what: 'A music box in a hidden bonus on the site (web/src/eggs/musicBox.ts).',
      },
      {
        name: 'Piano Sonata No. 14, the Moonlight (first movement)',
        license: 'Public domain',
        by: 'Ludwig van Beethoven, 1801',
        what: 'RSD’s sample song GMMOONLT.CMF on the CD.',
      },
      {
        name: 'Home on the Range',
        license: 'Public domain',
        by: 'Daniel E. Kelley (music) and Brewster M. Higley (words), 1872',
        what: 'RSD’s sample song GMRANGE.CMF on the CD.',
      },
      {
        name: 'Dance of the Sugar Plum Fairy (The Nutcracker)',
        license: 'Public domain',
        by: 'Pyotr Ilyich Tchaikovsky, 1892',
        what: 'GMFAIRY.CMF in the shareware games A-J’s Quest and Ralph’s game on the CD.',
      },
      {
        name: 'The Imperial March',
        license: 'Under copyright, not licensed by this project',
        by: 'John Williams, 1980',
        what: 'SND7.CMF in three A-J Games shareware games on the CD (Bounerim, Ralph’s game, Sign of the Hedgehog), kept unaltered as their authors distributed them.',
      },
    ],
  },
  {
    id: 'credits-cd-pictures',
    title: 'Pictures in the CD’s games',
    note: 'Most of the CD games’ pictures are drawn or rendered, but some are scanned photographs, paintings or frames of film. None of the games name a source, so these were traced in October 2026 by looking and by searching text; an uncertain source says “likely” or “appears to be”. They are kept unaltered, as their authors distributed them, and are not licensed by this project.',
    pieces: [
      {
        name: 'The Blue Marble',
        license: 'Public domain (NASA)',
        by: 'The crew of Apollo 17, 1972',
        what: 'The Earth in Nebula (BLUE.GIF, and small in MENU.GIF and NOVA.FLI).',
        url: 'https://en.wikipedia.org/wiki/The_Blue_Marble',
      },
      {
        name: 'Saturn’s crescent (Voyager 1, frame C3501159)',
        license: 'Public domain (NASA)',
        by: 'NASA/JPL, Voyager 1, 1980',
        what: 'Nebula’s SATRING.GIF, tinted blue; the same picture is in the CD’s picture library (cd/picture/space/planets).',
      },
      {
        name: 'Io (Voyager 1)',
        license: 'Public domain (NASA)',
        by: 'Appears to be NASA/JPL, Voyager 1, 1979',
        what: 'Nebula’s yellow world (YELOSUN.GIF, YELOLOW.GIF, YELOBYE.FLI, NOVA.FLI, MENU.GIF): Jupiter’s moon Io with a volcanic plume on its edge.',
        url: 'https://photojournal.jpl.nasa.gov/target/io',
      },
      {
        name: 'Nebula’s green planet',
        license: 'Unknown; likely public domain (NASA)',
        by: 'Source not identified',
        what: 'GREENHI.FLI, GREENBYE.FLI and HISCORE.GIF: a planet photograph tinted green, possibly Mars.',
      },
      {
        name: 'The Outer Limits (1963–1965)',
        license: 'Under copyright (today MGM’s), not licensed by this project',
        by: 'Episodes “The Cry of Silence” (1964) and “The Zanti Misfits” (1963), as the game itself says',
        what: 'Frames captured from the TV series in Sheldon Chase’s Woman Warrior and the Outer Limits and Woman Warrior and the Attack From Below (OLSTART.GIF, WARRIOR.GIF, OLENDING.GIF and their menu and text-box animations). The woman appears to be June Havoc.',
        url: 'https://en.wikipedia.org/wiki/The_Outer_Limits_(1963_TV_series)',
      },
      {
        name: 'The Nazgûl',
        license: 'Under copyright, not licensed by this project',
        by: 'Ted Nasmith, first published in the 1990 Tolkien Calendar',
        what: 'The painting behind the title of Matt Bell’s Paper Airplane (GMTITLE.GIF).',
        url: 'https://www.tednasmith.com/?p=214',
      },
      {
        name: 'Falcon turning into an F-16',
        license: 'Likely under copyright, not licensed by this project',
        by: 'May be Jody Sjogren’s Metamorphosis II: Falconfyre (1986); not confirmed',
        what: 'Paper Airplane’s opening picture (OPENPAP.GIF). Its ending picture (ENDPAP.GIF), a figure of cloud over a runway, is from a source not identified.',
        url: 'https://wright.libraryhost.com/repositories/2/top_containers/6194',
      },
      {
        name: 'Tropical birds painting',
        license: 'Unknown; presumably under copyright',
        by: 'Artist not identified',
        what: 'The title picture of RSD’s Sample game (SAMPLE.GIF, MENUBKG.FLI, TEXTBKG.FLI): an orange long-billed bird, a blue-and-yellow macaw, a hummingbird and egrets.',
      },
      {
        name: 'Boathouse photograph',
        license: 'Unknown',
        by: 'Source not identified',
        what: 'RSD’s Houses (HOUSES.GIF, BKG.GIF): a boathouse with a canoe on a pond.',
      },
      {
        name: 'Beach, mountain lake and water photographs',
        license: 'Unknown',
        by: 'Source not identified; two are in the CD’s own picture library (cd/picture/nature OCEAN1.GIF and AMER01_I.GIF)',
        what: 'Glubada Pond’s OCEAN.GIF (also in END.FLI), POND.GIF and WATER.GIF.',
      },
      {
        name: 'Clouds behind RSD’s title',
        license: 'Unknown',
        by: 'Source not identified',
        what: 'The photograph of clouds behind “Recreational Software Designs’ Game-Maker Presents:” (GMTITLE.GIF) in many of the CD’s games.',
      },
    ],
  },
  {
    id: 'credits-players',
    title: 'In the Mac, Windows and Linux players',
    pieces: [
      {
        name: 'WebView2 interface header',
        license: 'BSD-style (Microsoft)',
        by: 'Microsoft Corporation, from the WebView2 SDK 1.0.3485.44',
        what: 'The Windows player’s list of WebView2 interface slots and IDs (win/Player/webview2.h). No other SDK file, and not WebView2Loader.dll.',
      },
      {
        name: 'webview’s way of finding WebView2',
        license: 'MIT',
        by: 'Serge Zaitsev and Steffen André Langnes (the webview library)',
        what: 'The approach the Windows player uses to load the WebView2 runtime from where Edge’s updater records it. The code is this project’s own C.',
        url: 'https://github.com/webview/webview',
      },
      {
        name: 'MinGW-w64 runtime startup code',
        license: 'Permissive (mingw-w64 project and contributors)',
        by: 'The mingw-w64 project',
        what: 'A little C runtime startup code linked into each Windows .exe.',
        url: 'https://github.com/mingw-w64/mingw-w64/blob/master/COPYING.MinGW-w64-runtime/COPYING.MinGW-w64-runtime.txt',
      },
      {
        name: 'Zig and its compiler_rt',
        license: 'MIT',
        by: 'Zig contributors',
        what: 'Builds the Windows and Linux players; a few of its compiler support routines may be inside them.',
        url: 'https://ziglang.org/',
      },
      {
        name: 'glibc start files',
        license: 'GNU LGPL 2.1 or later, with the linking exception',
        by: 'The GNU C Library',
        what: 'The small start files in the Linux player, built against glibc 2.28.',
      },
      {
        name: 'GTK 3 and WebKitGTK',
        license: 'GNU LGPL 2.1 or later',
        by: 'The GNOME and WebKit projects',
        what: 'Loaded at run time from the computer’s own packages to show the Linux player’s window. None of their code or headers is included.',
      },
      {
        name: 'Microsoft Edge WebView2 Runtime',
        license: 'Microsoft’s; part of Windows',
        by: 'Microsoft',
        what: 'The web engine the Windows player uses. Not included.',
      },
      {
        name: 'AppKit and WebKit',
        license: 'Apple’s; part of macOS',
        by: 'Apple',
        what: 'The window and web engine the Mac player uses. Not included.',
      },
    ],
  },
  {
    id: 'credits-dos',
    title: 'In the DOS exports',
    pieces: [
      {
        name: 'SNDBLAST.DRV',
        license: 'Creative Technology’s; not MIT',
        by: 'Creative Technology Pte Ltd., 1989–1990',
        what: 'The Sound Blaster voice driver, included as it came on the Game-Maker CD; “Export for DOS” adds it the way Game-Maker’s own Transfer did.',
      },
    ],
  },
  {
    id: 'credits-source',
    title: 'Kept in the original source',
    note: 'Andy Stone’s 2014 release in code/ also holds other people’s code and documents. Each keeps its own terms, not the MIT License, and none of it is used by the site.',
    pieces: [
      {
        name: 'Info-ZIP Zip 2.0.1 and UnZip 5.12',
        license: 'Info-ZIP’s terms (free, not for profit)',
        by: 'Mark Adler, Richard B. Wales, Jean-loup Gailly, Kai Uwe Rommel, Igor Mandrichenko, John Bush, Samuel H. Smith, Greg Roelofs, David MacKenzie and others',
        what: 'Zip tools bundled under code/Image/PNG. Mark Adler put inflate, explode, funzip and ship in the public domain or left them uncopyrighted.',
      },
      {
        name: 'pnglib 0.6',
        license: 'Its own permissive notice',
        by: 'Guy Eric Schalnat, Group 42, Inc. (1995)',
        what: 'The draft PNG reference library, under code/Image/PNG.',
      },
      {
        name: 'PNG specification, tenth draft',
        license: 'Reproduce only complete and unaltered',
        by: 'Thomas Boutell (1995)',
        what: 'Reference text under code/Image/PNG.',
      },
      {
        name: 'GIFSAVE 1.0',
        license: 'Public domain',
        by: 'Sverre H. Huseby (1992)',
        what: 'A GIF writer under code/Image/GIF; not part of Game-Maker’s build. The site’s GIF coder is new.',
      },
      {
        name: 'BMP2BGI 1.0',
        license: 'No license given',
        by: 'Richard G. Rasulis, Jr.; its BMP.H from Charles Petzold’s PC Magazine article (Ziff-Davis)',
        what: 'A bitmap converter under code/Image.',
      },
      {
        name: 'PKWARE’s APPNOTE.TXT',
        license: 'Document',
        by: 'PKWARE; it credits David Schwaderer (CRC-32), Roger Schlafly (encryption) and Robert Mahoney (the .ZIP name)',
        what: 'The ZIP format description in code/GM.',
      },
      {
        name: 'LHarc',
        license: 'Its author’s (“(c)Yoshi, 1988-89”); not MIT',
        by: 'Haruyasu Yoshizaki',
        what: 'The archiver the original floppy installer ran (code/GM/FLOPINST.CPP); LHarc 1.13 is on the CD in cd/backup, and LHA 2.13 with its manual in cd/sharware/tools. Not on this website.',
      },
    ],
  },
];
