// The engine's, players' and pages' pieces from others, as NOTICE.md credits them, for the
// Credits page: each with its license and what it does here. NOTICE.md stays the legal text.

export interface Piece {
  name: string;
  license: string;
  by: string;
  what: string;
  url?: string;
}

export interface PieceGroup {
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
        name: 'font8x8_basic',
        license: 'Public domain',
        by: 'Daniel Hepper, from the IBM PC BIOS font',
        what: 'The 8×8 text font on the game screen (web/src/gfx/font8x8.ts).',
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
