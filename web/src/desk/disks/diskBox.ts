// The disk box: flip through 3.5" floppies and put one in drive A:.
import './diskBox.css';
import { h, clear } from '../../editor/core/ui';
import { focusInto } from '../overlayFocus';
import { diskCount, type Disk } from '../../retro/dos/disks';
import { creditLine } from '../../project/files';
import { gameDisks } from '../../project/diskFacts';
import { printedDiskLabel } from './diskLabel';
import { rsdDiskLabel } from './rsdLabel';
import { DISK_GROUPS, diskGroupOf, foldedGroups, groupDisks, saveFolded, type DiskGroup } from './diskGroups';
import { groupView, type GroupView } from './diskDividers';
import { isImported } from '../../editor/shell/homeOrigin';

/** How many disks it takes: an original ships with the DOS player too (as its box and every catalog say). */
export function disksIn(d: Disk): number {
  return d.kind === 'original' && d.catalog ? gameDisks(d.catalog) : diskCount(d.bytes);
}

export type DiskAction = 'play' | 'design' | 'modern';

/** A printed label, as a shareware publisher had them made (see diskLabel.ts). */
function printedLabel(d: Disk, n: number): HTMLElement {
  const g = d.catalog!;
  // © and the year kept together (a no-break space), never split across lines
  return printedDiskLabel(g, `©\u00a0${g.year ?? 1995}`, undefined, diskTag(d, n));
}

