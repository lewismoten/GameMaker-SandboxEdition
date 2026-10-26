// The four chapters the library's night is told in, two wings each, in the order the
// Reserve Stacks' gates stand. A chapter ends at its stamp desk in the Stacks, past its
// wings' gates: stepping on the desk sets the next chapter's flag (a counter) and shows the
// chapter-done page. The next chapter's doors in the reading room check that flag. The last
// chapter ends at the thirty-third book, with the won screen.
//
// Only counters 20..29 (and 3) refuse a touch that would leave them at zero, and 20..27
// count the wings' stories, so the flags are 28 and 29: chapter 2's doors want counter 28,
// chapter 3's want 29, and chapter 4's want 28 a thousand over (the third desk adds 1000).
// A desk can be stepped on again; that only raises a flag, which no door minds.
export interface Chapter {
  /** 1..4 */
  n: number;
  title: string;
  /** Wing indexes (WINGS), in play order. */
  wings: number[];
  /** What its doors check (and give back as Joe steps through): absent for chapter 1. */
  flag?: { counter: number; amount: number };
}

export const CHAPTERS: Chapter[] = [
  { n: 1, title: 'Clowns and Clones', wings: [0, 1] },
  { n: 2, title: 'Out of Doors', wings: [2, 3], flag: { counter: 28, amount: 1 } },
  { n: 3, title: 'Home After Dark', wings: [4, 5], flag: { counter: 29, amount: 1 } },
  { n: 4, title: 'Somewhere Else, Someday', wings: [6, 7], flag: { counter: 28, amount: 1000 } },
];

export const chapterOf = (wing: number): Chapter => CHAPTERS.find((ch) => ch.wings.includes(wing))!;
