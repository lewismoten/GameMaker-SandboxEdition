// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
import './desk.css';
import './deskStage.css';
import './crtOff.css';
import { h, clear, toast } from '../editor/ui';
import { Computer, type MonitorMode } from '../retro/computer';
import { loadDisks, RSD_GAMES, type Disk } from '../retro/disks';
import { openDiskBox, floppyElement, diskFacts, type DiskAction } from './diskBox';
import { openCatalog } from './catalog';
import { openDosManual } from '../manual/dosManual';
import { renderShot } from './boxArt';
import { installCrtWarp } from './crtWarp';
import { sevenSegment, floppyDrive, cdDrive, openTray } from './caseParts';
import { keyboard } from './keyboard';
import { keyboardTray } from './tray';
import { speakers } from './speakers';
import { mug, wallPhone, deskLamp } from './deskProps';
import { deskModem } from './modem';
import { openBoxViewer } from './gameBox';
import { gameShelf, type Shelf } from './shelf';
import { openGameManual } from '../manual/gameManual';
import { snowyWindow } from './snowWindow';
import { drawGmBox, gmBoxContents } from './gmBox';
import { fitStage } from './stage';
import { deskCapture } from './capture';
import { EDITION, FORK_NOTE } from '../edition';
import { loadCatalog, type CatalogEntry } from '../project/files';
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
  const floppy = floppyDrive(() => eject());
  // What you can do with the disk in drive A: (shown only while there is one).
  const driveActions = h('div', { class: 'drive-actions', hidden: true });
  const cd = cdDrive(() => void ejectCd());
  const powerLed = h('span', { class: 'led green' });
  const turboLed = h('span', { class: 'led amber' });
  const mhz = sevenSegment(2);
  const powerBtn = h('button', { class: 'case-btn power', 'aria-label': 'Power', 'aria-pressed': 'false', onclick: () => void power() }, '⏻');
  const turboBtn = h('button', { class: 'case-btn', 'aria-label': 'Turbo', onclick: () => setTurbo(!turbo) });
  const box = h('div', { class: 'box' });
  const spk = speakers();
  const lamp = deskLamp();
  const modem = deskModem(() => void command('C:\nTERMINAL'));
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
      h('span', { title: FORK_NOTE }, `${EDITION} · the 1994 desk`),
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
      ),
      snowyWindow(),
      spk.left,
      spk.right,
      wallPhone(),
      lamp.lamp,
      lamp.glow,
      h(
        'div',
        { class: 'desk-left' },
        mug(),
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
          h('span', { class: 'brand' }, 'PIXELMAX 14" SVGA'),
          h('button', { class: 'enlarge', title: 'Fill the window with the screen', 'aria-label': 'Enlarge screen', onclick: () => setZoom('manual') }, '⤢'),
          h('span', { class: 'monitor-led' }),
        ),
        h('div', { class: 'monitor-stand' }),
        h(
          'div',
          { class: 'case' },
          // the modem sits on top of the case, beside the monitor stand
          modem.el,
          h('div', { class: 'case-buttons' }, h('label', null, powerBtn, 'POWER'), h('label', null, turboBtn, 'TURBO')),
          h('div', { class: 'leds' }, h('span', null, powerLed, 'POWER'), h('span', null, turboLed, 'TURBO'), h('span', { class: 'mhz' }, mhz, h('small', null, 'MHz'))),
          h('span'),
          h('div', { class: 'drives' }, cd.el, floppy.el),
          driveActions,
        ),
        keyboardTray(keyboard(() => void power(true))),
      ),
      h(
        'div',
        { class: 'desk-right' },
        h(
          'button',
          { class: 'prop gm-box', onclick: () => void openGmBox(), 'aria-label': 'Game-Maker 3.0 box: look inside' },
          h(
            'div',
            { class: 'retail' },
            h('div', { class: 'banner' }, h('em', null, 'COMPUTER-AIDED DESIGN TOOLS'), h('strong', null, 'GAME-MAKER')),
            h('div', { class: 'tagline' }, 'CREATE YOUR OWN COMPUTER GAMES'),
            h('div', { class: 'edition-ribbon' }, 'SANDBOX EDITION'),
            boxTiles,
            h('div', { class: 'rsd-badge' }, 'CREATED BY RECREATIONAL SOFTWARE DESIGNS'),
          ),
          h('span', { class: 'caption' }, 'Game-Maker 3.0 — open the box'),
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
  const unfit = fitStage(desk);

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
  const capture = deskCapture(computer);
  desk.querySelector('.monitor')?.append(capture.el);
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
    mhz.show(computer.powered ? (on ? '66' : '8') : '');
  }

  async function power(onlyOn = false): Promise<void> {
    if (computer.powered) {
      if (!onlyOn) {
        // switching off: the tube collapses to a line, then a dot; then the simplest honest "reset"
        crt.classList.add('switching-off');
        powerLed.classList.remove('on');
        spk.power(false);
        setTimeout(() => location.reload(), 1700);
      }
      else computer.focus();
      return;
    }
    desk.dataset.power = 'on';
    powerBtn.setAttribute('aria-pressed', 'true');
    powerLed.classList.add('on');
    modem.power(true);
    spk.power(true);
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
      floppy.setDisk(undefined);
      clear(driveActions);
      return;
    }
    floppy.setDisk(d.kind === 'blank' ? 'blank disk' : d.title, d.color);
    floppy.busy();
    const act = (a: DiskAction) => () => void onDisk(d, a);
    clear(
      driveActions,
      h('span', { class: 'drive-actions-title', title: diskFacts(d) }, d.kind === 'blank' ? 'Blank disk in A:' : `${d.title} in A:`),
      d.gam ? h('button', { class: 'primary', onclick: act('play') }, '▶ Play') : null,
      h('button', { onclick: act('design') }, d.kind === 'blank' ? '✎ New game' : '✎ Design'),
      d.kind !== 'blank' ? h('button', { onclick: act('modern'), title: 'Open it in today’s web Game-Maker' }, 'Today’s web →') : null,
      d.kind === 'original' && d.catalog?.original?.manual ? h('button', { onclick: () => void openGameManual(d.catalog!) }, '📖 Manual') : null,
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

  /** The Game-Maker box: turn it over, read the Owner's Guide, or put the CD in and start it. */
  async function openGmBox(): Promise<void> {
    const tiles = [...boxTiles.querySelectorAll<HTMLElement>('.tile')].map((t) => [t.querySelector('canvas')!, t.querySelector('span')!.textContent ?? ''] as [HTMLCanvasElement, string]);
    await openBoxViewer({ title: 'Game-Maker 3.0' }, drawGmBox(tiles), {
      insert: () => void startGameMaker(),
      insertLabel: 'Put the CD in and start Game-Maker',
      manual: () => void openDosManual(),
      extras: gmBoxContents(() => {
        document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
        void openDosManual();
      }),
    });
  }

  async function startGameMaker(): Promise<void> {
    if (!computer.cdInserted) {
      await openTray(cd);
      computer.insertCd();
      cd.setDisc('Game-Maker 3.0');
      desk.querySelector('.gm-box')?.classList.add('cd-in');
    }
    cd.busy();
    await command('GM');
  }

  /** The CD-ROM's eject button: out comes the tray (and the Game-Maker CD, back to its box). */
  async function ejectCd(): Promise<void> {
    if (computer.busy && computer.cdInserted) {
      toast('The CD-ROM is in use — quit the running program first.');
      return;
    }
    computer.ejectCd();
    cd.setDisc(undefined);
    desk.querySelector('.gm-box')?.classList.remove('cd-in');
    await openTray(cd);
  }

  let shelf: Shelf | undefined;

  /** The shelf on the wall: a box for each original game (desk/shelf.ts). */
  async function fillShelf(games: CatalogEntry[]): Promise<void> {
    const scene = desk.querySelector<HTMLElement>('.desk-scene');
    if (scene) shelf = await gameShelf(scene, games, { insert: (id) => void insertOriginal(id), manual: (g, front) => void openGameManual(g, front) });
  }

  async function insertOriginal(id: string): Promise<void> {
    if (!disks.length) await refreshDisks();
    const d = disks.find((x) => x.id === `cd:${id}`);
    if (d) await insertFromBox(d);
  }

  async function catalog(): Promise<void> {
    const entries = await loadCatalog().catch(() => []);
    await openCatalog(entries, { callBbs: () => void command('C:\nTERMINAL'), downloaded: (id) => computer.downloads.has(id) });
  }

  setTurbo(turbo);
  void refreshDisks();
  void loadCatalog().then((cat) => fillShelf(cat.filter((g) => g.original?.box)));
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
    unfit();
    lamp.dispose();
    shelf?.dispose();
    removeWarp();
    capture.dispose();
    computer.screen.destroy();
    computer.keys.detach();
  };
}
