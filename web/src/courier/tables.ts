// The courier's curated tables, version 1: every name, place, phrase, stamp and letter a courier
// can show is an id into these lists, never text a player typed or another device sent. An id a
// newer table added shows as a plain placeholder. Each name is whole and reviewed on its own, so
// no two parts can add up to something rude. The CYD and the TV get the same ids later.

export const TABLE_VERSION = 1;

/** World names: one per place a courier visits (a CYD, the TV). */
export const WORLDS: readonly string[] = [
  'Lantern Quay',
  'Kite Hollow',
  'Pebble Point',
  'Teapot Ridge',
  'Marble Cove',
  'Button Bay',
  'Maple Steps',
  'Clover Bend',
  'Biscuit Harbor',
  'Pinwheel Park',
  'Thimble Isle',
  'Acorn Landing',
  'Fiddle Creek',
  'Mitten Peak',
  'Willow Wharf',
  'Juniper Meadow',
];

/** A world id no table here knows (a newer device's). */
export const FARAWAY = 'a faraway world';

export const worldName = (id: number): string => WORLDS[id] ?? FARAWAY;

/** A postcard's colors: sky, land, ink. */
export const PALETTES: readonly { name: string; sky: string; land: string; ink: string }[] = [
  { name: 'sea glass', sky: '#bfe3dc', land: '#5f9e8f', ink: '#1d3b35' },
  { name: 'apricot', sky: '#ffd9b0', land: '#d9874a', ink: '#4a2610' },
  { name: 'meadow', sky: '#d8ecb4', land: '#6f9a3c', ink: '#24350f' },
  { name: 'slate', sky: '#d3dbe6', land: '#6c7d96', ink: '#1f2733' },
];

/** What couriers say to each other (captions; mumbled aloud later). None asks anyone to keep playing. */
export const PHRASES: readonly string[] = ['Hello!', 'Nice hat!', 'Look at my postcards', 'Good game!', 'Thank you!', 'Wow!', 'Ha ha!', 'See you!'];

/**
 * A stamp on a postcard. `game` names a catalog game by its title (looked up by id, never sent);
 * anything the catalog does not know, a secret game included, is the same plain mystery stamp,
 * which keeps no id at all.
 */
export type StampKind = 'game' | 'sample-cd' | 'graduation' | 'mystery';

export const STAMP_WORDS: Readonly<Record<Exclude<StampKind, 'game'>, string>> = {
  'sample-cd': 'Sample CD',
  graduation: 'Attended a graduation',
  mystery: 'Saw a mystery game',
};

/** A letter in the mail table: who sent it, its subject, and its paragraphs. */
export interface Letter {
  id: string;
  /** The board whose first connected call brings it (TERMINAL.EXE's directory id). */
  board: string;
  /** Its mail packet's name, as the terminal shows the transfer. */
  packet: string;
  from: string;
  subject: string;
  body: readonly string[];
}

/** Letters, 1994 in-story: each comes from something the player did, never on a timer. */
export const LETTERS: readonly Letter[] = [
  {
    id: 'bbs-sandbox',
    board: 'SANDBOX',
    packet: 'SANDBOX.QWK',
    from: 'The SysOp, THE SANDBOX BBS',
    subject: 'Mail to go',
    body: [
      'Hi Scoot!',
      'Your caller dialed in, so this packet rode home with the call. Mail used to sit on the board until somebody read it there. Now it travels, and the phone line is free while you read.',
      'Thanks for carrying it. Say hi to your caller for me.',
      '-- The SysOp',
    ],
  },
  {
    id: 'bbs-sofa',
    board: 'SOFA',
    packet: 'SOFA.QWK',
    from: 'goat, The Sofa',
    subject: 'Saved you a seat',
    body: [
      'hey Scoot,',
      'eight lines and somebody is always flooding the lounge. a letter is quieter. it waits for you, nobody needs an answer, and the couch cushions stay put.',
      'glad you came along for the ride.',
      '-- goat',
    ],
  },
];

export const letterById = (id: string): Letter | undefined => LETTERS.find((l) => l.id === id);