/** When a disk of the user's was last saved: "Oct 21, 2026, 3:42 PM". */
function savedAt(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Disk 2" in the title area of a game that takes more than one disk (empty otherwise). */
function diskTag(d: Disk, n: number): string {
  return disksIn(d) > 1 ? `Disk\u00a0${n}` : '';
}

/** A disk; `n` numbers the later disks of a game that takes more than one. */
export function floppyElement(d: Disk, small = false, n = 1): HTMLElement {
  const count = disksIn(d);
  const label = d.kind === 'blank' ? 'blank — for Utilities ▸ Transfer' : d.title;
  const g = d.catalog;
  // Hand-written like a real label: who made it, when, and what it cost.
  const sub =
    d.kind === 'project'
      ? ['my game', d.updated ? savedAt(d.updated) : ''].filter(Boolean).join('\n')
      : d.kind === 'blank' || d.kind === 'sample'
        ? ''
        : [g?.author ?? g?.company, [g?.year, g?.price].filter(Boolean).join('  ')].filter(Boolean).join('\n');
  return h(
    'div',
    {
      class: 'floppy',
      style: `--body:${d.color};--stripe:${d.stripe}`,
      dataset: {
        kind: d.kind,
        protected: String(d.writeProtected),
        density: d.density,
      },
      'aria-hidden': small ? 'true' : undefined,
    },
    h('div', { class: 'shutter' }),
    d.kind === 'original'
      ? printedLabel(d, n)
      : d.kind === 'sample'
        ? rsdDiskLabel(undefined, label, '')
        : d.kind === 'rsd' || d.kind === 'gameware'
          ? // the CD's disks have printed labels; hand-written ones (with a scribbled note) are the user's
            rsdDiskLabel(g, label, diskTag(d, n), d.kind === 'gameware' ? { name: g?.company ?? g?.author ?? 'CD Library', band: d.color } : undefined)
          : h(
              'div',
              { class: 'label' },
              h('span', { class: 'hand-title' }, h('span', null, label), count > 1 ? h('span', { class: 'hand-disk' }, `Disk ${n}`) : null),
              h('small', null, sub),
              d.note ? h('span', { class: 'marker-note' }, d.note) : null,
            ),
    h('div', { class: 'wp' }),
    d.density === 'HD' ? h('div', { class: 'density-hole' }) : null,
    d.density === 'HD' ? h('div', { class: 'hd' }, 'HD') : null,
  );
}

function sizeText(bytes: number): string {
  if (!bytes) return '';
  const mb = bytes / 1_048_576;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** A line about the disk: what it is, who made it, its size. */
export function diskFacts(d: Disk): string {
  return [
    d.kind === 'sample'
      ? `${d.folders?.length ?? 0} small games, each in its own folder (${(d.folders ?? []).map((f) => f.dir).join(', ')}): load one in Game-Maker`
      : d.kind === 'rsd'
        ? 'One of the games RSD made with Game-Maker'
        : d.kind === 'original'
          ? 'Shareware from Sandbox Software, this edition’s own games: play them or open them in Game-Maker'
          : d.kind === 'gameware'
            ? 'Free gameware from the Game-Maker CD'
            : d.kind === 'project'
              ? 'Your game (also in C:\\GM on the hard disk)'
              : 'A blank disk: Game-Maker’s Utilities ▸ Transfer copies a game onto it',
    d.catalog ? creditLine(d.catalog) : '',
    sizeText(d.bytes),
    disksIn(d) > 1 ? `${disksIn(d)} disks: disk 1 goes in A:` : '',
    d.updated ? `saved ${savedAt(d.updated)}` : '',
    d.writeProtected ? 'write-protected' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Opens the disk box: disks stand in a row, shutters down and labels up, and you look
 * down the row from the front, an index card with a colored tab before each group
 * (diskGroups.ts, diskDividers.ts). Scroll to flip through; click one to put it in drive A:.
 * Resolves when closed.
 */
export function openDiskBox(disks: Disk[], startId: string | undefined, onPick: (d: Disk) => void): Promise<void> {
  return new Promise((resolve) => {
    let index = disks.findIndex((d) => d.id === startId);
    // two windows: the disks that came with the site, and the user's own (plus a blank one)
    const sideOf = (g: DiskGroup) => DISK_GROUPS.find((x) => x.id === g)!.side;
    const groupOf = disks.map((d) => diskGroupOf(d, isImported));
    const folded = foldedGroups();
    let query = '';
    const shut = (g: DiskGroup) => !query && folded.has(g);
    const views = new Map<DiskGroup, GroupView>();
    const rows = { site: h('div', { class: 'disk-row' }), mine: h('div', { class: 'disk-row' }) };
    const tabs = {
      site: h('div', { class: 'index-tabs', role: 'group', 'aria-label': 'Go to a group of disks from the CD and Sandbox Software' }),
      mine: h('div', { class: 'index-tabs', role: 'group', 'aria-label': 'Go to a group of your disks' }),
    };
    const info = h('div', { class: 'flip-info', 'aria-live': 'polite' });

    const items: HTMLElement[] = [];
    groupDisks(disks, isImported).forEach(({ id, indexes }, place) => {
      const side = sideOf(id);
      const view = groupView(
        id,
        place,
        () => toggle(id),
        () => jumpTo(id),
      );
      views.set(id, view);
      for (const i of indexes) {
        const d = disks[i];
        const el = floppyElement(d);
        el.setAttribute('role', 'option');
        el.tabIndex = -1;
        el.title = `Put ${d.kind === 'blank' ? 'a blank disk' : d.title} in drive A:`;
        el.addEventListener('pointerenter', () => select(i, false));
        el.addEventListener('click', () => pick(i));
        // a game on several disks: the rest stand right behind disk 1 (it's the one you boot)
        for (let n = disksIn(d); n > 1; n--) {
          const spare = floppyElement(d, true, n);
          spare.classList.add('spare');
          spare.addEventListener('click', () => pick(i));
          view.list.append(spare);
        }
        view.list.append(el);
        items[i] = el;
      }
      view.setCount(indexes.length, indexes.length, false);
      view.setFolded(shut(id));
      rows[side].append(view.section);
      tabs[side].append(view.jump);
    });

    const visible = (i: number) => !items[i].hidden && !shut(groupOf[i]);
    /** The disks shown in one case, front to back (the groups' order, not `disks`'). */
    const shown = (side: 'site' | 'mine') =>
      [...views.values()].filter((v) => sideOf(v.id) === side).flatMap((v) => disks.flatMap((_, i) => (groupOf[i] === v.id && visible(i) ? [i] : [])));

    /** The last disk shown in each group stands flush (the others overlap the one behind). */
    const settle = () => {
      for (const v of views.values()) {
        const all = [...v.list.querySelectorAll<HTMLElement>('.floppy')];
        all.forEach((f) => (f.style.marginBottom = ''));
        const last = all.filter((f) => !f.hidden).at(-1);
        if (last) last.style.marginBottom = '0';
      }
    };

    const search = h('input', {
      type: 'search',
      'aria-label': 'Find a disk',
      placeholder: 'Find a disk by title or author',
      oninput: () => {
        query = search.value.trim().toLocaleLowerCase();
        items.forEach((item, i) => {
          item.hidden = !`${disks[i].title} ${disks[i].catalog?.author ?? ''} ${disks[i].catalog?.company ?? ''}`.toLocaleLowerCase().includes(query);
        });
        for (const v of views.values()) {
          for (const spare of v.list.querySelectorAll<HTMLElement>('.spare')) spare.hidden = !!query;
          const of = groupOf.filter((g) => g === v.id).length;
          const hits = groupOf.filter((g, i) => g === v.id && !items[i].hidden).length;
          // while searching every group stands open, its divider kept with its count (0 too)
          v.setCount(hits, of, !!query);
          v.setFolded(shut(v.id));
        }
        settle();
        const first = disks.findIndex((_, i) => visible(i));
        if (first >= 0) select(visible(index) ? index : first, false);
        else clear(info, h('p', { role: 'status' }, 'No matching disks. Try another title or author.'));
      },
    });

    /** Folds a group shut or opens it, remembered in this browser. */
    function toggle(id: DiskGroup): void {
      if (query) return; // every group stands open while searching
      if (folded.has(id)) folded.delete(id);
      else folded.add(id);
      saveFolded(folded);
      views.get(id)!.setFolded(shut(id));
      if (!visible(index)) {
        const side = shown(sideOf(id));
        const other = shown(sideOf(id) === 'mine' ? 'site' : 'mine');
        const next = side[0] ?? other[0];
        if (next !== undefined) select(next, false);
      }
    }

    /** A tab above the case: open that group, bring its divider to the top and pick its first disk. */
    function jumpTo(id: DiskGroup): void {
      const view = views.get(id)!;
      if (shut(id)) toggle(id);
      const first = disks.findIndex((_, i) => groupOf[i] === id && visible(i));
      if (first >= 0) select(first, false);
      const box = view.section.closest<HTMLElement>('.disk-case');
      if (box) box.scrollTo({ top: view.section.offsetTop - 8, behavior: 'smooth' });
    }

    let back = () => {};
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      back();
      resolve();
    };
    const pick = (i: number) => {
      close();
      onPick(disks[i]);
    };

    function select(i: number, scroll = true): void {
      index = Math.max(0, Math.min(disks.length - 1, i));
      items.forEach((el, j) => el.setAttribute('aria-selected', String(j === index)));
      if (scroll) items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const d = disks[index];
      clear(
        info,
        h('h2', null, d.kind === 'blank' ? 'Blank disk' : d.title),
        h('p', null, diskFacts(d)),
        h('p', { class: 'hint' }, 'Click a disk to put it in drive A: · ←/→ switch boxes · ↑/↓ pick · PgUp/PgDn groups'),
      );
    }

    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.target === search && e.key !== 'Escape') return;
      // a focused divider tab takes Enter and Space itself
      if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
      const side = sideOf(groupOf[index]);
      const same = shown(side);
      const at = same.indexOf(index);
      if (e.key === 'ArrowUp' && at > 0) select(same[at - 1]);
      else if (e.key === 'ArrowDown' && at >= 0 && at < same.length - 1) select(same[at + 1]);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // the other window: its first disk
        const j = shown(e.key === 'ArrowRight' ? 'mine' : 'site')[0];
        if (j !== undefined) select(j);
      } else if (e.key === 'PageUp' || e.key === 'PageDown') {
        // the first disk of the group before or after this one, in this window
        const order = [...views.keys()].filter((g) => sideOf(g) === side);
        const step = e.key === 'PageDown' ? 1 : -1;
        for (let g = order.indexOf(groupOf[index]) + step; g >= 0 && g < order.length; g += step) {
          const j = same.find((i) => groupOf[i] === order[g]);
          if (j !== undefined) {
            select(j);
            break;
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        /* at the end of a window */
      } else if (e.key === 'Enter' && visible(index)) pick(index);
      else if (e.key === 'Escape') close();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);

    const overlay = h(
      'div',
      // focused itself on opening (the arrow keys and Enter pick a disk; a focused button would take Enter)
      { class: 'desk-overlay', role: 'dialog', 'aria-label': 'Disk box', tabindex: -1 },
      h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
      search,
      h(
        'div',
        { class: 'disk-cases' },
        h('section', { class: 'disk-col' }, h('h2', null, 'From the CD & Sandbox Software'), tabs.site, h('div', { class: 'disk-case' }, rows.site)),
        h('section', { class: 'disk-col mine' }, h('h2', null, 'Your disks'), tabs.mine, h('div', { class: 'disk-case' }, rows.mine)),
      ),
      info,
    );
    overlay.addEventListener('click', (e) => e.target === overlay && close());
    // the black light on in a dark room reaches the box in your hands: its white labels glow too
    const desk = document.querySelector('.desk');
    overlay.classList.toggle('uv-night', !!desk?.classList.contains('bl-uv') && desk.classList.contains('rl-dark'));
    document.body.append(overlay);
    back = focusInto(overlay);
    settle();
    // a disk in a folded group: start on the first one shown instead
    // with no disk of its own to start on, or one in a folded group: the first disk shown
    if (disks.length && (index < 0 || !visible(index))) index = shown('site')[0] ?? shown('mine')[0] ?? 0;
    if (disks.length) select(index);
  });
}
