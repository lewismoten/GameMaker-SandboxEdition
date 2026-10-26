// The front of the PC case: a two-digit seven-segment MHz display, a 3.5" floppy drive
// (slot with its spring flap, activity light and eject button) and a CD-ROM drive
// (tray, headphone jack, volume wheel, busy light and the eject button under the tray).
import { h } from '../../editor/core/ui';

const NS = 'http://www.w3.org/2000/svg';

// Segments a..g of one 12x20 digit, as polygons.
const SEGMENTS: Record<string, string> = {
  a: '2,1 10,1 9,2.6 3,2.6',
  b: '10.4,1.6 10.4,9.4 8.8,8.6 8.8,2.8',
  c: '10.4,10.6 10.4,18.4 8.8,17.2 8.8,11.4',
  d: '2,19 10,19 9,17.4 3,17.4',
  e: '1.6,10.6 1.6,18.4 3.2,17.2 3.2,11.4',
  f: '1.6,1.6 1.6,9.4 3.2,8.6 3.2,2.8',
  g: '2.2,10 3.4,9.2 8.6,9.2 9.8,10 8.6,10.8 3.4,10.8',
};
const DIGITS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  ' ': '',
  '-': 'g',
};

/** A seven-segment LED display; set its text with .show(). Unlit segments stay faintly visible. */
export function sevenSegment(digits = 2): HTMLElement & { show(text: string): void } {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${digits * 13 + 1} 20`);
  svg.setAttribute('class', 'seg-svg');
  const segs: Record<string, SVGPolygonElement>[] = [];
  for (let d = 0; d < digits; d++) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${d * 13 + 1} 0) skewX(-6)`);
    const map: Record<string, SVGPolygonElement> = {};
    for (const [k, pts] of Object.entries(SEGMENTS)) {
      const p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', pts);
      g.append(p);
      map[k] = p;
    }
    svg.append(g);
    segs.push(map);
  }
  const el = h('span', { class: 'seg-display', role: 'img', 'aria-label': '' }, svg as unknown as HTMLElement) as HTMLElement & { show(text: string): void };
  el.show = (text: string) => {
    const t = text.padStart(digits).slice(-digits);
    el.setAttribute('aria-label', text.trim() ? `${text.trim()} MHz` : 'display off');
    el.classList.toggle('lit', !!text.trim());
    segs.forEach((map, i) => {
      const on = DIGITS[t[i]] ?? '';
      for (const [k, p] of Object.entries(map)) p.classList.toggle('on', on.includes(k));
    });
  };
  el.show('');
  return el;
}

interface FloppyDrive {
  el: HTMLElement;
  /** Shows a disk in (its title and label color) or none. */
  setDisk(title: string | undefined, color?: string): void;
  /** Blinks the activity light (reading). */
  busy(ms?: number): void;
}

export function floppyDrive(onEject: () => void): FloppyDrive {
  const led = h('span', { class: 'drive-led' });
  const flap = h('span', { class: 'flap' });
  const el = h(
    'div',
    { class: 'drive fdd', title: 'Drive A: 3.5" 1.44 MB' },
    h('span', { class: 'bay-label' }, 'A:'),
    led,
    h('span', { class: 'slot' }, flap),
    h('button', { class: 'eject-btn', 'aria-label': 'Eject the disk from drive A:', onclick: () => onEject() }),
    h('span', { class: 'capacity' }, '1.44 MB'),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    el,
    setDisk(title, color) {
      if (title) {
        el.dataset.disk = title;
        el.title = `Drive A: ${title}`;
        el.style.setProperty('--disk-color', color ?? '#222');
      } else {
        delete el.dataset.disk;
        el.title = 'Drive A: 3.5" 1.44 MB (empty)';
      }
    },
    busy(ms = 900) {
      led.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => led.classList.remove('on'), ms);
    },
  };
}

interface CdDrive {
  el: HTMLElement;
  setDisc(title: string | undefined): void;
  busy(ms?: number): void;
}

export function cdDrive(onEject: () => void): CdDrive {
  const led = h('span', { class: 'drive-led amber' });
  const tray = h('div', { class: 'tray' }, h('span', { class: 'cd-logo' }, 'COMPACT', h('b', null, 'disc'), h('small', null, 'DIGITAL DATA')));
  const el = h(
    'div',
    { class: 'drive cdrom', title: 'Drive D: CD-ROM' },
    tray,
    h(
      'div',
      { class: 'cd-controls' },
      h('span', { class: 'bay-label' }, 'D:'),
      h('span', { class: 'jack', title: 'Headphones' }),
      h('span', { class: 'volume', title: 'Volume' }),
      h('span', { class: 'spacer' }),
      led,
      h('button', { class: 'eject-btn wide', 'aria-label': 'Open the CD-ROM tray', onclick: () => onEject() }),
    ),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    el,
    setDisc(title) {
      if (title) el.dataset.disk = title;
      else delete el.dataset.disk;
      el.title = title ? `Drive D: ${title}` : 'Drive D: CD-ROM (empty)';
    },
    busy(ms = 1400) {
      led.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => led.classList.remove('on'), ms);
    },
  };
}

/** Slides the tray out and back, as pressing eject did. */
export function openTray(drive: CdDrive): Promise<void> {
  drive.el.classList.add('open');
  return new Promise((r) =>
    setTimeout(() => {
      drive.el.classList.remove('open');
      r();
    }, 1600),
  );
}
