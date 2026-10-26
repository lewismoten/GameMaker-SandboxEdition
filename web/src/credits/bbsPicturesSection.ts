// Credits, "Pictures on the BBS": every picture the Sandbox BBS's GIF Gallery and The Sofa's GIF
// area offer (retro/bbs/gallery.ts), as a thumbnail with who made it (bbsPictureCredits.ts), and
// every one of them downloading here at once, at a 1990s modem's speed (modemSheet.ts): what
// these pictures are on the boards to show.
import './bbsPictures.css';
import { h } from '../editor/core/ui';
import { commas } from '../retro/dos/vfs';
import { formatLabel, GALLERY, SOFA_GIFS, type GalleryFile } from '../retro/bbs/gallery';
import { PICTURE_CREDITS, thumbOf } from './bbsPictureCredits';
import { modemSheet } from './modemSheet';
import { section, more } from './section';

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
  );
}

/** A board: its pictures as a contact sheet, filling in as they download, and each one's credit behind a disclosure. */
const board = (sheet: ReturnType<typeof modemSheet>, id: string, title: string, intro: string, files: GalleryFile[]) =>
  h(
    'div',
    { class: 'bbs-board' },
    h('h3', { id }, title),
    h('p', null, intro),
    h('ul', { class: 'bbs-sheet', 'aria-label': `${title}: pictures downloading at modem speed` }, ...files.map((f) => sheet.tile(f))),
    more(`Who made each of the ${files.length} pictures, with sizes and descriptions`, h('div', { class: 'bbs-pics' }, ...files.map(picture))),
  );

export function bbsPicturesSection(): HTMLElement {
  const sheet = modemSheet([...GALLERY, ...SOFA_GIFS], (f) => PICTURE_CREDITS[f.name].alt);
  return section(
    'credits-bbs-pictures',
    'Pictures on the BBS',
    'Every picture you can download from the desk’s two BBSes, and who made it. They are there to show what downloading a picture by modem was like, so here they all download at once, each at a 1990s modem’s speed: try 2,400 or 14,400 bps.',
    h(
      'p',
      null,
      'The photos are Lewis’s own, except CHEZTED.GIF and THECHEZ2.GIF, one shot of Lewis holding Teddy in front of THE\u00a0CHEZ, which Nicky Foster of the Front Royal-Warren County Chamber of Commerce took as a promotional photo of Lewis as a sponsor of its upcoming Revitalize or Die Civic Pride Workshop, and COLONIAL.GIF, Lewis in colonial dress beside George Washington, which Todd Jones, Director of Technology for the County of Warren, took at a Warren County VA250 event, a flag retirement ceremony. The Bard of Bizarre’s logo was made with DeepAI. Interlaced GIFs arrive in coarse bands that fill in pass by pass; a progressive JPEG sharpens scan by scan; the others draw top to bottom.',
    ),
    sheet.controls,
    h(
      'div',
      { class: 'bbs-boards' },
      board(
        sheet,
        'credits-bbs-sandbox',
        'The Sandbox BBS: GIF Gallery',
        'The SysOp’s snapshots, THE\u00a0CHEZ’s among them, mostly sized for a 320x200 VGA screen.',
        GALLERY,
      ),
      board(sheet, 'credits-bbs-sofa', 'The Sofa: GIF Pictures', 'What Doc Leo uploaded: the hobo clown, and the Bard of Bizarre’s logo.', SOFA_GIFS),
    ),
  );
}
