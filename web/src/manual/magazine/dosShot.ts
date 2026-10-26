// The magazine's screenshot from real DOS (types.ts ArtId 'dos-carl'): Lewis's own DOSBox
// capture of A Fly Named Carl's cover garbled by a too-big FLI chunk, for the feature on what
// his DOS testing found (sections/dosBugs.ts). It is source material from Lewis (NOTICE.md).
// The picture is public/magazine/dos-carl.webp, 638 x 398: his macOS screenshot of DOSBox
// 0.74-3-3 (752 x 540) cropped to the game screen inside the window (x 57-695, y 67-465, the
// 320 x 200 screen doubled), then `cwebp -q 78 -m 6` (about 64 KB). Drawn smooth in the
// monitor-gray bevel the magazine's screenshots wear (dosShot.css).
import './dosShot.css';
import { h } from '../../editor/core/ui';

/** Lewis's DOSBox screenshot, for an `art` block. */
export const dosShotImg = (alt: string): HTMLImageElement => h('img', { src: './magazine/dos-carl.webp', alt, width: 638, height: 398, class: 'mag-dos-shot' });
