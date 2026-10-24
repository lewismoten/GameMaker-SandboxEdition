// STUB (section agent S5): the BBS listings. The boards TERMINAL dials (retro/bbs/), their numbers,
// speeds and what each is known for, and a "how to call" sidebar. Links go:bbs (the desk's TERMINAL,
// or dos.html?run=bbs on the web) and go:desk/modem.
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const BBS_LISTINGS: MagSection = {
  id: 'bbs',
  title: 'BBS Listings',
  blurb: 'The boards to call in the 412, and how to call them',
  dept: 'BBS LISTINGS',
  pages: () => [
    stubPage('BBS Listings', ['The boards, their numbers and speeds']),
    stubPage('Calling a BBS', ['How to call: the modem, TERMINAL, line speeds']),
  ],
};
