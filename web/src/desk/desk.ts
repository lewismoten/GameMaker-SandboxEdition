// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
import './desk.css';
import { h, clear, toast } from '../editor/ui';
import { Computer, type MonitorMode } from '../retro/computer';
import { loadDisks, RSD_GAMES, type Disk } from '../retro/disks';
import { openDiskBox, floppyElement, diskFacts, type DiskAction } from './diskBox';
import { openCatalog } from './catalog';
import { openDosManual } from '../manual/dosManual';
import { renderShot } from './boxArt';
import { installCrtWarp } from './crtWarp';
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

/** The CD, with its label printed around the hole. */
function cdDisc(): HTMLElement {
  const disc = h('div', { class: 'cd-disc', 'aria-hidden': 'true' });
  disc.innerHTML = `<svg viewBox="0 0 100 100">
    <defs>
      <path id="cd-top" d="M 16 50 A 34 34 0 0 1 84 50"/>
      <path id="cd-bottom" d="M 13 50 A 37 37 0 0 0 87 50"/>
    </defs>
    <text class="cd-title"><textPath href="#cd-top" startOffset="50%" text-anchor="middle">GAME-MAKER 3.0</textPath></text>
    <text class="cd-small"><textPath href="#cd-bottom" startOffset="50%" text-anchor="middle">RECREATIONAL SOFTWARE DESIGNS</textPath></text>
  </svg>`;
  return disc;
}

