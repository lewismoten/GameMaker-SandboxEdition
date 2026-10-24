// The magazine's snapshot of the 1994 desk (types.ts ArtId 'desk'): a photo, not pixel art, so it
// is drawn smooth in a white print border (deskShot.css). The picture is
// public/magazine/desk-1994.webp, 1600 x 950.
//
// To take it again: run the dev server on a spare port (`npx vite --port 5425 --strictPort` in
// web/), then with playwright-core (channel 'chrome') open a fresh browser context (no felt eggs
// found, so no secret box on the shelf) at 1600 x 1000, light, its clock fixed on a winter afternoon
// (`page.clock.setFixedTime(new Date('2026-12-11T13:00:00'))`, so the window shows day), on
// `#/desk?disk=cd:snowbound&run=play`; wait about 20 s for Snowbound's title screen, hide
// `.idx-card, .drive-actions` with a style tag, move the mouse to a corner, and screenshot with
// `clip: { x: 0, y: 50, width: 1600, height: 950 }` (the site header cropped off). Then
// `cwebp -q 78 -m 6 desk-1994.png -o web/public/magazine/desk-1994.webp` (about 130 KB).
import './deskShot.css';
import { h } from '../../editor/core/ui';

const DESK_SHOT = { src: './magazine/desk-1994.webp', w: 1600, h: 950 };

/** The desk's photo, for an `art` block. */
export const deskShotImg = (alt: string): HTMLImageElement =>
  h('img', { src: DESK_SHOT.src, alt, width: DESK_SHOT.w, height: DESK_SHOT.h, class: 'mag-desk-shot' });
