// A little trophy of Teddy: once the felt eggs of all three of his adventures are found, a
// figurine of him (the cast stage's Teddy, facing you: public/cast/sprites.json) stands on a
// wooden plinth with a brass plate, in the shadow box beside the eggs (eggDisplay.ts) and on
// those three eggs' cards in the viewer (eggViewer.ts); EGG.EXE says so too.

/** The games whose felt eggs earn it, in order. */
export const TEDDY_GAMES = ['teddy', 'teddy2', 'teddy3'] as const;

/** Its caption, wherever it shows. */
export const TROPHY_CAPTION = 'A little trophy of Teddy, for finding the felt eggs in all three of his adventures';

/** Has every Teddy adventure's felt egg been found? (`found`: the games whose eggs are.) */
export const hasTeddyTrophy = (found: Iterable<string>): boolean => {
  const have = new Set(found);
  return TEDDY_GAMES.every((g) => have.has(g));
};

/** Teddy facing you, 20 x 16: frame 4 of the cast stage's sprite (sprites.json "teddy"). */
export const TEDDY_FIGURE = {
  w: 20,
  h: 16,
  colors: ['201018', '7d2d10', 'be6939', 'df8a4d', 'ffaa61', 'd2b2ae', 'fff3ef', 'e78eb6', 'ff7d96'],
  frame:
    'AAAAAgAAAAAAAAAAAAACAAAAAAAAAAIIAgAAAAAAAAAAAggCAAAAAAAAAggEAgAAAAAAAAIECAIAAAAAAAACBAQEAgICAgICBAQEAgIAAAAAAAACBAUEBAQEBAQFBAQCAAAAAAAAAAIEBAEEBAQEAQQEAgAAAAAAAAACBAQEBwcHBwcHBAQEAgAAAAAAAAIEBAcHBwEBBwcHBAQCAAAAAAAAAAIHBwcHCQkHBwcHAgAAAAAAAAAAAAIHBwcJCQcHBwIAAAAAAAAAAAACBAcHBwcHBwcHBAIAAAAAAAAAAgQEBAcHBwcHBwQEBAIAAAAAAAACBAQEBwcHBwcHBAQEAgAAAAAAAAIEBAcHBwcHBwcHBAQCAAAAAAAAAgcHAgcHBwcHAgcHAgAAAAAAAAAAAgIAAgICAgICAAICAAAAAAA=',
};

/**
 * Draws the trophy into a w x h box (about 3 : 4) of `g`: Teddy pixel for pixel, standing on
 * a two-step plinth of dark wood with a brass plate that says TEDDY 1 2 3.
 */
export function drawTeddyTrophy(g: CanvasRenderingContext2D, w: number, h: number): void {
  const { w: fw, h: fh, colors, frame } = TEDDY_FIGURE;
  const bytes = Uint8Array.from(atob(frame), (ch) => ch.charCodeAt(0));
  // the plinth takes the bottom third; Teddy stands on it, as big as whole pixels allow
  const baseH = Math.round(h * 0.34);
  const px = Math.max(1, Math.floor(Math.min(w / (fw + 2), (h - baseH) / fh)));
  const fx = Math.round((w - fw * px) / 2);
  const fy = h - baseH - fh * px;
  for (let y = 0; y < fh; y++)
    for (let x = 0; x < fw; x++) {
      const v = bytes[y * fw + x];
      if (!v) continue;
      g.fillStyle = `#${colors[v - 1]}`;
      g.fillRect(fx + x * px, fy + y * px, px, px);
    }
  // the plinth: a narrow top step and a wider foot, dark stained wood with a lighter edge
  const top = h - baseH;
  const stepW = Math.round(w * 0.78);
  const stepH = Math.round(baseH * 0.3);
  g.fillStyle = '#5a3216';
  g.fillRect((w - stepW) / 2, top, stepW, stepH);
  g.fillStyle = '#8a5a2b';
  g.fillRect((w - stepW) / 2, top, stepW, Math.max(1, Math.round(stepH * 0.3)));
  g.fillStyle = '#3e2210';
  g.fillRect(0, top + stepH, w, baseH - stepH);
  g.fillStyle = '#6b4220';
  g.fillRect(0, top + stepH, w, Math.max(1, Math.round((baseH - stepH) * 0.18)));
  // the brass plate
  const plateW = Math.round(w * 0.72);
  const plateH = Math.round((baseH - stepH) * 0.56);
  const plateX = Math.round((w - plateW) / 2);
  const plateY = Math.round(top + stepH + (baseH - stepH - plateH) / 2 + (baseH - stepH) * 0.06);
  g.fillStyle = '#c9a03a';
  g.fillRect(plateX, plateY, plateW, plateH);
  g.fillStyle = '#f2d77a';
  g.fillRect(plateX, plateY, plateW, Math.max(1, Math.round(plateH * 0.2)));
  g.fillStyle = '#3e2a08';
  g.font = `bold ${Math.max(4, Math.round(plateH * 0.62))}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('TEDDY 1·2·3', w / 2, plateY + plateH * 0.56, plateW - 2);
}
