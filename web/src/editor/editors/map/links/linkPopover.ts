// A link marker's details, in a small panel beside it (linkMarkers.ts opens it). A way in shows
// where it comes from: the title screen for the game's start (scene 0's link), else the other
// level's map round its exit; with where it comes from, where it lands and Remove. An exit shows
// where it leads: the next level's map round the block the hero arrives on, or the Game won
// screen; with where it leads, its blocks and Delete. Pictures are the integrator's
// (integratorArt.ts) and every change goes through the markers' LinkEditor.
import { h, clear, confirmDialog, numberField, selectField, toast } from '../../../core/ui';
import { ADVTYPE, STARTTYPE, type Game, type Point } from '../../../../formats/game';
import { MLEN, MWID } from '../../../../formats/map';
import { graphicShot, levelShot } from '../../integrator/integratorArt';
import { pickOnMap } from '../../integrator/pickOnMap';
import { moveSource, removeLink, retarget, setFrom, setTo } from '../../integrator/linkEdits';
import { sceneName, sourceName } from '../../integrator/linkSpots';
import type { LinkEditor } from './linkMarkers';
import type { Marker } from './markerMath';

interface PopoverHooks {
  find(key: string): Marker | undefined;
  anchor(key: string): HTMLElement | undefined;
  closed(): void;
}

let seq = 0;

