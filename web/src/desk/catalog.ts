// The paper shareware catalog on the desk: every shareware game made with Game-Maker,
// with how to get it (the BBS) and the author's registration notice.
import { h, clear } from '../editor/ui';
import { creditLine, type CatalogEntry } from '../project/files';

const STYLE = `
.paper-catalog { width: min(760px, 100%); max-height: 86vh; overflow: auto; padding: 28px 34px;
  background: #f3eedc; color: #1d1a14; box-shadow: 0 20px 40px rgba(0,0,0,.6);
  font: 14px/1.45 'Courier New', ui-monospace, monospace; }
.paper-catalog h2 { margin: 0; font: 700 26px/1.1 'Courier New', monospace; letter-spacing: .05em; }
.paper-catalog .masthead { border-bottom: 3px double #1d1a14; padding-bottom: 10px; margin-bottom: 14px; }
.paper-catalog .masthead p { margin: 4px 0 0; }
.paper-catalog .item { display: grid; grid-template-columns: 2.4em 1fr; gap: 4px 10px; padding: 10px 0; border-bottom: 1px dashed #9b927a; }
.paper-catalog .num { font-weight: 700; font-size: 18px; }
.paper-catalog .title { font-weight: 700; font-size: 16px; }
.paper-catalog .meta { color: #5c5440; font-size: 12px; }
.paper-catalog .got { color: #0a6b25; font-weight: 700; }
.paper-catalog .order { margin-top: 16px; padding: 12px; border: 2px solid #1d1a14; }
.paper-catalog button { font: 700 12px 'Courier New', monospace; padding: 4px 8px; margin: 6px 6px 0 0;
  border: 1px solid #1d1a14; background: #fff9e6; color: #1d1a14; border-radius: 0; cursor: pointer; }
.paper-catalog pre { white-space: pre-wrap; background: #fff9e6; padding: 10px; border: 1px solid #c8bfa4; font-size: 12px; }
`;

export interface CatalogActions {
  callBbs(): void;
  downloaded(id: string): boolean;
}

export function openCatalog(entries: CatalogEntry[], actions: CatalogActions): Promise<void> {
  return new Promise((resolve) => {
    const games = entries.filter((g) => g.kind === 'shareware' && g.gam);
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve();
    };
    // The catalog is on top: keys must not also reach the PC (Esc would quit the program).
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey, true);
    const kb = (n?: number) => (n ? `${Math.round((n * 0.58) / 1024)}K` : '');
    const paper = h(
      'article',
      { class: 'paper-catalog', 'aria-label': 'Shareware catalog' },
      h('style', null, STYLE),
      h(
        'div',
        { class: 'masthead' },
        h('h2', null, 'SHAREWARE CATALOG'),
        h('p', null, `Games made with GAME-MAKER  ·  Fall 1994  ·  ${games.length} titles`),
        h('p', null, 'Try them free. If you like one, register it with its author — see each game’s notice.'),
      ),
      ...games.map((g, i) => {
        const notice = h('div');
        return h(
          'div',
          { class: 'item' },
          h('div', { class: 'num' }, String(i + 1).padStart(2, '0')),
          h(
            'div',
            null,
            h('div', { class: 'title' }, g.title, actions.downloaded(g.id) ? h('span', { class: 'got' }, '  ✓ on your hard disk') : null),
            h('div', { class: 'meta' }, creditLine(g) || 'Author unknown'),
            h('div', { class: 'meta' }, `${(g.exe ?? g.id).replace(/\.EXE$/i, '')}.ZIP  ·  ${kb(g.bytes)}  ·  ${g.price === 'Freeware' ? 'FREEWARE' : g.price ? `Register: ${g.price}` : 'Shareware'}  ·  VGA, Sound Blaster optional`),
            g.blurb ? h('p', { style: 'margin:6px 0 0' }, g.blurb) : null,
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
          ),
        );
      }),
      h(
        'div',
        { class: 'order' },
        h('strong', null, 'HOW TO GET THEM'),
        h('p', { style: 'margin:6px 0' }, 'Call THE GAME-MAKER EXCHANGE BBS at 555-0144 (14,400 baud, 8-N-1). Pick Files, then D and the file number to download. Unzipped games land in C:\\DOWNLOAD.'),
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
    );
    const overlay = h('div', { class: 'desk-overlay', role: 'dialog', 'aria-label': 'Shareware catalog' }, h('button', { class: 'close', onclick: close }, 'Close (Esc)'), paper);
    document.body.append(overlay);
  });
}
