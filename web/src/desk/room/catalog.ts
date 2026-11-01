// The paper shareware catalog on the desk: every shareware game made with Game-Maker,
// with how to get it (the BBS) and the author's registration notice.
import { h, clear } from '../../editor/core/ui';
import { focusInto } from '../overlayFocus';
import { creditLine, type CatalogEntry } from '../../project/files';
import { sizeText, storageLine, zipBytes, zipName } from '../../project/diskFacts';
import { decorateBbsName } from '../../retro/bbs/bbsName';
import { epubControl } from '../../manual/epub/save';

const STYLE = `
.paper-catalog { width: min(1040px, 100%); max-height: 86vh; overflow: auto; padding: 18px 30px 26px;
  background: #f3eedc; color: #1d1a14; box-shadow: 0 20px 40px rgba(0,0,0,.6);
  font: 15px/1.3 'Times New Roman', Times, Georgia, serif; }
.paper-catalog .masthead { border-top: 8px solid #1d1a14; padding-top: 6px; margin-bottom: 14px; text-align: center; }
.paper-catalog h2 { margin: 0; font: 400 42px/1.05 'Times New Roman', Times, serif; letter-spacing: -.01em; }
.paper-catalog .masthead p { margin: 2px 0 0; font-style: italic; }
.paper-catalog h3 { margin: 12px 0 6px; padding-bottom: 2px; border-bottom: 2px solid #1d1a14; font: 700 22px/1.1 'Times New Roman', Times, serif; }
.paper-catalog .cols { column-width: 15.5em; column-count: 3; column-gap: 26px; text-align: justify; hyphens: auto; }
.paper-catalog .item { margin: 0 0 11px; break-inside: avoid-column; }
.paper-catalog .item p { margin: 0; }
.paper-catalog .disk { font: 700 12px/1 'Courier New', ui-monospace, monospace; border: 1px solid #1d1a14; padding: 1px 4px; margin-right: 5px; white-space: nowrap; }
.paper-catalog .title { font-weight: 700; }
.paper-catalog .tech { color: #4a4332; font-size: 13px; }
.paper-catalog .got { color: #0a6b25; font-weight: 700; }
.paper-catalog .order { margin-top: 14px; padding: 10px 14px; border: 3px double #1d1a14; display: grid; grid-template-columns: repeat(auto-fit, minmax(15em, 1fr)); gap: 8px 26px; }
.paper-catalog .order h3 { grid-column: 1 / -1; margin: 0; }
.paper-catalog .order p { margin: 0; }
.paper-catalog .form { font: 13px/1.5 'Courier New', ui-monospace, monospace; border: 1px solid #1d1a14; padding: 6px 10px; background: #fff9e6; }
.paper-catalog button { font: 700 13px 'Courier New', monospace; min-height: 24px; padding: 2px 8px; margin: 4px 6px 0 0;
  border: 1px solid #1d1a14; background: #fff9e6; color: #1d1a14; border-radius: 0; cursor: pointer; text-align: left; }
.paper-catalog pre { white-space: pre-wrap; max-height: 260px; overflow: auto; background: #fff9e6; padding: 8px; border: 1px solid #c8bfa4; font-size: 12px; text-align: left; }
@media (max-width: 700px) { .paper-catalog { padding: 12px 14px 20px; } .paper-catalog h2 { font-size: 32px; } .paper-catalog .cols { column-count: 1; column-width: auto; text-align: left; hyphens: manual; } }
`;

/** Every disk costs the same; the author's own fee is separate (see each notice). */
const DISK_PRICE = '$5 a disk';

/** What the game needs for sound: Sound Blaster only if it has .voc samples or .cmf music. */
export function soundLine(g: CatalogEntry): string {
  const voc = g.files.some((f) => f.endsWith('.voc'));
  const cmf = g.files.some((f) => f.endsWith('.cmf'));
  if (voc && cmf) return 'VGA · Sound Blaster sound & music optional';
  if (voc) return 'VGA · Sound Blaster sound optional';
  if (cmf) return 'VGA · Sound Blaster music optional';
  return 'VGA · PC speaker sound';
}

interface CatalogActions {
  callBbs(): void;
  downloaded(id: string): boolean;
}

