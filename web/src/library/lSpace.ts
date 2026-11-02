// L-Space, the dim gap between two stacks in the Library room (libraryRoom.ts): a nod to Terry
// Pratchett's Discworld, where the librarian steps between libraries through the stacks. Here it
// takes the visitor somewhere else to read: a random game's shelf, the magazine, or the Guide. Plain code made for this site; no text or characters from the books.
/** Where L-Space can lead, other than a game's shelf: pages that are good to read. */
const PLACES = ['#/magazine', '#/help'];

/** Takes the visitor to one of the places, picked at random; a game's shelf opens here through `onGame`. */
export function lSpaceTrip(games: string[], onGame: (id: string) => void, random: () => number = Math.random): void {
  const ids = games.filter(Boolean);
  const pick = Math.floor(random() * (ids.length + PLACES.length));
  if (pick < ids.length) onGame(ids[pick]);
  else location.hash = PLACES[pick - ids.length];
}
