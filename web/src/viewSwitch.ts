// The Desk | DOS | Web switch in all three views' headers: the 1994 desk and today's web (both
// index.html, main.ts) and DOS Game-Maker on its own page (dos.html, dosPage/). The game in
// front of you comes along where the other view can show it: a catalog game opens in Game-Maker
// on the DOS page (dos.html?game=<id>), goes in the desk's drive A: (#/desk?disk=cd:<id>), or
// is shown on today's home page (#/game/cd:<id>); a game of your own goes to the desk's drive
// or opens in today's editor (#/p/<id>).
import './viewSwitch.css';
import { h } from './editor/core/ui';

export type View = 'desk' | 'dos' | 'web';

/** What is in front of you: a catalog game's id (cd:<id>) or your own game's (project:<id>), as the desk's disks name them. */
export type Showing = string | undefined;

const VIEWS: [view: View, label: string, name: string, title: string][] = [
  ['desk', 'Desk', '1994 desk', 'The 1994 desk: the PC, the disk box, the shelf of games'],
  ['dos', 'DOS', 'DOS Game-Maker', 'DOS Game-Maker on its own: straight into Game-Maker on the 1994 PC'],
  ['web', 'Web', 'Today’s web', 'Today’s web: the game list and the editors'],
];

/** The address of each view, showing `showing` where it can. */
export function viewHref(view: View, showing: Showing): string {
  const cd = showing?.startsWith('cd:') ? showing.slice(3) : undefined;
  const mine = showing?.startsWith('project:') ? showing.slice(8) : undefined;
  if (view === 'dos') return `./dos.html${cd ? `?game=${encodeURIComponent(cd)}` : ''}`;
  if (view === 'desk') return `./#/desk${showing ? `?disk=${encodeURIComponent(showing).replace(/%3A/gi, ':')}` : ''}`;
  return cd ? `./#/game/cd:${encodeURIComponent(cd)}` : mine ? `./#/p/${encodeURIComponent(mine)}` : './#/';
}

/**
 * The switch: a link per view, the current one marked (aria-current="true"). `showing` says
 * what is in front of you when a link is used; `go` switches without loading a page (the desk
 * and today's web share index.html), given the address it would have gone to.
 */
export function viewSwitch(current: View, showing: () => Showing, go: Partial<Record<View, (href: string) => void>> = {}): HTMLElement {
  return h(
    'nav',
    { class: 'view-switch', 'aria-label': 'View' },
    ...VIEWS.map(([view, label, name, title]) => {
      const a = h('a', { href: viewHref(view, undefined), 'aria-label': name, title, dataset: { view } }, label);
      if (view === current) {
        // the view you are in ("true", not "page": today's web has pages of its own). Web still
        // goes to the game list from a page of it (the Credits, the Guide, an editor), and does
        // nothing only on the list itself; the desk and the DOS page are one page each.
        a.setAttribute('aria-current', 'true');
        a.addEventListener('click', (e) => {
          if (view !== 'web' || /^#?\/?(\?.*)?$/.test(location.hash)) e.preventDefault();
        });
        return a;
      }
      // the address follows what is showing (for opening it in a new tab, too)
      const update = () => (a.href = viewHref(view, showing()));
      a.addEventListener('pointerenter', update);
      a.addEventListener('focus', update);
      a.addEventListener('click', (e) => {
        update();
        const to = go[view];
        if (!to || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        to(a.getAttribute('href')!);
      });
      return a;
    }),
  );
}
