// The Baker Family Root Beer: Ebenezer Baker's recipe card, ingredient by ingredient, with
// the family's footnotes. Each room's exit page shows its line of the card; the box's recipe
// card prints them all (and leaves the thirteenth line blank, as the family always has).

interface RecipeLine {
  n: number;
  name: string;
  /** The amount and the instruction, as Ebenezer wrote it. */
  line: string;
  /** The footnote, as the family has added to it since. */
  note: string;
  /** Where in the kitchen it is kept. */
  room: string;
}

export const RECIPE: RecipeLine[] = [
  {
    n: 1,
    name: 'Sassafras Root',
    line: 'One root, dug at midnight with a silver spoon.',
    note: 'Any spoon. Ebenezer just liked saying "silver."',
    room: 'The Pantry',
  },
  { n: 2, name: 'Wintergreen', line: 'A good handful, from the north side of the tree only.', note: 'The south side is for Tories.', room: 'The Larder' },
  { n: 3, name: 'Nutmeg', line: 'One whole nutmeg. Genuine.', note: 'Not wooden. Connecticut, we are looking at you.', room: 'The Spice Parlor' },
  {
    n: 4,
    name: 'Molasses',
    line: 'One jug of Boston molasses, poured slowly.',
    note: 'Very slowly. Molasses has never been in a hurry about anything.',
    room: 'The Bakehouse',
  },
  { n: 5, name: 'Vanilla Bean', line: 'One bean, smuggled in a tricorn hat.', note: "Ebenezer's hat smelled lovely until 1803.", room: 'The Cold Cellar' },
  {
    n: 6,
    name: 'Boston Harbor Tea',
    line: 'One pinch, fished out of the harbor, Dec. 16, 1773.',
    note: 'Slightly salty. That is how you know it is authentic.',
    room: 'The Tea Room',
  },
  {
    n: 7,
    name: 'Cane Sugar',
    line: 'Two cups, untaxed.',
    note: 'The tax man was told it was sand. He believed it. He was not a baker.',
    room: 'The Sugar Room',
  },
  { n: 8, name: 'Yeast', line: 'One spoonful of Gerald.', note: 'Gerald is the family starter. Gerald is 250 years old. Feed Gerald.', room: 'The Brewery' },
  { n: 9, name: 'Cloves', line: 'Twelve cloves, one for each colony.', note: 'There were thirteen colonies. Georgia brought its own.', room: 'The Clock Room' },
  {
    n: 10,
    name: 'Licorice Root',
    line: 'Two sticks, snapped, never cut.',
    note: 'Cutting it is how the Redcoats did it. Do not be the Redcoats.',
    room: 'The Bottling Line',
  },
  {
    n: 11,
    name: 'Bottled Lightning',
    line: "One bolt, borrowed from Dr. Franklin's kite. For the fizz.",
    note: 'He said we could keep it. He said a great many things.',
    room: 'The Lightning Loft',
  },
  {
    n: 12,
    name: 'Water, Boiled Twice',
    line: 'One gallon, boiled once for each Continental Congress.',
    note: 'The second boil took longer. It was waiting on a quorum.',
    room: 'The Cistern',
  },
];

/** The other side of the card, where line 13 was all along. */
export const THIRTEENTH = {
  name: 'The Thirteenth Ingredient',
  line: 'Stir counterclockwise, keep it under your hat, and do not tell the British.',
  note: "That is the whole secret. It always was. Serves a baker's dozen.",
};

/** The rooms' names, in order (13 is the Vault, and 0 the room nobody mentions). */
export const ROOM_NAMES = [
  "Ebenezer's Hidey-Hole",
  'The Pantry',
  'The Larder',
  'The Spice Parlor',
  'The Bakehouse',
  'The Cold Cellar',
  'The Tea Room',
  'The Sugar Room',
  'The Brewery',
  'The Clock Room',
  'The Bottling Line',
  'The Lightning Loft',
  'The Cistern',
  'The Vault',
];
