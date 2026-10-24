// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
// the PC's picture first (retro/computer/monitor.css), then the desk's tube and room around it
import '../retro/computer/monitor.css';
import './desk.css';
import './deskStage.css';
import './pc/crtOff.css';
import { h, clear, toast } from '../editor/core/ui';
import type { Computer } from '../retro/computer';
import type { MonitorMode } from '../retro/computer/setup';
import { loadDisks, type Disk } from '../retro/dos/disks';
import { openDiskBox, floppyElement, diskFacts, type DiskAction } from './disks/diskBox';
import { installCrtWarp } from './pc/crtWarp';
import { sevenSegment, floppyDrive, cdDrive, openTray } from './pc/caseParts';
import { keyboard } from './pc/keyboard';
import { keyboardTray } from './pc/tray';
import { speakers } from './pc/speakers';
import { mug, wallPhone, deskLamp } from './room/deskProps';
import { deskModem } from './pc/modem';
import type { Shelf } from './boxes/shelf';
import { onCatalogChanged } from '../project/catalogWatch';
import { snowyWindow } from './room/snowWindow';
// the box on the desk wears gmBox.css's ribbon; the box's insides load when it is opened
import './boxes/gmBox.css';
import { SANDBOX_SHOTS, sandboxShots } from '../gfx/sandboxShots';
import { fitStage } from './stage';
import { keyCardSpot } from './pc/keyCard';
import { regSideLater } from '../retro/gmReg/regSideLater';
import { newsClipping } from './room/newsClipping';
import { phoneNotes } from './room/phoneNotes';
import { wallClock } from './room/wallClock';
import { wasteBasket } from './room/wasteBasket';
import { roomDoor } from './room/roomDoor';
import { paperStack } from './room/paperStack';
import { captureStub } from './pc/captureStub';
import { deskProps } from './props';
import { EDITION, FORK_NOTE } from '../edition';
import { loadCatalog, loadGameList, type CatalogEntry } from '../project/files';
import { Project } from '../editor/core/project';
import type { SpeedSetting } from '../engine/scene';
import { TURBO_OFF } from '../engine/slowPc';
import { viewState } from '../urlState';
import { prefetchWhenIdle } from '../prefetch';
import { viewSwitch } from '../viewSwitch';
import { leaveProgram as leaveTheProgram } from '../retro/leaveProgram';

// What is opened, looked into or picked up on the desk loads when it first is (and is fetched
// ahead once the desk is idle, see the end of renderDesk): the manuals, the catalog, the boxes' insides.
const lazy = {
  catalog: () => import('./room/catalog'),
  dosManual: () => import('../manual/dosManual'),
  gameManual: () => import('../manual/gameManual'),
  boxViewer: () => import('./boxes/boxViewer'),
  gmBox: () => import('./boxes/gmBox'),
  shelf: () => import('./boxes/shelf'),
};
interface DeskNav {
  /** Leave for today's web interface, optionally opening a project file. */
  toModern(projectId?: string, file?: string): void;
  /** Leave for today's web interface at an address (#/game/cd:<id>), from the view switch. */
  toModernAt?(hash: string): void;
}

