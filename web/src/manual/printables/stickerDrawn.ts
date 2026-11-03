// Sticker pictures drawn in code rather than cut from a game's files (StickerSpec.drawn): the silver
// tiara, in the shapes of Lady Regina's in Tune-Up (games/tuneup/src/art/chicken.ts: a band with three
// points and a pink jewel), but silver, as a sticker of its own.
import { h } from '../../editor/core/ui';

/** O outline, H shine, S silver, D shade, P the pink jewel. */
const TIARA = [
  '.......O.......',
  '......OHO......',
  '.O....OSO....O.',
  'OHO..OHSDO..OHO',
  'OSO.OHSSSDO.OSO',
  'OSOOHSSSSSDOOSO',
  'OHSSSSSPSSSSSDO',
  'OSSSSSPPPSSSSDO',
  'OOOOOOOOOOOOOOO',
];
const COLORS: Record<string, string> = { O: '#2b2f3a', H: '#ffffff', S: '#c4cad4', D: '#8a93a3', P: '#ff6fae' };

export function drawnArt(kind: 'tiara'): HTMLCanvasElement {
  const rows = kind === 'tiara' ? TIARA : [];
  const c = h('canvas', { width: rows[0].length, height: rows.length });
  const g = c.getContext('2d')!;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = COLORS[ch];
      g.fillRect(x, y, 1, 1);
    }),
  );
  return c;
}
