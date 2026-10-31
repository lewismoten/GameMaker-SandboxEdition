// The little dog treat store inside the open safe: generic names, prices in pretend coins.
export interface Treat {
  id: string;
  name: string;
  price: number;
  /** What Teddy says and does. */
  line: string;
}

export const TREATS: readonly Treat[] = [
  { id: 'air', name: 'Imaginary biscuit', price: 0, line: 'Teddy chews the air with great seriousness. Gwinn checks the empty bowl for crumbs anyway.' },
  { id: 'popcorn', name: 'Popcorn', price: 2, line: 'Teddy catches every kernel but one. That one belongs to Gwinn now.' },
  { id: 'rings', name: 'Teddy O’s', price: 3, line: 'Teddy crunches his namesake O’s and looks proud of the round little holes.' },
  { id: 'bone', name: 'Crunchy bone', price: 5, line: 'Crunch! Teddy trots off with it, ears perfectly even.' },
  {
    id: 'jerky',
    name: 'Gwinny Snaps',
    price: 8,
    line: 'Gwinn snaps the whole strip out of the air, shakes it twice and looks around for witnesses. Teddy does the victory hop for her.',
  },
  { id: 'cake', name: 'Birthday cupcake', price: 12, line: 'Teddy eats the cupcake in one gulp and asks whose birthday it is. Gwinn says it is his.' },
];

export const treatById = (id: string): Treat | undefined => TREATS.find((t) => t.id === id);
