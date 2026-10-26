// Every distinct RSD intro screen the CD's games show before their own title, for the Credits page gallery.

interface RsdIntro {
  /** File in web/public/credits/. */
  src: string;
  alt: string;
  caption: string;
  /** Path from the repository root of one source file with these pixels. */
  file: string;
  /** Display titles of the CD games that show it. */
  games: string[];
}

export const RSD_INTROS: RsdIntro[] = [
  {
    src: 'rsd.webp',
    alt: 'Recreational Software Designs’ Game-Maker Presents: “Game-Maker” in blue and “Presents:” in red over white clouds and a blue sky, under a pale blue shape',
    caption: 'RSD’s title screen in Nebula, Zark and nine more games (11 games)',
    file: 'cd/gameware/nebula/gmtitle.gif',
    games: [
      'Nebula',
      'Pipemare',
      'Penguin Pete',
      'Zark',
      'Glubada Pond',
      'Crullo: Adventures of a Donut',
      "Cireneg's Rings",
      'Linear Volume',
      'Progress or Congress?',
      'ORB - The Derelict Planet',
      'Parsec Man 3D',
    ],
  },
  {
    src: 'rsd-production.webp',
    alt: 'An RSD Production: a large blue RSD logo with “Recreational Software Designs” beneath it, framed by a gray box, between the words “An” and “Production” in engraved gray capitals',
    caption: 'The Patchwork Heart’s and Peach the Lobster’s version (2 games)',
    file: 'cd/gameware/heart/gmtitle1.gif',
    games: ['The Patchwork Heart', 'Peach the Lobster'],
  },
  {
    src: 'rsd-tutor-game.webp',
    alt: 'The word “GAME” in large serif capitals shading from gold to green, near the top of a black screen',
    caption: 'Tutor’s animated intro, first half: GAME (1 game)',
    file: 'cd/gameware/tutor/gm3a.fli',
    games: ['Tutor'],
  },
  {
    src: 'rsd-tutor-maker.webp',
    alt: 'The word “MAKER” in large serif capitals shading from cyan to blue, across the middle of a black screen',
    caption: 'Tutor’s animated intro, second half: MAKER (1 game)',
    file: 'cd/gameware/tutor/gm3b.fli',
    games: ['Tutor'],
  },
];
