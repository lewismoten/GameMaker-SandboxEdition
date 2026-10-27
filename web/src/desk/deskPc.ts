// The PC on the desk, switched on and off: its insides (DOS, Game-Maker, the BBS, the VGA) load
// when first needed, the power and turbo buttons and their lights, the tube collapsing when it
// is switched off, the enlarged screen, and typing a command at the prompt.
import { toast } from '../editor/core/ui';
import type { Computer } from '../retro/computer';
import type { MonitorMode } from '../retro/computer/setup';
import { installCrtWarp } from './pc/crtWarp';
import { captureStub } from './pc/captureStub';
import type { SpeedSetting } from '../engine/scene';
import { TURBO_OFF } from '../engine/slowPc';
import type { viewState } from '../urlState';
import type { deskScene } from './deskScene';

type Scene = ReturnType<typeof deskScene>;

/** What the PC tells the desk (desk.ts). */
interface PcHooks {
  deskView: ReturnType<typeof viewState>;
  openModern(projectId?: string, file?: string): void;
  /** The disks changed (a disk formatted or a game saved); `insert` is one now in drive A:. */
  disksChanged(insert?: string): void;
  /** The PC is done with after switching off: drive A: is empty again. */
  switchedOff(): void;
}

export function deskPc(scene: Scene, hooks: PcHooks) {
  const { desk, crt, floppy, cd, powerLed, turboLed, mhz, powerBtn, turboBtn, keyCard, spk, modem } = scene;
  const { deskView } = hooks;
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
        openModern: (projectId, file) => hooks.openModern(projectId, file),
        // The designers take the whole window; afterwards, go back to how the user had it.
        // vga stays in the monitor like the real thing.
        onModeChange: (mode: MonitorMode) => computer?.powered && setZoom(mode === 'gfx' ? 'gfx' : enlarged ? 'manual' : false),
        onDisksChanged: (insert) => hooks.disksChanged(insert),
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
    // a desk already left (a click, a key or restore() arriving late) never switches its PC on
    if (!desk.isConnected) return;
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
      hooks.switchedOff();
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

  return {
    /** The PC, once its insides are loaded (undefined until it is first needed, and after switching off). */
    get computer() {
      return computer;
    },
    load: loadPc,
    power,
    command,
    setZoom,
    setTurbo,
    toggleTurbo: () => setTurbo(!turbo),
    /** Shows the lights and turbo as they are. */
    showTurbo: () => setTurbo(turbo),
    /** What to fetch ahead while the desk is idle. */
    pcCode,
    captureCode,
    /** The desk is left: the PC goes with it. */
    dispose(): void {
      removeWarp();
      capture?.dispose();
      // the PC goes with the desk: whatever it runs stops, and its sound with it (a game, the
      // BBS's modem, a beep), its timers and keys too. Coming back makes a new desk with the PC
      // off, as before; one switching off already is disposed of by switchOff's own timer.
      if (computer && !switchingOff) shutDown(computer);
      else if (!computer) void pcLoad?.then(shutDown); // still loading: switched off once it is
    },
  };
}

/** A desk's PC when the desk is left: switched off (every sound cut) and disposed of. */
function shutDown(pc: Computer): void {
  pc.powerOff();
  pc.dispose();
}