export function renderDesk(root: HTMLElement, nav: DeskNav): () => void {
  // the PC starts in turbo every visit; the button slows it down until you leave
  let turbo = true;
  try {
    localStorage.removeItem('gm-turbo'); // the setting earlier versions kept
  } catch {
    /* private mode */
  }
  const speed: SpeedSetting = {
    slowPc: turbo ? undefined : TURBO_OFF,
  };
  let disks: Disk[] = [];
  let lastDisk: string | undefined;
  // The address keeps what is going on at the desk, so a reload or a shared link comes back
  // to it: the disk in drive A:, what the PC is running, and what is open on the desk
  // (#/desk?disk=cd:nebula&run=play, #/desk?run=gm&open=gm-manual).
  const deskView = viewState(['desk']);
  /** What the address says to do, read before anything here changes it. */
  const wanted = {
    disk: deskView.get('disk'),
    run: deskView.get('run'),
    open: deskView.get('open'),
  };
  /** Keeps something open on the desk in the address while it is open. */
  const opened = async (name: string, open: () => Promise<void>) => {
    deskView.set({ open: name });
    try {
      await open();
    } finally {
      if (deskView.get('open') === name) deskView.set({ open: undefined });
    }
  };

  const crt = h('div', { class: 'crt', role: 'region', 'aria-label': 'Computer monitor' }, h('div', { class: 'power-hint' }, 'Press the power button ⏻'));
  const floppy = floppyDrive(() => eject());
  // What you can do with the disk in drive A: (shown only while there is one).
  const driveActions = h('div', { class: 'drive-actions', hidden: true });
  const cd = cdDrive(() => void ejectCd());
  const powerLed = h('span', { class: 'led green' });
  const turboLed = h('span', { class: 'led amber' });
  const mhz = sevenSegment(2);
  const powerBtn = h(
    'button',
    {
      class: 'case-btn power',
      'aria-label': 'Power',
      'aria-pressed': 'false',
      onclick: () => void power(),
    },
    '⏻',
  );
  const turboBtn = h('button', {
    class: 'case-btn',
    'aria-label': 'Turbo',
    onclick: () => setTurbo(!turbo),
  });
  const box = h('div', { class: 'box' });
  // the playing game's key card, taped to the monitor
  // the PC's keyboard, and (on a phone) the strip of large keys under the PC
  const keys = keyboard(() => void power(true));
  const keyCard = keyCardSpot(() => crt.querySelector<HTMLElement>('.crt-game canvas[tabindex]')?.focus());
  const spk = speakers({
    gamePlaying: () => computer?.gamePlaying ?? false,
    restartGame: () => computer?.restartGame() ?? false,
  });
  const lamp = deskLamp();
  const modem = deskModem(() => void command('C:\nTERMINAL'));
  // The same Sandbox games as the box's 3D front (gfx/sandboxShots.ts), each with what it shows off.
  const BOX_TILES = SANDBOX_SHOTS.slice(0, 6).map(([id, feature]) => [id, feature] as [string, string]);
  const boxTiles = h(
    'div',
    { class: 'tiles', 'aria-hidden': 'true' },
    ...BOX_TILES.map(([id, caption]) => h('div', { class: 'tile', dataset: { game: id } }, h('canvas'), h('span', null, caption))),
  );

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
      // Desk | DOS | Web, with the disk in drive A: coming along (viewSwitch.ts)
      viewSwitch('desk', () => deskView.get('disk'), {
        web: (href) => (nav.toModernAt ? nav.toModernAt(href.slice(href.indexOf('#'))) : nav.toModern()),
      }),
      // where today's web has its theme button: the switch sits at the same top right in every view
      h('span', { class: 'view-switch-end', 'aria-hidden': 'true' }),
    ),
    h(
      'main',
      { class: 'desk-scene', 'aria-label': 'The 1994 desk' },
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
        // AVIF or WebP at the size it hangs (256 or 512 px across), the JPEG for older browsers
        h(
          'picture',
          { style: 'display:block;width:100%' },
          ...(['avif', 'webp'] as const).map((type) =>
            h('source', {
              type: `image/${type}`,
              srcset: `./desk/moten-snow-to-software-256.${type} 256w, ./desk/moten-snow-to-software-512.${type} 512w`,
              sizes: '(min-width: 1350px) 230px, 17vw',
            }),
          ),
          h('img', {
            src: './desk/moten-snow-to-software.jpg',
            alt: 'Poster: MOTEN Snow-to-Software Operations, a pixel-art snowflake and shovel',
            loading: 'lazy',
            decoding: 'async',
            fetchpriority: 'low',
          }),
        ),
      ),
      h('div', { class: 'desk-top', 'aria-hidden': 'true' }),
      h('div', { class: 'desk-legs', 'aria-hidden': 'true' }),
      snowyWindow(),
      newsClipping(),
      wallClock(),
      roomDoor(),
      wasteBasket(),
      spk.left,
      spk.right,
      phoneNotes(),
      wallPhone(),
      lamp.lamp,
      lamp.glow,
      h(
        'div',
        { class: 'desk-left' },
        paperStack({ catalog: () => void catalog(), magazine: () => void magazine() }),
        h(
          'button',
          {
            class: 'prop disk-box',
            onclick: () => void flip(),
            'aria-label': 'Disk box: pick a game to put in drive A',
          },
          box,
          h('span', { class: 'caption', 'aria-hidden': 'true' }, 'Disk box — pick a game'),
        ),
        mug(),
      ),
      h(
        'div',
        { class: 'desk-right' },
        h(
          'button',
          {
            class: 'prop gm-box',
            onclick: () => void openGmBox(),
            'aria-label': 'Game-Maker SE 3.0 box: look inside',
          },
          h(
            'div',
            { class: 'retail' },
            h('div', { class: 'banner' }, h('em', null, 'COMPUTER-AIDED DESIGN TOOLS'), h('strong', null, 'GAME-MAKER')),
            h('div', { class: 'tagline' }, 'CREATE YOUR OWN COMPUTER GAMES'),
            h('div', { class: 'edition-ribbon' }, 'SANDBOX EDITION'),
            boxTiles,
            h('div', { class: 'rsd-badge' }, 'ORIGINALLY CREATED BY RECREATIONAL SOFTWARE DESIGNS'),
          ),
          h('span', { class: 'caption' }, 'Game-Maker SE 3.0 — open the box'),
        ),
      ),
      h(
        'div',
        { class: 'pc' },
        h(
          'div',
          { class: 'case' },
          // the modem sits on top of the case, beside the monitor stand
          modem.el,
          h('div', { class: 'case-buttons' }, h('label', null, powerBtn, 'POWER'), h('label', null, turboBtn, 'TURBO')),
          h(
            'div',
            { class: 'leds' },
            h('span', null, powerLed, 'POWER'),
            h('span', null, turboLed, 'TURBO'),
            h('span', { class: 'mhz' }, mhz, h('small', null, 'MHz')),
          ),
          h('span'),
          h('div', { class: 'drives' }, cd.el, floppy.el),
          driveActions,
        ),
        keyboardTray(keys.board),
        keys.strip,
        // the screen takes every key (Tab too), so it comes last when tabbing: the case,
        // tray and monitor buttons come first and CSS puts them back in their places
        h(
          'div',
          { class: 'monitor' },
          h('button', { class: 'sticky', onclick: () => nav.toModern() }, 'Too retro? Use today’s web →'),
          h(
            'button',
            {
              class: 'enlarge',
              title: 'Fill the window with the screen',
              'aria-label': 'Enlarge screen',
              onclick: () => setZoom('manual'),
            },
            '⤢',
          ),
          keyCard.el,
          h('div', { class: 'screen-bezel' }, crt),
          h('span', { class: 'brand' }, 'PIXELMAX 14" SVGA'),
          h('span', { class: 'monitor-led' }),
        ),
        h('div', { class: 'monitor-stand' }),
      ),
      h('div', { class: 'desk-edge', 'aria-hidden': 'true' }),
    ),
    h('button', { class: 'zoom-exit primary', onclick: () => setZoom(false) }, 'Back to the desk'),
  );
  clear(root, desk);
  const unfit = fitStage(desk);
  // the clock, the waste basket, the door, the window, the curtains... (props/)
  // (nothing happens outside the window while a game is playing)
  const unProps = deskProps(desk, { gamePlaying: () => computer?.gamePlaying ?? false });

  let enlarged = false; // the user pressed the enlarge button
  // The PC's insides (DOS, Game-Maker, the BBS, the VGA): loaded when the PC is first needed
  // (switched on, a disk put in, the shareware catalog opened), and fetched ahead when the
  // desk is idle or the pointer comes to the power button, so switching on stays instant.
  let computer: Computer | undefined;
  let pcLoad: Promise<Computer> | undefined;
  let removeWarp = () => {};
  const pcCode = () => import('../retro/computer');
  const loadPc = (): Promise<Computer> =>
    (pcLoad ??= pcCode().then(({ Computer }) => {
      computer = new Computer(crt, {
        speed,
        openModern: (projectId, file) => nav.toModern(projectId, file),
        // The designers take the whole window; afterwards, go back to how the user had it.
        // vga stays in the monitor like the real thing.
        onModeChange: (mode: MonitorMode) => computer?.powered && setZoom(mode === 'gfx' ? 'gfx' : enlarged ? 'manual' : false),
        onDisksChanged: (insert) => void refreshDisks(insert),
        onGame: (game) => keyCard.show(game),
        // what the PC runs: a game (play), Game-Maker from a disk (design) or the hard disk / CD (gm), the BBS
        // (a PC switched off says nothing more)
        onProgram: (p) =>
          computer?.powered &&
          deskView.set({
            run: !p ? 'dos' : p.kind === 'game' ? 'play' : p.kind === 'gm' ? (p.drive === 'A' ? 'design' : 'gm') : p.kind === 'terminal' ? 'bbs' : 'dos',
          }),
        // the drive lights of A: and D: (even an empty drive lights up while DOS tries it; C: has no light on this case)
        onDriveAccess: (drive) => {
          if (drive === 'A') floppy.busy(700);
          else if (drive === 'D') cd.busy(900);
        },
      });
      removeWarp = installCrtWarp(crt.querySelector<HTMLElement>('.crt-picture')!);
      return computer;
    }));
  powerBtn.addEventListener('pointerenter', () => void pcCode(), { once: true });
  powerBtn.addEventListener('focus', () => void pcCode(), { once: true });
  // the screenshot and record buttons: the capture tool loads on the first press
  let capture: { el: HTMLElement; dispose(): void } | undefined;
  const captureCode = () => import('./pc/capture');
  const captureButtons = captureStub(async () => {
    const [pc, { deskCapture }] = await Promise.all([loadPc(), captureCode()]);
    capture ??= deskCapture(pc);
    return capture.el;
  });
  desk.querySelector('.monitor .screen-bezel')?.before(captureButtons); // before the screen, for Tab
  crt.addEventListener('click', () => void power(true));

  /** 'gfx': the designers need the whole window; 'manual': the user enlarged the screen. */
  function setZoom(zoom: 'gfx' | 'manual' | false): void {
    if (zoom !== 'gfx') enlarged = zoom === 'manual';
    desk.dataset.zoom = zoom || 'false';
    computer?.focus(); // undefined until the PC is first needed
  }
  const onKey = (e: KeyboardEvent) => {
    // Esc leaves a manual zoom only when nothing on the PC is running (games use Esc).
    if (e.key === 'Escape' && desk.dataset.zoom === 'manual' && !computer?.busy) setZoom(false);
  };
  window.addEventListener('keydown', onKey);
  // GM's copy check and GM REGISTER: the Owner's Guide and the registration card beside the monitor
  const reg = regSideLater(
    () => desk.querySelector<HTMLElement>('.monitor'),
    () => computer?.focus(),
    // the desk's window: the mail truck comes for the card and drives off with it; the reply
    // comes on paper too, under the bedroom door (props/mailDrop.ts)
    {
      onMailed: () => window.dispatchEvent(new CustomEvent('gm-window-event', { detail: { kind: 'mailtruck' } })),
      onReply: (reply) => window.dispatchEvent(new CustomEvent('gm-reg-reply', { detail: reply })),
    },
  );

  function setTurbo(on: boolean): void {
    turbo = on;
    speed.slowPc = on ? undefined : TURBO_OFF;
    turboBtn.setAttribute('aria-pressed', String(on));
    turboLed.classList.toggle('on', on && !!computer?.powered);
    mhz.show(computer?.powered ? (on ? '66' : '8') : '');
  }

  let poweringOn: Promise<void> | undefined;
  let switchingOff = false;
  async function power(onlyOn = false): Promise<void> {
    // the tube still collapsing from switching off: the switch is waiting to be pressed again
    if (switchingOff) return;
    // still loading the PC's insides from the first press: that press switches it on
    if (poweringOn && !computer?.powered) return poweringOn;
    if (computer?.powered) {
      if (!onlyOn) switchOff();
      else computer.focus();
      return;
    }
    desk.dataset.power = 'on';
    powerBtn.setAttribute('aria-pressed', 'true');
    powerLed.classList.add('on');
    modem.power(true);
    spk.power(true);
    setTurbo(turbo);
    poweringOn = loadPc().then((pc) => pc.powerOn());
    await poweringOn;
    if (!computer?.powered) return; // switched off again while it booted
    setTurbo(turbo);
    if (!deskView.get('run')) deskView.set({ run: 'dos' });
  }

  /**
   * The power switch, off. Every sound stops at once and whatever was running stops where it
   * is (Computer.powerOff); the tube collapses to a line, then a dot; then the PC is done
   * with (its screen, keyboard, timers) and the desk is as it was before it was first
   * switched on: no disk in A:, the CD back in its box, the lights out, the address
   * forgetting the disk and the program. Switching on again cold-boots a new PC.
   */
  function switchOff(): void {
    const pc = computer;
    if (!pc) return;
    switchingOff = true;
    pc.powerOff();
    powerLed.classList.remove('on');
    powerBtn.setAttribute('aria-pressed', 'false');
    spk.power(false);
    modem.power(false);
    deskView.set({ disk: undefined, run: undefined, open: undefined });
    crt.classList.add('switching-off');
    setTimeout(() => {
      crt.classList.remove('switching-off');
      removeWarp();
      removeWarp = () => {};
      capture?.dispose();
      capture = undefined;
      pc.dispose();
      computer = undefined;
      pcLoad = undefined;
      poweringOn = undefined;
      keyCard.show(undefined);
      showInDrive(undefined);
      lastDisk = undefined;
      cd.setDisc(undefined);
      desk.querySelector('.gm-box')?.classList.remove('cd-in');
      enlarged = false;
      desk.dataset.zoom = 'false';
      desk.dataset.power = 'off';
      setTurbo(turbo);
      switchingOff = false;
    }, 1700);
  }

  /** Types a command at the prompt (booting first if needed). */
  async function command(cmd: string): Promise<void> {
    await power(true);
    if (!(await loadPc()).typeCommand(cmd)) toast('Quit the program that is running first (Esc usually does it).');
  }

  async function refreshDisks(insertId?: string): Promise<void> {
    disks = await loadDisks();
    // two stacks standing in the box: the site's disks (Sandbox's games in front) on the
    // left, the user's own on the right (a blank one when there are none yet)
    const site = disks.filter((d) => d.kind === 'original' || d.kind === 'rsd' || d.kind === 'gameware').slice(0, 6);
    const own = disks.filter((d) => d.kind === 'project').slice(0, 5);
    const mine = [...own, ...disks.filter((d) => d.kind === 'blank')];
    // a row seen from the front and a little above: each disk behind stands a little
    // higher, smaller and darker, so its top shows over the one in front
    const row = (i: number) => ({
      bottom: 8 + i * 10,
      scale: 1 - i * 0.035,
      dim: 1 - i * 0.07,
    });
    const stack = (list: Disk[], x0: number, tabAt = -1) =>
      [...list].reverse().flatMap((d, k) => {
        const i = list.length - 1 - k; // drawn back to front, so the first stands in front
        const { bottom, scale, dim } = row(i);
        const el = floppyElement(d, true);
        el.classList.add('peek');
        if (i === 0) el.classList.add('front'); // the one whose label shows whole
        el.style.left = `${x0}px`;
        el.style.bottom = `${bottom}px`;
        el.style.transform = `scale(${scale})`;
        el.style.setProperty('--dim', String(dim));
        if (i !== tabAt) return [el];
        // an index card standing just behind this disk
        const tab = h('div', { class: 'bx-tab' });
        const t = row(i + 0.5);
        tab.style.cssText = `left:${x0}px;bottom:${t.bottom}px;transform:scale(${t.scale});transform-origin:50% 100%;filter:brightness(${t.dim})`;
        return [tab, el];
      });
    // back to front: the lid and back wall, the rows of disks, the walls around them
    clear(
      box,
      h('div', { class: 'lid' }),
      h('div', { class: 'bx-back' }),
      h('div', { class: 'bx-div' }),
      ...stack(site, 17, 2),
      ...stack(mine, 99),
      h('div', { class: 'bx-side l' }),
      h('div', { class: 'bx-side r' }),
      // embossed label-maker tape stuck on the front, one over each compartment
      h('div', { class: 'bx-front' }, h('span', { class: 'dymo l' }, 'GAMES'), h('span', { class: 'dymo r' }, 'MY DISKS')),
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
      d.kind !== 'blank'
        ? h(
            'button',
            {
              onclick: act('modern'),
              title: 'Open it in today’s web Game-Maker',
            },
            'Today’s web →',
          )
        : null,
      d.kind === 'original' && d.catalog?.original?.manual ? h('button', { onclick: () => void gameManual(d.catalog!) }, '📖 Manual') : null,
    );
  }

  async function insert(d: Disk): Promise<void> {
    const files = await d.load();
    (await loadPc()).insertDisk(d, files);
    showInDrive(d);
    lastDisk = d.id;
    deskView.set({ disk: d.id });
  }

  function eject(): void {
    if (computer?.busy) {
      toast('The drive light is on — quit the running program first.');
      return;
    }
    computer?.eject();
    showInDrive(undefined);
    deskView.set({ disk: undefined });
  }

  async function flip(): Promise<void> {
    if (!disks.length) await refreshDisks();
    await openDiskBox(disks, lastDisk, (d) => void insertFromBox(d));
  }

  /**
   * Gets back to the DOS prompt for a disk (retro/leaveProgram.ts): a game playing quits, and
   * Game-Maker closes after asking to save a designer's unsaved changes. False if you'd rather
   * keep going (or something else, like the BBS terminal, is running).
   */
  const leaveProgram = () => leaveTheProgram(computer, { readOnlyA: !!inDrive?.writeProtected, say: toast });

  async function insertFromBox(d: Disk): Promise<void> {
    if (!(await leaveProgram())) return;
    await insert(d);
    if (d.gam) await onDisk(d, 'play');
    else await power(true);
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
    if (!(await leaveProgram())) return;
    if (inDrive?.id !== d.id) await insert(d);
    if (action === 'play' && d.gam) await command(`A:\n${d.gam.replace(/\.gam$/i, '').toUpperCase()}`);
    // Game-Maker starts in the current folder: the disk, or C:\GM for a new game.
    else if (action === 'design') await command(d.kind === 'blank' ? 'C:\nCD \\GM\nGM' : 'A:\nGM');
  }

  /** A game's manual, kept in the address while it is open (open=manual:<game>). */
  const gameManual = (g: CatalogEntry, front?: string) => opened(`manual:${g.id}`, async () => (await lazy.gameManual()).openGameManual(g, front));
  /** Game-Maker's own Owner's Guide (open=gm-manual). */
  const dosManual = () => opened('gm-manual', async () => (await lazy.dosManual()).openDosManual());

  /** The Game-Maker box: turn it over, read the Owner's Guide, or put the CD in and start it. */
  function openGmBox(): Promise<void> {
    return opened('gm-box', showGmBox);
  }
  async function showGmBox(): Promise<void> {
    const tiles = [...boxTiles.querySelectorAll<HTMLElement>('.tile')].map(
      (t) => [t.querySelector('canvas')!, t.querySelector('span')!.textContent ?? ''] as [HTMLCanvasElement, string],
    );
    const [{ openBoxViewer }, { drawGmBox, gmBoxContents }] = await Promise.all([lazy.boxViewer(), lazy.gmBox()]);
    // the Owner's Guide or an insert read from the box: put it down and the box is back in hand
    const read = () =>
      void dosManual().then(() => {
        if (!desk.isConnected) return;
        desk.querySelector<HTMLElement>('.gm-box')?.focus({ preventScroll: true });
        void openGmBox();
      });
    await openBoxViewer({ title: 'Game-Maker SE 3.0' }, drawGmBox(tiles), {
      insert: () => void startGameMaker(),
      insertLabel: 'Put the CD in and start Game-Maker',
      manual: read,
      extras: gmBoxContents(
        () => {
          document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
          read();
        },
        () => {
          document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
          void startGameMaker();
        },
      ),
    });
  }

  async function startGameMaker(): Promise<void> {
    const computer = await loadPc();
    if (!computer.cdInserted) {
      await openTray(cd);
      computer.insertCd();
      cd.setDisc('Game-Maker SE 3.0');
      desk.querySelector('.gm-box')?.classList.add('cd-in');
    }
    cd.busy();
    await command('GM');
  }

  /** The CD-ROM's eject button: out comes the tray (and the Game-Maker CD, back to its box). */
  async function ejectCd(): Promise<void> {
    if (computer?.busy && computer.cdInserted) {
      toast('The CD-ROM is in use — quit the running program first.');
      return;
    }
    computer?.ejectCd();
    cd.setDisc(undefined);
    desk.querySelector('.gm-box')?.classList.remove('cd-in');
    await openTray(cd);
  }

  let shelf: Shelf | undefined;

  /** The shelf on the wall: a box for each original game (desk/boxes/shelf.ts). */
  // filled again when the list changes: the latest fill wins
  let shelfFill = 0;
  async function fillShelf(games: CatalogEntry[]): Promise<void> {
    const fill = ++shelfFill;
    const scene = desk.querySelector<HTMLElement>('.desk-scene');
    shelf?.dispose();
    shelf = undefined;
    scene?.querySelectorAll('.game-shelf').forEach((el) => el.remove());
    const { gameShelf } = await lazy.shelf();
    if (fill !== shelfFill) return;
    const made = scene
      ? await gameShelf(scene, games, {
          insert: (id) => void insertOriginal(id),
          manual: (g, front) => gameManual(g, front),
        })
      : undefined;
    if (fill !== shelfFill) {
      made?.dispose();
      made?.element.remove();
      return;
    }
    shelf = made;
    // on the wall under the poster, so it comes next when you Tab along the wall
    const el = scene?.querySelector('.game-shelf');
    if (el) desk.querySelector('.news-clipping')?.after(el);
  }

  async function insertOriginal(id: string): Promise<void> {
    if (!disks.length) await refreshDisks();
    const d = disks.find((x) => x.id === `cd:${id}`);
    if (d) await insertFromBox(d);
  }

  async function catalog(): Promise<void> {
    // the catalog marks what came from the BBS: the PC's downloads
    const [entries, pc] = await Promise.all([loadCatalog().catch(() => []), loadPc()]);
    const { openCatalog } = await lazy.catalog();
    await opened('catalog', () =>
      openCatalog(entries, {
        callBbs: () => void command('C:\nTERMINAL'),
        downloaded: (id) => pc.downloads.has(id),
      }),
    );
  }

  /** The magazine lying on the desk with the catalog (open=magazine); its links play disks, call the BBS and look at the props. */
  const magazine = () =>
    opened('magazine', async () =>
      (await import('../manual/magazine/viewer')).openMagazine({
        where: 'desk',
        desk: {
          play: (id) => void insertOriginal(id),
          bbs: (board) => void command(`C:\nTERMINAL${board ? ` ${board.toUpperCase()}` : ''}`),
          gm: () => void startGameMaker(),
          look,
        },
      }),
    );

  /** Turns to a prop on the desk (look=modem…, from the magazine's ads): opens what opens, points out the rest. */
  function look(prop: string): void {
    if (prop === 'catalog') return void catalog();
    if (prop === 'gmbox') return void openGmBox();
    if (prop === 'diskbox') return void flip();
    if (prop === 'mug') return void import('./mug/mugViewer').then((m) => m.openMugViewer());
    const el = prop === 'modem' ? modem.el : prop === 'speakers' ? spk.right : undefined;
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    (el.querySelector<HTMLElement>('button') ?? el).focus({ preventScroll: true });
    el.classList.add('desk-look');
    setTimeout(() => el.classList.remove('desk-look'), 3000);
  }

  /** Comes back to what the address describes: the disk in A:, the program running, what is open. */
  async function restore(): Promise<void> {
    const { disk, run, open } = wanted;
    const looking = deskView.get('look');
    if (looking) {
      deskView.set({ look: undefined });
      look(looking);
    }
    if (!disk && !run && !open) return;
    if (!disks.length) await refreshDisks();
    const d = disk ? disks.find((x) => x.id === disk) : undefined;
    if (disk && !d) {
      deskView.set({ disk: undefined });
      toast(disk.startsWith('project:') ? 'That disk holds a game made in another browser, so it isn’t in this disk box.' : 'That disk isn’t in the disk box.');
    }
    if (d) await insert(d);
    if (run === 'play' && d?.gam) await onDisk(d, 'play');
    else if (run === 'design' && d) await onDisk(d, 'design');
    else if (run === 'gm') await startGameMaker();
    else if (run === 'bbs') await command('C:\nTERMINAL');
    else if (run) await power(true);
    if (open === 'catalog') void catalog();
    else if (open === 'magazine') void magazine();
    else if (open === 'gm-box') void openGmBox();
    else if (open === 'gm-manual') void dosManual();
    else if (open?.startsWith('manual:')) {
      const g = (await loadCatalog().catch(() => [])).find((x) => x.id === open.slice(7) && x.original?.manual);
      if (g) void gameManual(g);
    }
  }

  setTurbo(turbo);
  void refreshDisks().then(restore);
  // what is likely next: switching the PC on. The rest (Game-Maker, the BBS, the boxes and
  // manuals on the desk) loads when it is opened, and is kept for offline use from then on
  prefetchWhenIdle([
    pcCode, // so switching it on is instant
    captureCode,
    () => fetch('./gm/index.json'), // C:\GM's listing, so GM starts offline too
  ]);
  void loadGameList().then((cat) => fillShelf(cat.filter((g) => g.original?.box)));
  // a secret game revealed or hidden again (every felt egg found, or EGG.EXE): the shelf
  // and the disk box follow, and the box of a game no longer listed is put back
  const unCatalog = onCatalogChanged(async () => {
    const cat = await loadGameList().catch(() => [] as CatalogEntry[]);
    if (!desk.isConnected) return;
    const viewer = document.querySelector<HTMLElement>('.box-viewer');
    const showing = viewer?.getAttribute('aria-label');
    if (showing && !cat.some((g) => `${g.title} box` === showing)) viewer!.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
    void fillShelf(cat.filter((g) => g.original?.box));
    void refreshDisks();
  });
  // the felt eggs found in the Sandbox games (nothing at all until the first one)
  let unEggs: (() => void) | undefined;
  void import('../eggs/eggDisplay').then(({ eggDisplay }) => {
    if (!desk.isConnected) return;
    unEggs = eggDisplay((el) => {
      // on the wall, after the poster and clipping when you Tab along it
      const clip = desk.querySelector('.news-clipping');
      if (clip) clip.after(el);
      else desk.querySelector('.desk-scene')?.append(el);
    });
  });
  // the tin heart hunt's trophy, once every heart is found (nothing at all until then)
  let unTrophy: (() => void) | undefined;
  void import('../tinHearts/trophySpot').then(({ heartTrophy }) => {
    if (!desk.isConnected) return;
    unTrophy = heartTrophy((el) => {
      const clip = desk.querySelector('.news-clipping');
      if (clip) clip.after(el);
      else desk.querySelector('.desk-scene')?.append(el);
    });
  });
  void sandboxShots().then((shots) => {
    for (const t of boxTiles.querySelectorAll<HTMLElement>('.tile')) {
      const shot = shots.find((s) => s.id === t.dataset.game);
      const c = t.querySelector('canvas')!;
      if (!shot) continue;
      c.width = shot.canvas.width;
      c.height = shot.canvas.height;
      c.getContext('2d')!.drawImage(shot.canvas, 0, 0);
    }
  });
  return () => {
    window.removeEventListener('keydown', onKey);
    reg.dispose();
    unfit();
    unProps();
    lamp.dispose();
    shelf?.dispose();
    unCatalog();
    unEggs?.();
    unTrophy?.();
    removeWarp();
    capture?.dispose();
    computer?.screen.destroy();
    computer?.keys.detach();
  };
}
