// The disk box: flip through 3.5" floppies and put one in drive A:.
import './diskBox.css';
import { h, clear } from '../editor/ui';
import { diskCount, type Disk } from '../retro/disks';
import { creditLine } from '../project/files';

export type DiskAction = 'play' | 'design' | 'modern';

export function floppyElement(d: Disk, small = false): HTMLElement {
  const count = diskCount(d.bytes);
  const label = d.kind === 'blank' ? 'blank — for Utilities ▸ Transfer' : d.title;
  const g = d.catalog;
  // Hand-written like a real label: who made it, when, and what it cost.
  const sub =
    d.kind === 'project'
      ? 'my game'
      : d.kind === 'blank'
        ? ''
        : [g?.author ?? g?.company, [g?.year, g?.price].filter(Boolean).join('  ')].filter(Boolean).join('\n');
  return h(
    'div',
    { class: 'floppy', style: `--body:${d.color}`, dataset: { kind: d.kind, protected: String(d.writeProtected) }, 'aria-hidden': small ? 'true' : undefined },
    h('div', { class: 'shutter' }),
    h('div', { class: 'label' }, label, h('small', null, [sub, count > 1 ? `disk 1 of ${count}` : ''].filter(Boolean).join('\n'))),
    h('div', { class: 'wp' }),
    h('div', { class: 'hd' }, 'HD'),
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
    d.kind === 'rsd' ? 'One of the games RSD made with Game-Maker' : d.kind === 'gameware' ? 'Free gameware from the Game-Maker CD' : d.kind === 'project' ? 'Your game (also in C:\\GM on the hard disk)' : 'A blank disk: Game-Maker’s Utilities ▸ Transfer copies a game onto it',
    d.catalog ? creditLine(d.catalog) : '',
    sizeText(d.bytes),
    d.writeProtected ? 'write-protected' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Opens the disk box: disks stand in a row, shutters down and labels up, and you look
 * down the row from the front. Scroll to flip through; click one to put it in drive A:.
 * Resolves when closed.
 */
export function openDiskBox(disks: Disk[], startId: string | undefined, onPick: (d: Disk) => void): Promise<void> {
  return new Promise((resolve) => {
    let index = Math.max(0, disks.findIndex((d) => d.id === startId));
    const row = h('div', { class: 'disk-row', role: 'listbox', 'aria-label': 'Floppy disks' });
    const info = h('div', { class: 'flip-info', 'aria-live': 'polite' });
    const items = disks.map((d, i) => {
      const el = floppyElement(d);
      el.setAttribute('role', 'option');
      el.tabIndex = -1;
      el.title = `Put ${d.kind === 'blank' ? 'a blank disk' : d.title} in drive A:`;
      el.addEventListener('pointerenter', () => select(i, false));
      el.addEventListener('click', () => pick(i));
      row.append(el);
      return el;
    });

    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
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
      clear(info, h('h2', null, d.kind === 'blank' ? 'Blank disk' : d.title), h('p', null, diskFacts(d)), h('p', { class: 'hint' }, 'Click a disk to put it in drive A:'));
    }

    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.key === 'ArrowUp') select(index - 1);
      else if (e.key === 'ArrowDown') select(index + 1);
      else if (e.key === 'Enter') pick(index);
      else if (e.key === 'Escape') close();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);

    const overlay = h(
      'div',
      { class: 'desk-overlay', role: 'dialog', 'aria-label': 'Disk box' },
      h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
      h('div', { class: 'disk-case' }, row),
      info,
    );
    overlay.addEventListener('click', (e) => e.target === overlay && close());
    document.body.append(overlay);
    select(index);
  });
}
