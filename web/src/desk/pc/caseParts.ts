// The front of the PC case: a two-digit seven-segment MHz display, the hard disk's light, and two
// 5.25" bay for the CD-ROM drive (bright white faceplate, tray, headphone jack, volume wheel, busy
// light, eject button), a smaller 3.5" bay with the floppy drive turned on its side (slot, activity
// light and eject push-button), the key lock and the brand badge. Sizes are mm from one factor.
import { h } from '../../editor/core/ui';
import type { DriveSound } from './driveSounds';

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

/** The hard disk's light beside POWER and TURBO (C: has no bay of its own): it flickers as the disk is read. */
export function hddLight(): { led: HTMLElement; busy(ms?: number): void; off(): void } {
  const led = h('span', { class: 'led red' });
  let until = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flicker = () => {
    const left = until - Date.now();
    if (left <= 0) return void (led.classList.remove('on'), (timer = undefined));
    led.classList.toggle('on', !led.classList.contains('on') || Math.random() < 0.4);
    timer = setTimeout(flicker, Math.min(left, 30 + Math.random() * 70));
  };
  return {
    led,
    busy(ms = 400) {
      until = Math.max(until, Date.now() + ms);
      if (!timer) flicker();
    },
    off() {
      until = 0;
      clearTimeout(timer);
      timer = undefined;
      led.classList.remove('on');
    },
  };
}

interface FloppyDrive {
  el: HTMLElement;
  /** Shows a disk in (its title and label color) or none. Seating or ejecting a disk makes its sound. */
  setDisk(title: string | undefined, color?: string): void;
  /** Blinks the activity light (reading). */
  busy(ms?: number): void;
  /** True while the activity light is on: the one time a real drive's disk shouldn't be pulled. */
  isBusy(): boolean;
}

/** Plays a drive sound (pc/driveSounds.ts, loaded on first use; silent before a gesture or when muted). */
function sound(kind: DriveSound, ms?: number): void {
  void import('./driveSounds').then((m) => m.driveSound(kind, ms));
}

/**
 * A 3.5" drive in its own 3.5" bay (25.4 x 101.6 mm), mounted on its side as in some cases of the
 * day: the disk slot runs up and down the right edge, the activity light sits at the top and the
 * round eject push-button at the bottom. Sizes are in mm (desk.css --mm).
 */
export function floppyDrive(onEject: () => void): FloppyDrive {
  const led = h('span', { class: 'drive-led' });
  const flap = h('span', { class: 'flap' });
  const btn = h('button', {
    class: 'eject-btn round',
    'aria-label': 'Eject the disk from drive A:',
    onclick: () => {
      btn.classList.add('pushed');
      setTimeout(() => btn.classList.remove('pushed'), 220);
      onEject();
    },
  });
  const el = h(
    'div',
    { class: 'drive fdd', title: 'Drive A: 3.5" 1.44 MB' },
    h('span', { class: 'slot' }, flap),
    led,
    btn,
    h('span', { class: 'bay-label' }, 'A:'),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    el,
    setDisk(title, color) {
      const had = 'disk' in el.dataset;
      if (title) {
        el.dataset.disk = title;
        el.title = `Drive A: ${title}`;
        el.style.setProperty('--disk-color', color ?? '#222');
        if (!had) sound('floppy-insert');
      } else {
        delete el.dataset.disk;
        el.title = 'Drive A: 3.5" 1.44 MB (empty)';
        if (had) sound('floppy-eject');
      }
    },
    busy(ms = 900) {
      led.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => led.classList.remove('on'), ms);
    },
    isBusy: () => led.classList.contains('on'),
  };
}

interface CdDrive {
  el: HTMLElement;
  setDisc(title: string | undefined): void;
  busy(ms?: number): void;
}

/** A CD-ROM drive filling its 5.25" bay behind a bright white faceplate: the tray across the top (its seam), the controls under it. */
export function cdDrive(onEject: () => void): CdDrive {
  const led = h('span', { class: 'drive-led amber' });
  const tray = h('div', { class: 'tray' }, h('span', { class: 'cd-logo' }, 'COMPACT', h('b', null, 'disc'), h('small', null, 'DIGITAL DATA')));
  const el = h(
    'div',
    { class: 'drive cdrom', title: 'Drive D: CD-ROM' },
    h('div', { class: 'tray-slot' }, tray),
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

type TrayState = 'closed' | 'opening' | 'open' | 'closing';
/** How long the tray slides (desk.css .tray transition), and how long it waits open before closing by itself. */
export const TRAY_SLIDE_MS = 600;
export const TRAY_WAIT_MS = 10000;
const trays = new WeakMap<CdDrive, { state: TrayState; timer?: ReturnType<typeof setTimeout>; closed: (() => void)[] }>();
const trayOf = (drive: CdDrive) => {
  let t = trays.get(drive);
  if (!t) trays.set(drive, (t = { state: 'closed', closed: [] }));
  return t;
};

/** Where the tray is: out or on its way out (eject then closes it), closing (eject does nothing), or closed. */
export const trayState = (drive: CdDrive): TrayState => trayOf(drive).state;

/** Slides the tray out: the motor's whirr and a clunk. It closes by itself after `wait` ms (or when closeTray is called); resolves once it has closed. */
export function openTray(drive: CdDrive, wait = TRAY_WAIT_MS): Promise<void> {
  const t = trayOf(drive);
  const done = new Promise<void>((r) => t.closed.push(r));
  if (t.state !== 'closed') return done; // already out, or closing: a press never sends it back out mid-close
  t.state = 'opening';
  drive.el.classList.add('open');
  sound('tray-open');
  t.timer = setTimeout(() => {
    t.state = 'open';
    t.timer = setTimeout(() => closeTray(drive), wait);
  }, TRAY_SLIDE_MS);
  return done;
}

/** Slides the tray back in (a second press of eject, or its wait running out); then a disc in it spins up. */
export function closeTray(drive: CdDrive): void {
  const t = trayOf(drive);
  if (t.state === 'closed' || t.state === 'closing') return;
  clearTimeout(t.timer);
  t.state = 'closing';
  drive.el.classList.remove('open');
  sound('tray-close');
  t.timer = setTimeout(() => {
    t.state = 'closed';
    t.closed.splice(0).forEach((r) => r());
    if (drive.el.dataset.disk) {
      drive.busy(1800);
      sound('cd-spin', 1800);
    }
  }, TRAY_SLIDE_MS);
}
