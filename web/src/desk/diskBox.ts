// The disk box: flip through 3.5" floppies and pick one to play or design.
import './diskBox.css';
import { h, clear } from '../editor/ui';
import { diskCount, type Disk } from '../retro/disks';
import { creditLine } from '../project/files';

export type DiskAction = 'play' | 'design' | 'insert' | 'modern';

export function floppyElement(d: Disk, small = false): HTMLElement {
  const count = diskCount(d.bytes);
  const label = d.kind === 'blank' ? 'blank — formats as a new game' : d.title;
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

/** Opens the flip-through view. Resolves when closed. */
export function openDiskBox(disks: Disk[], startId: string | undefined, onAction: (d: Disk, a: DiskAction) => void): Promise<void> {
  return new Promise((resolve) => {
    let index = Math.max(0, disks.findIndex((d) => d.id === startId));
    const flipper = h('div', { class: 'flipper', role: 'listbox', 'aria-label': 'Floppy disks' });
    const info = h('div', { class: 'flip-info', 'aria-live': 'polite' });
    const position = h('span');
    const items = disks.map((d, i) => {
      const el = floppyElement(d);
      el.setAttribute('role', 'option');
      el.addEventListener('click', () => (i === index ? undefined : select(i)));
      flipper.append(el);
      return el;
    });

    const close = () => {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve();
    };
    const act = (a: DiskAction) => {
      close();
      onAction(disks[index], a);
    };

    function select(i: number): void {
      index = (i + disks.length) % disks.length;
      items.forEach((el, j) => {
        const off = j - index;
        const abs = Math.abs(off);
        el.style.transform = `translateX(${off * 130}px) translateZ(${-abs * 80}px) rotateY(${off * -28}deg)`;
        el.style.zIndex = String(100 - abs);
        el.style.opacity = abs > 4 ? '0' : '1';
        el.style.filter = abs ? 'brightness(0.65)' : 'none';
        el.setAttribute('aria-selected', String(abs === 0));
      });
      const d = disks[index];
      position.textContent = `${index + 1} of ${disks.length}`;
      const facts = [
        d.kind === 'rsd' ? 'One of the games RSD made with Game-Maker' : d.kind === 'gameware' ? 'Free gameware from the Game-Maker CD' : d.kind === 'project' ? 'Your game' : 'A blank, unformatted disk',
        d.catalog ? creditLine(d.catalog) : '',
        sizeText(d.bytes),
        d.writeProtected ? 'write-protected (Game-Maker will make you a copy to change it)' : '',
      ].filter(Boolean);
      clear(
        info,
        h('h2', null, d.kind === 'blank' ? 'Blank disk' : d.title),
        h('p', null, facts.join(' · ')),
        h(
          'div',
          { class: 'flip-actions' },
          d.gam ? h('button', { class: 'primary', onclick: () => act('play') }, '▶ Play it') : null,
          h('button', { class: d.gam ? '' : 'primary', onclick: () => act('design') }, d.kind === 'blank' ? 'Start a new game in Game-Maker' : 'Design it in Game-Maker'),
          h('button', { onclick: () => act('insert') }, 'Just put it in drive A:'),
          d.kind !== 'blank' ? h('button', { onclick: () => act('modern') }, 'Open in today’s web') : null,
        ),
      );
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') select(index - 1);
      else if (e.key === 'ArrowRight') select(index + 1);
      else if (e.key === 'Escape') close();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    let wheelAt = 0;
    flipper.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const now = performance.now();
        if (now - wheelAt < 120) return;
        wheelAt = now;
        select(index + Math.sign(e.deltaY || e.deltaX));
      },
      { passive: false },
    );
    let startX = 0;
    flipper.addEventListener('pointerdown', (e) => (startX = e.clientX));
    flipper.addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) select(index - Math.sign(dx));
    });

    const overlay = h(
      'div',
      { class: 'desk-overlay', role: 'dialog', 'aria-label': 'Disk box' },
      h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
      flipper,
      h('div', { class: 'flip-nav' }, h('button', { onclick: () => select(index - 1), 'aria-label': 'Previous disk' }, '◀'), position, h('button', { onclick: () => select(index + 1), 'aria-label': 'Next disk' }, '▶')),
      info,
    );
    document.body.append(overlay);
    select(index);
  });
}
