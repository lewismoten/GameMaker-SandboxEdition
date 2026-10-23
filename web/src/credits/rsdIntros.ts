// Every distinct RSD intro screen the CD's games show before their own title, for the Credits page gallery.

export interface RsdIntro {
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
    alt: 'An RSD Production: a large blue RSD logo with “Recreational Software Designs” beneath it, framed by a grey box, between the words “An” and “Production” in engraved grey capitals',
    caption: 'The Patchwork Heart’s and Peach the Lobster’s version (2 games)',
    file: 'cd/gameware/heart/gmtitle1.gif',
    games: ['The Patchwork Heart', 'Peach the Lobster'],
  },
];
