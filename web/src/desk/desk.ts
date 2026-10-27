// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
// the PC's picture first (retro/computer/monitor.css), then the desk's tube and room around it
import '../retro/computer/monitor.css';
import './desk.css';
import './deskStage.css';
import './pc/crtOff.css';
import { clear, toast } from '../editor/core/ui';
import { loadDisks, type Disk } from '../retro/dos/disks';
import { openDiskBox, type DiskAction } from './disks/diskBox';
import { openTray } from './pc/caseParts';
// the room, the box and the PC as drawn (with the box's gmBox.css ribbon)
import { deskScene, drawBoxTiles } from './deskScene';
import { onCatalogChanged } from '../project/catalogWatch';
import { fitStage } from './stage';
import { regSideLater } from '../retro/gmReg/regSideLater';
// the PC switched on and off (with the capture buttons' capture.css)
import { deskPc } from './deskPc';
import { deskProps } from './props';
import { loadCatalog, loadGameList, type CatalogEntry } from '../project/files';
import { Project } from '../editor/core/project';
import { viewState } from '../urlState';
import { prefetchWhenIdle } from '../prefetch';
import { leaveProgram as leaveTheProgram } from '../retro/leaveProgram';
import { fillDiskBox } from './disks/diskBoxFill';
import { fillDriveActions } from './disks/driveActions';
import { deskShelf } from './deskShelf';
import { showGmBox } from './deskGmBox';
import { pointOut } from './deskLook';
import { restoreDesk } from './deskRestore';
import { wallTrophies } from './wallTrophies';

// What is opened or read on the desk loads when it first is: the manuals and the catalog (the
// boxes' insides, deskGmBox.ts and deskShelf.ts).
const lazy = {
  catalog: () => import('./room/catalog'),
  dosManual: () => import('../manual/dosManual'),
  gameManual: () => import('../manual/gameManual'),
};
interface DeskNav {
  /** Leave for today's web interface, optionally opening a project file. */
  toModern(projectId?: string, file?: string): void;
  /** Leave for today's web interface at an address (#/game/cd:<id>), from the view switch. */
  toModernAt?(hash: string): void;
}

