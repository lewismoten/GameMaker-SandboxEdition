// STUB (section agent S7): full-page ads for the desk's hardware: the modem (its line speeds,
// retro/bbs/lineSpeed.ts), the disk box, and the speakers with the Sound Blaster switch. Each
// links go:desk/modem, go:desk/diskbox, go:desk/speakers. Brands are made up (desk/pc/).
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const HARDWARE: MagSection = {
  id: 'hardware',
  title: 'Hardware',
  toc: false,
  pages: () => [
    { ...stubPage('The modem', ['A full-page modem ad: every line speed']), kind: 'ad', title: 'Modem' },
    { ...stubPage('The disk box', ['A full-page disk box ad']), kind: 'ad', title: 'Disk box' },
    { ...stubPage('The speakers', ['A full-page speakers ad: the Sound Blaster switch']), kind: 'ad', title: 'Speakers' },
  ],
};