export function renderDesk(root: HTMLElement, nav: DeskNav): () => void {
  let turbo = loadTurbo();
  const speed: SpeedSetting = { ticksPerSecond: turbo ? undefined : SLOW_TICKS };
  let disks: Disk[] = [];
  let lastDisk: string | undefined;

  const crt = h('div', { class: 'crt', role: 'region', 'aria-label': 'Computer monitor' }, h('div', { class: 'power-hint' }, 'Press the power button ⏻'));
  const floppyDrive = h('div', { class: 'drive floppy', title: 'Drive A: (3.5" 1.44 MB)' }, h('span', null, 'A:'), h('span', { class: 'slot' }), h('button', { onclick: () => eject() }, 'EJECT'));
  // What you can do with the disk in drive A: (shown only while there is one).
  const driveActions = h('div', { class: 'drive-actions', hidden: true });
  const cdDrive = h('div', { class: 'drive cdrom', title: 'Drive D: (CD-ROM)' }, h('span', null, 'D:'), h('span', { class: 'slot' }), h('span', null, 'CD-ROM'));
  const powerLed = h('span', { class: 'led green' });
  const turboLed = h('span', { class: 'led amber' });
  const mhz = h('span', { class: 'mhz' });
  const powerBtn = h('button', { class: 'case-btn', 'aria-label': 'Power', 'aria-pressed': 'false', onclick: () => void power() }, 'POWER');
  const turboBtn = h('button', { class: 'case-btn', 'aria-label': 'Turbo', onclick: () => setTurbo(!turbo) }, 'TURBO');
  const box = h('div', { class: 'box' });
  // Captions from the real box; pictures from the sample games' own maps.
  const BOX_TILES: [string, string][] = [
    ['pipemare', 'EXPLORE MAZES'],
    ['nebula', 'DESIGN WORLDS'],
    ['sample', '256 COLOR VGA'],
    ['peach', 'ANIMATE MONSTERS'],
    ['zark', 'IMPORT GRAPHICS'],
    ['terrain', 'DRAW BLOCKS'],
  ];
  const boxTiles = h('div', { class: 'tiles', 'aria-hidden': 'true' }, ...BOX_TILES.map(([id, caption]) => h('div', { class: 'tile', dataset: { game: id } }, h('canvas'), h('span', null, caption))));

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
      // Homage: the winter of 1992-93, shoveling snow to buy Game-Maker.
      h(
        'a',
        {
          class: 'poster',
          href: 'https://lewismoten.com/1992/12/11/moten-snow-to-software-operations-founder-operator/',
          target: '_blank',
          rel: 'noopener',
          title: 'Moten Snow-to-Software Operations: shoveling snow in the winter of 1992 to buy Game-Maker',
        },
        h('img', { src: './desk/moten-snow-to-software.jpg', alt: 'Poster: MOTEN Snow-to-Software Operations, a pixel-art snowflake and shovel', loading: 'lazy' }),
        h('span', { class: 'poster-plaque' }, 'Winter 1992 · Fort Ashby, WV — shoveled snow to buy Game-Maker'),
      ),
      h(
        'div',
        { class: 'desk-left' },
        h(
          'button',
          { class: 'prop manual-prop', onclick: () => void openDosManual() },
          h('div', { class: 'booklet-cover' }, h('strong', null, 'GAME-MAKER'), h('span', null, 'Owner’s Guide'), h('em', null, 'Version 3.0')),
          h('span', { class: 'caption' }, 'Owner’s Guide'),
        ),
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
          driveActions,
        ),
        h('div', { class: 'keyboard', title: 'Keyboard: click, then type', onclick: () => void power(true) }),
      ),
      h(
        'div',
        { class: 'desk-right' },
        h(
          'button',
          { class: 'prop gm-box', onclick: () => void startGameMaker(), 'aria-label': 'Game-Maker 3.0 box: start Game-Maker' },
          h(
            'div',
            { class: 'retail' },
            h('div', { class: 'banner' }, h('em', null, 'COMPUTER-AIDED DESIGN TOOLS'), h('strong', null, 'GAME-MAKER')),
            h('div', { class: 'tagline' }, 'CREATE YOUR OWN COMPUTER GAMES'),
            boxTiles,
            h('div', { class: 'rsd-badge' }, 'CREATED BY RECREATIONAL SOFTWARE DESIGNS'),
          ),
          cdDisc(),
          h('span', { class: 'caption' }, 'Game-Maker 3.0 — start the editor'),
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
  let enlarged = false; // the user pressed the enlarge button
  const computer = new Computer(crt, {
    speed,
    openModern: (projectId, file) => nav.toModern(projectId, file),
    // The designers take the whole window; afterwards, go back to how the user had it.
    // vga stays in the monitor like the real thing.
    onModeChange: (mode: MonitorMode) => setZoom(mode === 'gfx' ? 'gfx' : enlarged ? 'manual' : false),
    onDisksChanged: (insert) => void refreshDisks(insert),
  });
  pc = computer;
  const removeWarp = installCrtWarp(crt.querySelector<HTMLElement>('.crt-picture')!);
  crt.addEventListener('click', () => void power(true));

  /** 'gfx': the designers need the whole window; 'manual': the user enlarged the screen. */
  function setZoom(zoom: 'gfx' | 'manual' | false): void {
    if (zoom !== 'gfx') enlarged = zoom === 'manual';
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

  let inDrive: Disk | undefined;

  function showInDrive(d: Disk | undefined): void {
    inDrive = d;
    driveActions.hidden = !d;
    if (!d) {
      delete floppyDrive.dataset.disk;
      clear(driveActions);
      return;
    }
    floppyDrive.dataset.disk = d.kind === 'blank' ? 'blank disk' : d.title;
    floppyDrive.style.setProperty('--disk-color', d.color);
    const act = (a: DiskAction) => () => void onDisk(d, a);
    clear(
      driveActions,
      h('span', { class: 'drive-actions-title', title: diskFacts(d) }, d.kind === 'blank' ? 'Blank disk in A:' : `${d.title} in A:`),
      d.gam ? h('button', { class: 'primary', onclick: act('play') }, '▶ Play') : null,
      h('button', { onclick: act('design') }, d.kind === 'blank' ? '✎ New game' : '✎ Design'),
      d.kind !== 'blank' ? h('button', { onclick: act('modern'), title: 'Open it in today’s web Game-Maker' }, 'Today’s web →') : null,
    );
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
    await openDiskBox(disks, lastDisk, (d) => void insertFromBox(d));
  }

  /** Putting a disk in drive A: (the PC boots if it is off). */
  async function insertFromBox(d: Disk): Promise<void> {
    if (computer.busy) {
      toast('The drive light is on — quit the running program first (Esc usually does it).');
      return;
    }
    await insert(d);
    await power(true);
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
    if (inDrive?.id !== d.id) await insert(d);
    if (action === 'play' && d.gam) await command(`A:\n${d.gam.replace(/\.gam$/i, '').toUpperCase()}`);
    // Game-Maker starts in the current folder: the disk, or C:\GM for a new game.
    else if (action === 'design') await command(d.kind === 'blank' ? 'C:\nCD \\GM\nGM' : 'A:\nGM');
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
  void loadCatalog()
    .then((cat) =>
      Promise.all(
        [...boxTiles.querySelectorAll<HTMLElement>('.tile')].map((t) => {
          const g = cat.find((c) => c.id === t.dataset.game);
          return g ? renderShot(g, t.querySelector('canvas')!) : false;
        }),
      ),
    )
    .catch(() => undefined);
  return () => {
    window.removeEventListener('keydown', onKey);
    removeWarp();
    computer.screen.destroy();
    computer.keys.detach();
  };
}
