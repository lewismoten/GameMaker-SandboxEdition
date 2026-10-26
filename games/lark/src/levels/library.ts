// Closing Time: the Tiny Pockets Library behind The Dog House's red door, by lamplight. The
// storybook on the reading rug (a tin woodman who walked a long road for a heart), Joe's
// workbench with the last tin hearts he made, and the little red door, which opens once he has
// been to the workbench (counter `ready`).
import type { BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const LIBRARY_ROWS = [
  'PPPPPPPPPWPPPPPPPWPPPPPP',
  'PSsSs.SsSs.SsSs.SsSs...P',
  'P......................P',
  'PsSsS.sSsS.sSsS.sSsS...P',
  'P................QH....P',
  'P................b.....P',
  'P.RRRRRR...............P',
  'P.RRkRRR.....DDL.......P',
  'P.RRRRRR...............P',
  'P..........@...........P',
  'PPPPPPPPPPPGPPPPPPPPPPPP',
];

export function libraryMap(set: BlockSet): Stamped {
  return stamp(
    LIBRARY_ROWS,
    {
      P: 'panel',
      W: 'window',
      S: 'shelf',
      s: 'shelf2',
      '.': 'board',
      R: 'rug',
      k: 'storybook',
      Q: 'bench',
      H: 'bench2',
      b: 'stool',
      D: 'desk',
      L: 'lamp',
      '@': 'board',
      G: 'doorShut',
    },
    set,
    'panel',
    undefined,
    'kb@G',
  );
}
