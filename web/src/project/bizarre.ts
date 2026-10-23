// The Bard of Bizarre: Lewis "Lewie" Moten III's name for his songs, with his hobo clown Doc Leo
// as their face: big, heartfelt songs about small, overlooked things, in four collections so far
// (bizarre gospels, mundane epics, Shakespeare in Sweatpants and the Latin Veni, Vidi, Risi!;
// COLLECTIONS below files each game for the flyer and the home tab). Games built from those songs (../games/<id>/about.json "series":
// "bizarre") are shareware from The Sofa BBS. A handful get a collection of their own: with
// BIZARRE_MIN or more in the catalog, the home page shows a Bizarre tab (and the site's game
// list a Bizarre group) and they leave Shareware; with fewer they stay in Shareware.

/** The artist and publisher on the Bard's games. */
export const BARD = 'The Bard of Bizarre';

/** How many of the Bard's games it takes for them to get a collection of their own. */
export const BIZARRE_MIN = 4;

interface Listed {
  original?: unknown;
  series?: string;
  company?: string;
}

/** One of the Bard's games: marked "series": "bizarre", or (a catalog built before the field) published under his name. */
export const isBizarreGame = (g: Listed): boolean => !!g.original && (g.series === 'bizarre' || g.company === BARD);

/** Whether the Bard's games have a collection of their own in this catalog. */
export const hasBizarreTab = (catalog: readonly Listed[]): boolean => catalog.filter(isBizarreGame).length >= BIZARRE_MIN;

/** The Bard's collections in order (the flyer's and the home tab's), each game with its one-line pitch for the flyer. */
export const COLLECTIONS: { name: string; tag: string; games: Record<string, string> }[] = [
  {
    name: 'Bizarre Gospels',
    tag: 'The wrong detail of a Bible story, taken very seriously.',
    games: {
      goat: 'Bethlehem’s least-painted goat eats, screams and elbows its way to the manger: third from the left, and proud of it.',
      mustard: 'The smallest seed in all the land hops, roots and moves a mountain with faith the size of, well, itself.',
      needle: 'The rich man walked away; his camel stayed. Give away the gold, slim down your soul and squeeze through the eye of a needle.',
      loaf: 'Nobody picked Loaf #13 to feed the five thousand. Roll past hungry hands and flying fish and find a home anyway.',
    },
  },
  {
    name: 'Mundane Epics',
    tag: 'Tiny everyday disasters, sung like the end of the world.',
    games: {
      carl: 'You are the fly. He has a dish towel. You have a barrel roll and all afternoon.',
      remote: 'Friday night, snacks ready, remote gone. Search the couch, the dog, the fridge and the void between the cushions. (Check your hand.)',
      reckoning: 'Lactose intolerant, 3:17 a.m., one slice of cheesecake, and the willpower of seven celery sticks. The Devil waits in leisure wear.',
      loofah: 'She said don’t touch the pink one. You did. Now the soap has teeth, and only six candles can save you.',
      smirked: 'MILD SCARES FOR ALL AGES, says the sign. The eight-year-old isn’t scared. You are.',
      tickle: 'Doc Leo has the certificate; now he needs the rats. Pin first, then tickle, and grow a laughing carpet. No rats are harmed.',
    },
  },
  {
    name: 'Shakespeare in Sweatpants',
    tag: 'Monologues for the overly dramatic, in a starched ruff and grey sweatpants.',
    games: {
      sweats: 'Seventeen epic monologues at open-mic night: a lost pen, a murderous office chair, a dead ficus named Gerald. Declaim your way through.',
    },
  },
  {
    name: 'Veni, Vidi, Risi!',
    tag: 'Grand Latin songs about not-so-grand Roman troubles.',
    games: {
      risi: 'A poet in a toga and a cat after the cheese, from a dog who breaks wind at the senators’ banquet to a stern emperor who badly needs a laugh.',
    },
  },
];

/** The Bard's games sorted into his collections (in the collection's order); games not filed yet last, under `More song-games`. */
export function byCollection<G extends { id: string }>(games: readonly G[]): { name: string; tag?: string; games: G[] }[] {
  const filed = new Set(COLLECTIONS.flatMap((c) => Object.keys(c.games)));
  const out: { name: string; tag?: string; games: G[] }[] = COLLECTIONS.map((c) => ({ name: c.name, tag: c.tag, games: Object.keys(c.games).flatMap((id) => games.filter((g) => g.id === id)) }));
  out.push({ name: 'More song-games', games: games.filter((g) => !filed.has(g.id)) });
  return out.filter((c) => c.games.length);
}
