// Who the original source credits for each part of RSD Game-Maker, for the Credits page:
// only what the files in code/ (and the installed copy in runtime/) say, quoted a few words
// at a time. A part whose files name no one is Recreational Software Designs'.
// rsdParts.test.ts checks every file exists and holds its quote.

interface RsdSource {
  /** Path from the repository root. */
  file: string;
  /** A few words exactly as the file has them (runs of spaces count as one). */
  quote: string;
}

interface RsdPart {
  part: string;
  /** Who is credited, as the source names them. */
  who: string;
  sources: RsdSource[];
}

export const RSD = 'Recreational Software Designs';

export const RSD_PARTS: RsdPart[] = [
  {
    part: 'Game-Maker’s menu (GM)',
    who: 'Ollie and Andy Stone',
    sources: [{ file: 'code/GM/MENU.C', quote: 'Game Maker Menu Program by Ollie and Andy Stone' }],
  },
  {
    part: 'Integrator (GRATOR)',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/GRATOR.C', quote: 'Programmer: Andy Stone' },
      { file: 'code/GM/GRATOR.C', quote: 'By Gregory Stone' },
    ],
  },
  {
    part: 'Block designer (BLOCEDIT)',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/BLOCEDIT.C', quote: 'Programmer: Andy Stone' },
      { file: 'code/GM/BLOCC.C', quote: 'Andy Stone + BRO' },
    ],
  },
  {
    part: 'Map maker (MAPMAKER)',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/MAPMAKER.C', quote: 'Programmer: Andy Stone' },
      { file: 'code/GM/MAP.H', quote: 'Copyright 1991 Gregory Stone' },
    ],
  },
  {
    part: 'Monster designer (MONEDIT)',
    who: 'Oliver (Ollie) Stone',
    sources: [
      { file: 'code/GM/MONEDIT.C', quote: 'Programmer: Ollie Stone' },
      { file: 'code/GM/MON.H', quote: 'Copyright 1991 Oliver Stone' },
    ],
  },
  { part: 'Character designer (CHAREDIT)', who: 'Oliver Stone', sources: [{ file: 'code/GM/CHAREDIT.C', quote: 'Character Editor by: Oliver Stone' }] },
  { part: 'Palette chooser (PALCHOS)', who: 'Andy Stone', sources: [{ file: 'code/GM/PALCHOS.C', quote: 'Programmer: Andy Stone' }] },
  {
    part: 'Image and GIF reader (IMAGE)',
    who: 'Ollie Stone; later edits by Andy Stone',
    sources: [
      { file: 'code/GM/IMAGE.C', quote: 'gifread.c By Ollie Stone' },
      { file: 'code/GM/IMAGE.C', quote: 'Last edited: 7/10/91 (Andy Stone)' },
    ],
  },
  {
    part: 'Sound designer (SNDEDIT)',
    who: 'Oliver Stone; digitized speech by Andy Stone and Pete Savage',
    sources: [
      { file: 'code/GM/SNDEDIT.C', quote: 'Sound Editor by : Oliver Stone' },
      { file: 'code/GM/SNDEDIT.C', quote: 'Digitized speech capabilities Andy Stone, Pete Savage' },
    ],
  },
  { part: 'Sound Blaster voice routines (SOUNDC)', who: 'Peter Savage', sources: [{ file: 'code/GM/SOUNDC.C', quote: 'Author:Peter Savage' }] },
  {
    part: 'Joystick routines (JSTICKC, JSTICKA)',
    who: 'Peter Savage; a change by Andy Stone',
    sources: [
      { file: 'code/GM/JSTICKC.C', quote: 'Author:Peter Savage' },
      { file: 'code/GM/JSTICKA.ASM', quote: 'Author:Peter Savage' },
      { file: 'code/GM/JSTICKC.C', quote: 'change Readjoystick to unsigned int -- Andy Stone' },
    ],
  },
  { part: 'Music player (SBMUSIC)', who: RSD, sources: [{ file: 'code/GM/SBMUSIC.C', quote: '' }] },
  {
    part: 'The game player (PLAYGAME)',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/PLAYGAME.C', quote: 'Programmer: Andy Stone' },
      { file: 'code/GM/PLAYGAME.C', quote: 'By Gregory Stone' },
    ],
  },
  {
    part: 'Installer (INSTALL, FLOPINST)',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/INSTALL.CPP', quote: 'Programmer: Andy Stone' },
      { file: 'code/GM/INSTALL.CPP', quote: 'Copyright 1994 Gregory Stone' },
    ],
  },
  {
    part: 'Registration (REGIST, UPDATE)',
    who: 'Oliver Stone; later edits by Andy Stone',
    sources: [
      { file: 'code/GM/REGIST.C', quote: 'By: Oliver' },
      { file: 'code/GM/REGIST.C', quote: 'Last Edited: Andy Stone 1/28/93' },
    ],
  },
  { part: 'Transfer utility (UTILITY)', who: RSD, sources: [{ file: 'code/GM/UTILITY.C', quote: '' }] },
  {
    part: 'Screen, mouse and window routines',
    who: 'Andy Stone',
    sources: [
      { file: 'code/GM/SVGAC.C', quote: 'By Andy Stone' },
      { file: 'code/GM/MOUSEFN.H', quote: 'mousefn.c header file by Andy Stone' },
      { file: 'code/GM/WINDIO.H', quote: 'windio.c header file by Andy Stone' },
    ],
  },
  {
    part: 'Video drivers (DRV, 1994–95)',
    who: 'G. Andrew (Andy) Stone',
    sources: [
      { file: 'code/DRV/VGA.ASM', quote: 'Copyright 1994 G. Andrew Stone' },
      { file: 'code/DRV/TSENG4K.ASM', quote: 'Copyright 1995 Andrew Stone' },
    ],
  },
  {
    part: 'Image and FLI library (Image, 1994)',
    who: 'G. Andrew Stone',
    sources: [{ file: 'code/Image/FLI/FLI.CPP', quote: 'Copyright 1994 G. Andrew Stone' }],
  },
];

/** Credits in the sample games that came with Game-Maker (the installed copy in runtime/run/GM). */
export const RSD_SAMPLE_CREDITS: (RsdSource & { game: string })[] = [
  { game: 'Nebula', file: 'runtime/run/GM/NEBULA/NEBULAC.TXT', quote: 'Monsters Joan Stone' },
  { game: 'Nebula', file: 'runtime/run/GM/NEBULA/NEBULAC.TXT', quote: 'Storyline: Gregory Stone.' },
  { game: 'Zark', file: 'runtime/run/GM/ZARK/ZARKCRED.TXT', quote: 'Menu animations were done by Gregory Stone.' },
  { game: 'The Patchwork Heart', file: 'runtime/run/GM/HEART/HEARTC.TXT', quote: 'Menu Screens Andrew Stone' },
];