export function renderDesk(root: HTMLElement, nav: DeskNav): () => void {
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

  const scene = deskScene({
    power: (onlyOn) => void pc.power(onlyOn),
    toggleTurbo: () => pc.toggleTurbo(),
    eject: () => eject(),
    ejectCd: () => void ejectCd(),
    command: (cmd) => void pc.command(cmd),
    catalog: () => void catalog(),
    magazine: () => void magazine(),
    flip: () => void flip(),
    openGmBox: () => void openGmBox(),
    setZoom: (zoom) => pc.setZoom(zoom),
    gamePlaying: () => pc.computer?.gamePlaying ?? false,
    restartGame: () => pc.computer?.restartGame() ?? false,
    diskInA: () => deskView.get('disk'),
    toModern: () => nav.toModern(),
    toModernAt: nav.toModernAt && ((hash) => nav.toModernAt!(hash)),
  });
  const { desk, floppy, driveActions, cd, lamp, modem, spk, boxTiles } = scene;
  clear(root, desk);
  const unfit = fitStage(desk);
  // the clock, the waste basket, the door, the window, the curtains... (props/)
  // (nothing happens outside the window while a game is playing)
  const unProps = deskProps(desk, { gamePlaying: () => pc.computer?.gamePlaying ?? false });

  const pc = deskPc(scene, {
    deskView,
    openModern: (projectId, file) => nav.toModern(projectId, file),
    disksChanged: (insert) => void refreshDisks(insert),
    switchedOff: () => {
      showInDrive(undefined);
      lastDisk = undefined;
    },
  });
  const { command, power } = pc;
  const onKey = (e: KeyboardEvent) => {
    // Esc leaves a manual zoom only when nothing on the PC is running (games use Esc).
    if (e.key === 'Escape' && desk.dataset.zoom === 'manual' && !pc.computer?.busy) pc.setZoom(false);
  };
  window.addEventListener('keydown', onKey);
  // GM's copy check and GM REGISTER: the Owner's Guide and the registration card beside the monitor
  const reg = regSideLater(
    () => desk.querySelector<HTMLElement>('.monitor'),
    () => pc.computer?.focus(),
    // the desk's window: the mail truck comes for the card and drives off with it; the reply
    // comes on paper too, under the bedroom door (props/mailDrop.ts)
    {
      onMailed: () => window.dispatchEvent(new CustomEvent('gm-window-event', { detail: { kind: 'mailtruck' } })),
      onReply: (reply) => window.dispatchEvent(new CustomEvent('gm-reg-reply', { detail: reply })),
    },
  );

  async function refreshDisks(insertId?: string): Promise<void> {
    disks = await loadDisks();
    fillDiskBox(scene.box, disks);
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
    fillDriveActions(driveActions, d, { act: (a) => void onDisk(d, a), manual: () => void gameManual(d.catalog!) });
  }

  async function insert(d: Disk): Promise<void> {
    const files = await d.load();
    (await pc.load()).insertDisk(d, files);
    showInDrive(d);
    lastDisk = d.id;
    deskView.set({ disk: d.id });
  }

  function eject(): void {
    const computer = pc.computer;
    // a utility like PLAYHACK carries on with the drive empty (retro/diskSwap.ts)
    if (computer?.busy && !computer.diskSwappable) {
      toast('The drive light is on — quit the running program first.');
      return;
    }
    computer?.eject();
    showInDrive(undefined);
    deskView.set({ disk: undefined });
  }

  /** The disks in the box, read first if they aren't yet. */
  async function diskList(): Promise<Disk[]> {
    if (!disks.length) await refreshDisks();
    return disks;
  }

  async function flip(): Promise<void> {
    await openDiskBox(await diskList(), lastDisk, (d) => void insertFromBox(d));
  }

  /**
   * Gets back to the DOS prompt for a disk (retro/leaveProgram.ts): a game playing quits, and
   * Game-Maker closes after asking to save a designer's unsaved changes. False if you'd rather
   * keep going (or something else, like the BBS terminal, is running).
   */
  const leaveProgram = () => leaveTheProgram(pc.computer, { readOnlyA: !!inDrive?.writeProtected, say: toast });

  async function insertFromBox(d: Disk): Promise<void> {
    // a utility like PLAYHACK keeps running and finds the new disk in A: (retro/diskSwap.ts)
    if (pc.computer?.diskSwappable) return insert(d);
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
      // remembered as a copy of its game, so it lists with that game's kind (home, PLAYHACK)
      if (d.catalog) (await import('../editor/shell/homeOrigin')).rememberOrigin(p.id, d.catalog.id);
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
    return opened('gm-box', () =>
      showGmBox(boxTiles, {
        // the Owner's Guide or an insert read from the box: put it down and the box is back in hand
        read: () =>
          void dosManual().then(() => {
            if (!desk.isConnected) return;
            desk.querySelector<HTMLElement>('.gm-box .prop-cover')?.focus({ preventScroll: true });
            void openGmBox();
          }),
        start: () => void startGameMaker(),
      }),
    );
  }

  async function startGameMaker(): Promise<void> {
    const computer = await pc.load();
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
    const computer = pc.computer;
    if (computer?.busy && computer.cdInserted) {
      toast('The CD-ROM is in use — quit the running program first.');
      return;
    }
    computer?.ejectCd();
    cd.setDisc(undefined);
    desk.querySelector('.gm-box')?.classList.remove('cd-in');
    await openTray(cd);
  }

  /** The shelf on the wall: a box for each original game (desk/boxes/shelf.ts). */
  const shelf = deskShelf(desk, { insert: (id) => void insertOriginal(id), manual: (g, front) => gameManual(g, front) });

  async function insertOriginal(id: string): Promise<void> {
    const d = (await diskList()).find((x) => x.id === `cd:${id}`);
    if (d) await insertFromBox(d);
  }

  async function catalog(): Promise<void> {
    // the catalog marks what came from the BBS: the PC's downloads
    const [entries, computer] = await Promise.all([loadCatalog().catch(() => []), pc.load()]);
    const { openCatalog } = await lazy.catalog();
    await opened('catalog', () =>
      openCatalog(entries, {
        callBbs: () => void command('C:\nTERMINAL'),
        downloaded: (id) => computer.downloads.has(id),
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
    pointOut(desk, prop, { modem: modem.el, speaker: spk.right });
  }

  /** Comes back to what the address describes: the disk in A:, the program running, what is open. */
  const restore = () =>
    restoreDesk(wanted, deskView, {
      disks: diskList,
      insert,
      onDisk,
      startGameMaker,
      command,
      power,
      look,
      catalog,
      magazine,
      openGmBox,
      dosManual,
      gameManual: (g) => gameManual(g),
    });

  pc.showTurbo();
  void refreshDisks().then(restore);
  // what is likely next: switching the PC on. The rest (Game-Maker, the BBS, the boxes and
  // manuals on the desk) loads when it is opened, and is kept for offline use from then on
  prefetchWhenIdle([
    pc.pcCode, // so switching it on is instant
    pc.captureCode,
    () => fetch('./gm/index.json'), // C:\GM's listing, so GM starts offline too
  ]);
  void loadGameList().then((cat) => shelf.fill(cat.filter((g) => g.original?.box)));
  // a secret game revealed or hidden again (every felt egg found, or EGG.EXE): the shelf
  // and the disk box follow, and the box of a game no longer listed is put back
  const unCatalog = onCatalogChanged(async () => {
    const cat = await loadGameList().catch(() => [] as CatalogEntry[]);
    if (!desk.isConnected) return;
    const viewer = document.querySelector<HTMLElement>('.box-viewer');
    const showing = viewer?.getAttribute('aria-label');
    if (showing && !cat.some((g) => `${g.title} box` === showing)) viewer!.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
    void shelf.fill(cat.filter((g) => g.original?.box));
    void refreshDisks();
  });
  const unWall = wallTrophies(desk);
  drawBoxTiles(boxTiles);
  return () => {
    window.removeEventListener('keydown', onKey);
    reg.dispose();
    unfit();
    unProps();
    lamp.dispose();
    shelf.dispose();
    unCatalog();
    unWall();
    pc.dispose();
  };
}