export function openCatalog(entries: CatalogEntry[], actions: CatalogActions): Promise<void> {
  return new Promise((resolve) => {
    const games = entries.filter((g) => g.kind === 'shareware' && g.gam);
    // disk numbers follow the catalog order; two sections by what the author asks
    const disk = new Map(games.map((g, i) => [g.id, i + 1]));
    const sections = [
      { name: 'Freeware Games', games: games.filter((g) => g.price === 'Freeware') },
      { name: 'Shareware Games', games: games.filter((g) => g.price !== 'Freeware') },
    ].filter((sec) => sec.games.length);
    let back = () => {};
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      back();
      resolve();
    };
    // The catalog is on top: keys must not also reach the PC (Esc would quit the program).
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey, true);
    // the catalog as an e-book, with each game's notice in full
    const epub = epubControl();
    epub.use({ file: 'shareware-catalog.epub', make: () => import('../../manual/epub/sharewareCatalogBook').then((m) => m.sharewareCatalogEpub(games)) });
    const paper = h(
      'article',
      { class: 'paper-catalog', 'aria-label': 'Shareware catalog' },
      h('style', null, STYLE),
      h(
        'div',
        { class: 'masthead' },
        h('h2', null, 'Shareware Catalog'),
        h('p', null, `Games made with GAME-MAKER  ·  Winter 1994  ·  ${games.length} titles on ${games.length} disks`),
        h('p', null, 'Try them free. If you like one, register it with its author — see each game’s notice.'),
        epub.el,
      ),
      ...sections.map((sec) =>
        h(
          'section',
          { 'aria-label': sec.name },
          h('h3', null, sec.name),
          h(
            'div',
            { class: 'cols' },
            ...sec.games.map((g) => {
              const notice = h('div');
              const fee = g.price === 'Freeware' ? 'Freeware.' : g.price ? `Register: ${g.price}.` : 'Shareware.';
              return h(
                'div',
                { class: 'item' },
                h(
                  'p',
                  null,
                  h('span', { class: 'disk' }, `DISK ${String(disk.get(g.id)).padStart(2, '0')}`),
                  h('span', { class: 'title' }, g.title),
                  ': ',
                  g.blurb ? `${g.blurb} ` : '',
                  actions.downloaded(g.id) ? h('span', { class: 'got' }, '✓ on your hard disk. ') : null,
                  `${creditLine(g) || 'Author unknown'}. ${fee} ${DISK_PRICE}.`,
                ),
                // what a buyer weighed first: the disks (or the ZIP on a BBS) and the room on the hard disk
                h('p', { class: 'tech' }, `${soundLine(g)}. ${storageLine(g)}. BBS: ${zipName(g)}, ${sizeText(zipBytes(g))}.`),
                h(
                  'button',
                  {
                    onclick: (e: Event) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      if (notice.childElementCount) clear(notice);
                      else clear(notice, h('pre', null, g.notice || 'Shareware. Copyrighted by its author.'));
                      btn.textContent = notice.childElementCount ? 'Hide author’s notice' : 'Author’s notice & registration';
                    },
                  },
                  'Author’s notice & registration',
                ),
                notice,
              );
            }),
          ),
        ),
      ),
      h(
        'div',
        { class: 'order' },
        h('h3', null, 'Ordering Disks'),
        h(
          'div',
          null,
          h(
            'p',
            null,
            `Name each disk by its number and say whether you want 5.25" or 3.5". ${DISK_PRICE}; add $2 for overseas delivery. Payment by check or money order, US funds only. The author’s own registration fee is paid to the author, never to the disk library.`,
          ),
          h(
            'p',
            { style: 'margin-top:6px' },
            'Or call THE -= S A N D B O X =- BBS in Pittsburgh at 1-412-555-SAND (14,400 baud, 8-N-1). Pick File Areas, then D and the file number to download. Unzipped games land in C:\\DOWNLOAD.',
          ),
          h(
            'button',
            {
              onclick: () => {
                close();
                actions.callBbs();
              },
            },
            'Call the BBS on the PC now',
          ),
        ),
        h(
          'div',
          { class: 'form', role: 'group', 'aria-label': 'Order form' },
          h('div', null, 'ORDER FORM'),
          h('div', null, 'Disk numbers: ____________'),
          h('div', null, 'Size: [ ] 5.25"  [ ] 3.5"'),
          h('div', null, 'Send with payment to:'),
          h('div', null, 'Sandbox Disk Library'),
          h('div', null, 'P.O. Box 000'),
          h('div', null, 'Questions: 1-412-555-0155'),
        ),
      ),
    );
    decorateBbsName(paper);
    const overlay = h(
      'div',
      { class: 'desk-overlay', role: 'dialog', 'aria-label': 'Shareware catalog' },
      h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
      paper,
    );
    document.body.append(overlay);
    back = focusInto(overlay.querySelector('button.close'));
  });
}
