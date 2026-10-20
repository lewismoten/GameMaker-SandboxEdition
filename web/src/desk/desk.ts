// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
import './desk.css';
import { h, clear, toast } from '../editor/ui';
import { Computer, type MonitorMode } from '../retro/computer';
import { loadDisks, RSD_GAMES, type Disk } from '../retro/disks';
import { openDiskBox, floppyElement, type DiskAction } from './diskBox';
import { openCatalog } from './catalog';
import { loadCatalog } from '../project/files';
import { Project } from '../editor/project';
import type { SpeedSetting } from '../engine/scene';

export interface DeskNav {
  /** Leave for today's web interface, optionally opening a project file. */
  toModern(projectId?: string, file?: string): void;
}

const TURBO_KEY = 'gm-turbo';
const SLOW_TICKS = 8; // a 286-class PC

function loadTurbo(): boolean {
  try {
    return localStorage.getItem(TURBO_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function renderDesk(root: HTMLElement, nav: DeskNav): () => void {
  let turbo = loadTurbo();
  const speed: SpeedSetting = { ticksPerSecond: turbo ? undefined : SLOW_TICKS };
  let disks: Disk[] = [];
  let lastDisk: string | undefined;

  const crt = h('div', { class: 'crt', role: 'region', 'aria-label': 'Computer monitor' }, h('div', { class: 'power-hint' }, 'Press the power button ⏻'));
  const floppyDrive = h('div', { class: 'drive floppy', title: 'Drive A: (3.5" 1.44 MB)' }, h('span', null, 'A:'), h('span', { class: 'slot' }), h('button', { onclick: () => eject() }, 'EJECT'));
  const cdDrive = h('div', { class: 'drive cdrom', title: 'Drive D: (CD-ROM)' }, h('span', null, 'D:'), h('span', { class: 'slot' }), h('span', null, 'CD-ROM'));
  const powerLed = h('span', { class: 'led green' });
  const turboLed = h('span', { class: 'led amber' });
  const mhz = h('span', { class: 'mhz' });
  const powerBtn = h('button', { class: 'case-btn', 'aria-label': 'Power', 'aria-pressed': 'false', onclick: () => void power() }, 'POWER');
  const turboBtn = h('button', { class: 'case-btn', 'aria-label': 'Turbo', onclick: () => setTurbo(!turbo) }, 'TURBO');
  const box = h('div', { class: 'box' });

  const desk = h(
    'div',
    { class: 'desk', dataset: { power: 'off', zoom: 'false' } },
    h(
      'header',
      { class: 'desk-bar' },
      h('h1', null, 'GAME-MAKER'),
      h('span', null, '1994 edition'),
      h('span', { class: 'spacer' }),
      matchMedia('(pointer: coarse)').matches ? h('span', { class: 'touch-tip' }, 'No keyboard? The disk box, CD and catalog type for you.') : null,
      h('button', { onclick: () => nav.toModern() }, 'Switch to today’s web →'),
    ),
    h(
      'div',
      { class: 'desk-scene' },
      h(
        'div',
        { class: 'desk-left' },
        h('button', { class: 'prop disk-box', onclick: () => void flip() }, box, h('span', { class: 'caption' }, 'Disk box — pick a game')),
      ),
      h(
        'div',
        { class: 'pc' },
        h(
          'div',
          { class: 'monitor' },
          h('button', { class: 'sticky', onclick: () => nav.toModern() }, 'Too retro? Use today’s web →'),
          h('div', { class: 'screen-bezel' }, crt),
          h('span', { class: 'brand' }, 'RSD  SVGA'),
          h('button', { class: 'enlarge', title: 'Fill the window with the screen', 'aria-label': 'Enlarge screen', onclick: () => setZoom('manual') }, '⤢'),
          h('span', { class: 'monitor-led' }),
        ),
        h('div', { class: 'monitor-stand' }),
        h(
          'div',
          { class: 'case' },
          h('div', { class: 'case-buttons' }, powerBtn, turboBtn),
          h('div', { class: 'leds' }, h('span', null, powerLed, 'POWER'), h('span', null, turboLed, 'TURBO'), mhz),
          h('span'),
          h('div', { class: 'drives' }, floppyDrive, cdDrive),
        ),
        h('div', { class: 'keyboard', title: 'Keyboard: click, then type', onclick: () => void power(true) }),
      ),
      h(
        'div',
        { class: 'desk-right' },
        h(
          'button',
          { class: 'prop cd-case', onclick: () => void startGameMaker() },
          h('div', { class: 'jewel' }, h('div', { class: 'disc' }), h('div', { class: 'art' }, h('strong', null, 'GAME-MAKER'), h('small', null, 'Version 3.0 · CD-ROM'), h('small', null, 'Recreational Software Designs'))),
          h('span', { class: 'caption' }, 'Game-Maker CD — start the editor'),
        ),
        h(
          'button',
          { class: 'prop catalog-prop', onclick: () => void catalog() },
          h('div', { class: 'paper' }, 'SHAREWARE', h('br'), 'CATALOG', h('em', null, 'Games made with Game-Maker · Fall 1994 · call our BBS!')),
          h('span', { class: 'caption' }, 'Shareware catalog'),
        ),
      ),
    ),
    h('button', { class: 'zoom-exit primary', onclick: () => setZoom(false) }, 'Back to the desk'),
  );
  clear(root, desk);

  let pc: Computer | undefined;
  const computer = new Computer(crt, {
    speed,
    openModern: (projectId, file) => nav.toModern(projectId, file),
    onModeChange: (mode: MonitorMode) => setZoom(mode === 'gfx' ? 'gfx' : false),
    onDisksChanged: (insert) => void refreshDisks(insert),
  });
  pc = computer;
  crt.addEventListener('click', () => void power(true));

  /** 'gfx': the designers need the whole window; 'manual': the user enlarged the screen. */
  function setZoom(zoom: 'gfx' | 'manual' | false): void {
    desk.dataset.zoom = zoom || 'false';
    pc?.focus(); // undefined while the PC is still being built
  }
  const onKey = (e: KeyboardEvent) => {
    // Esc leaves a manual zoom only when nothing on the PC is running (games use Esc).
    if (e.key === 'Escape' && desk.dataset.zoom === 'manual' && !computer.busy) setZoom(false);
  };
  window.addEventListener('keydown', onKey);

  function setTurbo(on: boolean): void {
    turbo = on;
    speed.ticksPerSecond = on ? undefined : SLOW_TICKS;
    try {
      localStorage.setItem(TURBO_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode */
    }
    turboBtn.setAttribute('aria-pressed', String(on));
    turboLed.classList.toggle('on', on && computer.powered);
    mhz.textContent = computer.powered ? (on ? '66' : '8') : '';
  }

  async function power(onlyOn = false): Promise<void> {
    if (computer.powered) {
      if (!onlyOn) location.reload(); // switching off: the simplest honest "reset"
      else computer.focus();
      return;
    }
    desk.dataset.power = 'on';
    powerBtn.setAttribute('aria-pressed', 'true');
    powerLed.classList.add('on');
    setTurbo(turbo);
    await computer.powerOn();
    setTurbo(turbo);
  }

  /** Types a command at the prompt (booting first if needed). */
  async function command(cmd: string): Promise<void> {
    await power(true);
    if (!computer.typeCommand(cmd)) toast('Quit the program that is running first (Esc usually does it).');
  }

  async function refreshDisks(insertId?: string): Promise<void> {
    disks = await loadDisks();
    const peek = [...disks.filter((d) => RSD_GAMES.some((id) => d.id === `cd:${id}`)), ...disks.filter((d) => d.kind === 'project')].slice(0, 4);
    clear(
      box,
      ...peek.map((d, i) => {
        const el = floppyElement(d, true);
        el.style.left = `${8 + i * 14}px`;
        el.style.bottom = `${4 + (i % 2) * 6}px`;
        el.style.transform = `rotate(${(i - 1.5) * 4}deg)`;
        return el;
      }),
      h('div', { class: 'lid' }),
    );
    if (insertId) {
      const d = disks.find((x) => x.id === insertId);
      if (d) showInDrive(d);
      lastDisk = insertId;
    }
  }

  function showInDrive(d: Disk | undefined): void {
    if (!d) {
      delete floppyDrive.dataset.disk;
      return;
    }
    floppyDrive.dataset.disk = d.title;
    floppyDrive.style.setProperty('--disk-color', d.color);
  }

  async function insert(d: Disk): Promise<void> {
    const files = await d.load();
    computer.insertDisk(d, files);
    showInDrive(d);
    lastDisk = d.id;
  }

  function eject(): void {
    if (computer.busy) {
      toast('The drive light is on — quit the running program first.');
      return;
    }
    computer.eject();
    showInDrive(undefined);
  }

  async function flip(): Promise<void> {
    if (!disks.length) await refreshDisks();
    await openDiskBox(disks, lastDisk, (d, a) => void onDisk(d, a));
  }

  async function onDisk(d: Disk, action: DiskAction): Promise<void> {
    if (action === 'modern') {
      if (d.projectId) return nav.toModern(d.projectId);
      const files = await d.load();
      const p = Project.fromFiles(files, `${d.title} (my copy)`);
      if (d.gam) p.gam = d.gam;
      await p.saveNow();
      return nav.toModern(p.id);
    }
    if (computer.busy) {
      toast('Quit the program that is running first (Esc usually does it).');
      return;
    }
    await insert(d);
    if (action === 'play' && d.gam) await command(`A:\n${d.gam.replace(/\.gam$/i, '').toUpperCase()}`);
    else if (action === 'design') await command('C:\nGM');
    else await power(true);
  }

  async function startGameMaker(): Promise<void> {
    computer.insertCd();
    cdDrive.dataset.disk = 'Game-Maker 3.0';
    await command('GM');
  }

  async function catalog(): Promise<void> {
    const entries = await loadCatalog().catch(() => []);
    await openCatalog(entries, { callBbs: () => void command('C:\nTERMINAL'), downloaded: (id) => computer.downloads.has(id) });
  }

  setTurbo(turbo);
  void refreshDisks();
  return () => {
    window.removeEventListener('keydown', onKey);
    computer.screen.destroy();
    computer.keys.detach();
  };
}
