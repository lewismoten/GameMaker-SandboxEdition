// Credits, "Pictures on the BBS": every picture the Sandbox BBS's GIF Gallery and The Sofa's GIF
// area offer (retro/bbs/gallery.ts), as a thumbnail with who made it (bbsPictureCredits.ts), and
// a button that downloads it here at a 1990s modem's speed (modemTransfer.ts): what these
// pictures are on the boards to show.
import './bbsPictures.css';
import { h } from '../editor/core/ui';
import { commas } from '../retro/dos/vfs';
import { formatLabel, GALLERY, SOFA_GIFS, type GalleryFile } from '../retro/bbs/gallery';
import { PICTURE_CREDITS, thumbOf } from './bbsPictureCredits';
import { downloadPicture } from './modemTransfer';
import { section } from './section';

function picture(f: GalleryFile): HTMLElement {
  const { alt, credit } = PICTURE_CREDITS[f.name];
  return h(
    'figure',
    { class: 'bbs-pic' },
    h('img', { src: thumbOf(f.name), alt, loading: 'lazy', decoding: 'async' }),
    h(
      'figcaption',
      null,
      h('b', null, f.name),
      h('span', { class: 'bbs-pic-facts' }, `${commas(f.bytes)} bytes · ${f.width}x${f.height} ${formatLabel(f)}`),
      h('span', null, f.desc),
      h('span', { class: 'bbs-pic-credit' }, credit),
    ),
    h('button', { type: 'button', onclick: () => downloadPicture(f, alt) }, 'Download at modem speed', h('span', { class: 'sr-only' }, ` (${f.name})`)),
  );
}

const board = (id: string, title: string, intro: string, files: GalleryFile[]) => [
  h('h3', { id }, title),
  h('p', null, intro),
  h('div', { class: 'bbs-pics' }, ...files.map(picture)),
];

export function bbsPicturesSection(): HTMLElement {
  return section(
    'credits-bbs-pictures',
    'Pictures on the BBS',
    'Every picture you can download from the desk’s two BBSes, and who made it. They are there to show what downloading a picture by modem was like: try one at 2,400 or 14,400 bps.',
    h(
      'p',
      null,
      'The photos are Lewis’s own, except CHEZTED.GIF and THECHEZ2.GIF, one shot of Lewis holding Teddy in front of THE CHEZ, which Nicky Foster took at the Front Royal-Warren County Chamber of Commerce, at the Revitalize or Die Civic Pride Workshop that Lewis sponsored. The Bard of Bizarre’s logo was made with DeepAI. Interlaced GIFs arrive in coarse bands that fill in pass by pass; a progressive JPEG sharpens scan by scan; the others draw top to bottom.',
    ),
    ...board('credits-bbs-sandbox', 'The Sandbox BBS: GIF Gallery', 'The SysOp’s snapshots, sized for a 320x200 VGA screen.', GALLERY),
    ...board('credits-bbs-sofa', 'The Sofa: GIF Pictures', 'Doc Leo’s 640x480 interlaced GIFs.', SOFA_GIFS),
  );
}
