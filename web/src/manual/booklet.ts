// A page of a paper manual (dosManual.ts builds them; printables/viewer.ts shows them in the
// "What's in the box" tray and prints them).
export interface BookletPage {
  /** Page content (inside the margins). */
  body: HTMLElement | HTMLElement[];
  cover?: boolean;
  /** Running head text for this page (book title / chapter). */
  head?: [string, string];
}