export function linkPopover(ed: LinkEditor, startKey: string, hooks: PopoverHooks): { close(): void; refresh(): void } {
  const { project } = ed;
  let key = startKey;
  const id = `lk-pop-${++seq}`;
  const body = h('div', { class: 'lk-pop-body' });
  const title = h('h2', { id: `${id}-t`, class: 'lk-pop-title' });
  const pop = h(
    'div',
    { class: 'lk-pop', role: 'dialog', 'aria-labelledby': `${id}-t`, tabIndex: -1 },
    h(
      'div',
      { class: 'lk-pop-head' },
      title,
      h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => close() }, '×'),
    ),
    body,
  );
  document.body.append(pop);

  const levels = (g: Game): [number, string][] =>
    g.scenes.flatMap((s, i) => (s.gametype === ADVTYPE ? [[i, `${i}: ${sceneName(g, i)}`] as [number, string]] : []));
  const shot = (c: HTMLCanvasElement | undefined, alt: string, none: string) =>
    h(
      'figure',
      { class: 'lk-pop-shot' },
      c ? Object.assign(c, { className: 'pixel', role: 'img', ariaLabel: alt }) : h('div', { class: 'lk-pop-none' }, none),
      c ? h('figcaption', { class: 'meta' }, alt) : null,
    );
  /** x and y of a block, with ⌖ to pick it on `scene`'s map. */
  const blockFields = (label: string, p: Point, scene: number, set: (at: Point) => void, f: string) =>
    h(
      'div',
      { class: 'lk-pop-xy', role: 'group', 'aria-label': label },
      h('span', { class: 'lk-pop-label' }, label),
      field(
        `${f}-x`,
        numberField(
          'x',
          () => p.x,
          (x) => set({ x, y: p.y }),
          { min: 0, max: MLEN - 1, title: `${label}: x` },
        ),
      ),
      field(
        `${f}-y`,
        numberField(
          'y',
          () => p.y,
          (y) => set({ x: p.x, y }),
          { min: 0, max: MWID - 1, title: `${label}: y` },
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'lk-pop-pick',
          dataset: { f },
          'aria-label': `${label}: pick on ${sceneName(project.game(), scene)}’s map`,
          title: `Pick on ${sceneName(project.game(), scene)}’s map`,
          disabled: ed.locked,
          onclick: async () => {
            const at = await pickOnMap(project, project.game(), scene, p, `${label}: click a map block`);
            if (at) set(at);
          },
        },
        '⌖',
      ),
    );

  function render(): void {
    const m = hooks.find(key);
    if (!m) return close(false);
    const g = project.game();
    const focused = (document.activeElement as HTMLElement | null)?.closest('[data-f]')?.getAttribute('data-f');
    if (m.kind === 'in') {
      const w = m.way;
      const link = g.scenes[w.from].links[w.link];
      const fromTitle = w.from === 0 && g.scenes[0]?.gametype === STARTTYPE;
      title.textContent = m.start ? 'Where the game starts' : `Way in from ${sourceName(g, w)}`;
      const sources: [number, string][] = [
        ...(g.scenes[0]?.gametype === STARTTYPE && (fromTitle || g.scenes[0].links[0].toScene === 0xffff)
          ? [[0, 'The title (where the game starts)'] as [number, string]]
          : []),
        ...levels(g),
      ];
      clear(
        body,
        fromTitle
          ? shot(graphicShot(project.files, g.scenes[0].files[0] ?? ''), 'The title screen, where play starts', 'No title picture')
          : shot(
              levelShot(project.files, g.scenes[w.from], link.from, 8, 5),
              `${sceneName(g, w.from)} round its exit at ${link.from.x},${link.from.y}`,
              `${sceneName(g, w.from)} has no map`,
            ),
        h(
          'p',
          { class: 'hint' },
          fromTitle
            ? 'Choosing Play on the menu brings the hero here (the start scene’s link).'
            : `Touching block ${link.from.x},${link.from.y} in ${sceneName(g, w.from)} brings the hero here.`,
        ),
        field(
          'src',
          selectField(
            'Comes from',
            sources,
            () => w.from,
            async (to) => {
              if (
                m.start &&
                to !== 0 &&
                !(await confirmDialog(
                  'Move the start',
                  `The game would have nowhere to start: this link would become an exit of ${sceneName(g, to)}. Move it?`,
                  'Move',
                ))
              )
                return render();
              // the link's key changes with its scene: known before the change redraws the panel
              const at = moveSource(structuredClone(g), w.from, w.link, to);
              if (at < 0) return toast(`${sceneName(g, to)} has no free link left.`, 'error');
              key = `in:${to}:${at}`;
              ed.edit(`src:${key}`, (game) => moveSource(game, w.from, w.link, to));
            },
          ),
        ),
        fromTitle ? null : blockFields('Leaves from', link.from, w.from, (at) => ed.edit(`from:${key}`, (game) => setFrom(game, w.from, w.link, at)), 'from'),
        field(
          'dst',
          selectField(
            'Arrives in',
            levels(g),
            () => w.to,
            (to) => {
              ed.edit(`dst:${key}`, (game) => retarget(game, w.from, w.link, to));
              if (!ed.scenes.includes(to)) toast(`That link now lands in ${sceneName(project.game(), to)}, off this map.`);
            },
          ),
        ),
        blockFields('Arrives at', link.to, w.to, (at) => ed.edit(`to:${key}`, (game) => setTo(game, w.from, w.link, at)), 'to'),
        actions(m.start ? 'Remove the start' : 'Remove this way in', async () => {
          if (m.start && !(await confirmDialog('Remove the start', 'Without this link the game has nowhere to start. Remove it?', 'Remove'))) return;
          ed.edit(`rm:${key}`, (game) => removeLink(game, w.from, w.link));
        }),
      );
    } else {
      const e = m.exit;
      const link = g.scenes[e.scene].links[e.link];
      const won = e.ending === 'won';
      title.textContent = won ? `Exit ${e.link + 1}: wins the game` : `Exit ${e.link + 1} to ${sceneName(g, e.to)}`;
      clear(
        body,
        won
          ? shot(graphicShot(project.files, g.scenes[1]?.files[0] ?? ''), 'The Game won screen', 'Game won: no picture (its song plays, then the high scores)')
          : e.ending === 'odd'
            ? h('p', { class: 'callout' }, `Scene ${e.to} isn’t a level, so play would stop here. Point it at a level or Game won.`)
            : shot(
                levelShot(project.files, g.scenes[e.to], link.to, 8, 5),
                `${sceneName(g, e.to)} round where the hero arrives, ${link.to.x},${link.to.y}`,
                `${sceneName(g, e.to)} has no map`,
              ),
        e.shadowedBy !== undefined
          ? h('p', { class: 'callout' }, `Exit ${e.shadowedBy + 1} is on the same block and is always taken first, so this one never is. Move one of them.`)
          : null,
        field(
          'dst',
          selectField(
            'Leads to',
            [...levels(g), [1, 'Game won']],
            () => e.to,
            (to) => ed.edit(`dst:${key}`, (game) => retarget(game, e.scene, e.link, to)),
          ),
        ),
        blockFields('Leaves from', link.from, e.scene, (at) => ed.edit(`from:${key}`, (game) => setFrom(game, e.scene, e.link, at)), 'from'),
        won ? null : blockFields('Arrives at', link.to, e.to, (at) => ed.edit(`to:${key}`, (game) => setTo(game, e.scene, e.link, at)), 'to'),
        actions('Delete this exit', () => ed.edit(`rm:${key}`, (game) => removeLink(game, e.scene, e.link))),
      );
    }
    if (ed.locked) for (const c of body.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button')) c.disabled = true;
    if (focused) body.querySelector<HTMLElement>(`[data-f="${focused}"] input, [data-f="${focused}"] select, button[data-f="${focused}"]`)?.focus();
    position();
  }

  /** A field, tagged so it keeps the keyboard when the panel is drawn again. */
  function field(f: string, el: HTMLElement): HTMLElement {
    el.dataset.f = f;
    return el;
  }

  function actions(label: string, run: () => void | Promise<void>): HTMLElement {
    return h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'danger', dataset: { f: 'rm' }, onclick: () => void run() }, label));
  }

  function position(): void {
    const a = hooks.anchor(key)?.getBoundingClientRect();
    const w = Math.min(320, innerWidth - 16);
    pop.style.width = `${w}px`;
    const hh = pop.offsetHeight;
    let left = a ? a.right + 8 : (innerWidth - w) / 2;
    if (a && left + w > innerWidth - 8) left = a.left - w - 8;
    left = Math.max(8, Math.min(innerWidth - w - 8, left));
    const top = Math.max(8, Math.min(innerHeight - hh - 8, a ? a.top - 20 : 80));
    Object.assign(pop.style, { left: `${left}px`, top: `${top}px` });
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    close();
  };
  // a click anywhere else closes it (not in a dialog it opened, such as the map to pick on)
  const outside = (e: PointerEvent) => {
    const t = e.target as Element;
    if (!pop.contains(t) && !t.closest?.('dialog[open]') && !t.closest?.('.lk-mark')) close(false);
  };
  pop.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', outside, true);
  addEventListener('resize', position);

  let open = true;
  function close(refocus = true): void {
    if (!open) return;
    open = false;
    document.removeEventListener('pointerdown', outside, true);
    removeEventListener('resize', position);
    pop.remove();
    hooks.closed();
    if (refocus) hooks.anchor(key)?.focus({ preventScroll: true });
  }

  render();
  pop.querySelector<HTMLElement>('select, input')?.focus({ preventScroll: true });
  return { close: () => close(false), refresh: () => open && render() };
}
