// STUB (section agent S4): the character spotlight (Teddy, Gwinn, Doc Leo, THE CHEZ, the Klown
// Klub, Mystery Robot Joe, Watt and others, from cast/castData.ts) and a note on the history
// easter eggs hidden in the games ("look for…", never where). Links go:route/cast, go:play/<id>.
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const SPOTLIGHT: MagSection = {
  id: 'spotlight',
  title: 'Character Spotlight',
  blurb: 'Teddy, Gwinn, Doc Leo, THE CHEZ and friends, and the history hidden in the games',
  dept: 'SPOTLIGHT',
  pages: () => [
    stubPage('Character Spotlight', ['Teddy, Gwinn, Doc Leo, THE CHEZ, the Klown Klub and more']),
    stubPage('History in the games', ['The easter eggs that nod to computing history: what to look for']),
  ],
};
