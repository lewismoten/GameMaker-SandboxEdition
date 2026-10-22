// The Bard of Bizarre: Lewis "Lewie" Moten III's name for his songs (starting with Christian ones), sung as his
// hobo clown Doc Leo. Games built from those songs (../games/<id>/about.json "series":
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
