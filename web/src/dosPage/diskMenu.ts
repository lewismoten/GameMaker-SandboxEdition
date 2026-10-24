// The DOS page's disk box (dos.html): every disk the desk's box holds (retro/dos/disks.ts: the
// CD's games, the Sandbox games, your own and a blank one) as a list in a dialog. Choosing one
// puts it in drive A: and types at the prompt what you would: the game's name to play it, GM
// to design it (C:\GM's GM for a new game on the blank disk).
import { h, clear } from '../editor/core/ui';
import { loadDisks, type Disk } from '../retro/dos/disks';
import type { Computer } from '../retro/computer';

interface DiskMenuHost {
  pc(): Computer | undefined;
  /** The PC, switched on (whatever it is running). */
  on(): Promise<Computer | undefined>;
  /** The PC switched on and at its prompt (a game quits, Game-Maker closes after asking to save), or undefined if you'd rather keep going. */
  atPrompt(): Promise<Computer | undefined>;
  command(cmd: string): Promise<void>;
  say(text: string): void;
}

const GROUPS: [string, (d: Disk) => boolean][] = [
  ['Games', (d) => d.kind === 'original' || d.kind === 'rsd' || d.kind === 'gameware'],
  ['My disks', (d) => d.kind === 'project' || d.kind === 'blank'],
];

export function diskMenu(host: DiskMenuHost): {
  button: HTMLElement;
  refresh(insertId?: string): Promise<void>;
  openDisk(diskId: string, action: 'play' | 'design'): Promise<boolean>;
  light(ms?: number): void;
  protectedA(): boolean;
  current(): string | undefined;
  forget(): void;
} {
  let disks: Disk[] = [];
  let inDrive: Disk | undefined;

  const button = h(
    'button',
    { type: 'button', class: 'dos-btn dos-disks', 'aria-haspopup': 'dialog', title: 'Choose a disk to put in drive A:', onclick: () => void open() },
    h('span', { class: 'dos-ico', 'aria-hidden': 'true' }, '💾'),
    h('span', { class: 'dos-word' }, 'Disks'),
  );
  const buttonWord = button.querySelector('.dos-word')!;
  const driveLine = h('p', { class: 'dos-drive' });
  const ejectBtn = h('button', { type: 'button', class: 'dos-btn', onclick: () => eject() }, '⏏ Eject');
  const list = h('div', { class: 'dos-disk-list' });
  const dialog = h(
    'dialog',
    { class: 'dos-dialog', 'aria-labelledby': 'dos-disks-h' },
    h(
      'header',
      { class: 'dos-dialog-head' },
      h('h2', { id: 'dos-disks-h' }, 'Disks'),
      h('button', { type: 'button', class: 'dos-btn', 'aria-label': 'Close the disk list', onclick: () => dialog.close() }, '×'),
    ),
    h('div', { class: 'dos-drive-row' }, driveLine, ejectBtn),
    list,
  );
  document.body.append(dialog);
  dialog.addEventListener('close', () => host.pc()?.focus());
  // Esc closes it even while a game plays (the game's keyboard may have claimed the key first)
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !dialog.open) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      dialog.close();
    },
    true,
  );

  function showDrive(): void {
    driveLine.textContent = inDrive ? `In drive A: ${inDrive.kind === 'blank' ? 'a blank disk' : inDrive.title}` : 'Drive A: is empty.';
    ejectBtn.hidden = !inDrive;
    buttonWord.textContent = inDrive ? `A: ${inDrive.kind === 'blank' ? 'blank disk' : inDrive.title}` : 'Disks';
  }

  function draw(): void {
    clear(
      list,
      ...GROUPS.map(([title, wanted]) => {
        const mine = disks.filter(wanted);
        if (!mine.length) return null;
        return h(
          'section',
          { class: 'dos-disk-group' },
          h('h3', null, title),
          h(
            'ul',
            null,
            ...mine.map((d) =>
              h(
                'li',
                { class: 'dos-disk' },
                h('span', { class: 'dos-disk-swatch', style: `background:${d.color}`, 'aria-hidden': 'true' }),
                h('span', { class: 'dos-disk-title' }, d.kind === 'blank' ? 'Blank disk' : d.title),
                d.gam
                  ? h('button', { type: 'button', class: 'dos-btn dos-primary', 'aria-label': `Play ${d.title}`, onclick: () => void use(d, 'play') }, '▶ Play')
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'dos-btn',
                    'aria-label': d.kind === 'blank' ? 'New game on the blank disk' : `Design ${d.title}`,
                    onclick: () => void use(d, 'design'),
                  },
                  d.kind === 'blank' ? '✎ New game' : '✎ Design',
                ),
                // a swap and nothing more, whatever is running: it reads the new disk next time it looks
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'dos-btn',
                    'aria-label': `Put ${d.kind === 'blank' ? 'the blank disk' : d.title} in drive A:`,
                    title: 'Just swap the disk: whatever is running sees it the next time it reads drive A:',
                    onclick: () => void swapIn(d),
                  },
                  '⇥ A:',
                ),
              ),
            ),
          ),
        );
      }),
    );
    showDrive();
  }

  /** Reads the disks again; `insertId` is one the PC has just put in drive A: (a new game's). */
  async function refresh(insertId?: string): Promise<void> {
    disks = await loadDisks();
    if (insertId) inDrive = disks.find((d) => d.id === insertId) ?? inDrive;
    if (dialog.open) draw();
    else showDrive();
  }

  async function open(): Promise<void> {
    if (!disks.length) await refresh();
    draw();
    dialog.showModal();
  }

  /** Puts a disk in drive A: (the one there comes out), whatever the PC is doing. */
  async function putIn(pc: Computer, d: Disk): Promise<void> {
    if (inDrive?.id === d.id && pc.disk()) return;
    host.say(`Loading ${d.kind === 'blank' ? 'the blank disk' : d.title}…`);
    pc.insertDisk(d, await d.load());
    inDrive = d;
    showDrive();
    light();
    host.say(`${d.kind === 'blank' ? 'A blank disk' : d.title} is in drive A:.`);
  }

  async function swapIn(d: Disk): Promise<void> {
    dialog.close();
    const pc = await host.on();
    if (pc) await putIn(pc, d);
  }

  async function use(d: Disk, action: 'play' | 'design'): Promise<void> {
    // closed first: Game-Maker may ask to save a designer's work
    dialog.close();
    const pc = await host.atPrompt();
    if (!pc) return;
    await putIn(pc, d);
    if (action === 'play' && d.gam) await host.command(`A:\n${d.gam.replace(/\.gam$/i, '').toUpperCase()}`);
    else await host.command(d.kind === 'blank' ? 'C:\nCD \\GM\nGM' : 'A:\nGM');
  }

  /**
   * Puts a disk (cd:<id> with play.html?game=<id>'s id, or project:<id>) in drive A: and plays
   * or designs its game; false when the box has no such disk (unknown, or a secret game still hidden).
   */
  async function openDisk(diskId: string, action: 'play' | 'design'): Promise<boolean> {
    if (!disks.length) await refresh();
    const d = disks.find((x) => x.id === diskId);
    if (!d) return false;
    await use(d, action === 'play' && d.gam ? 'play' : 'design');
    return true;
  }

  /** Out it comes, whatever is running (as on a real PC): the program finds drive A: empty the next time it looks. */
  function eject(): void {
    host.pc()?.eject();
    inDrive = undefined;
    showDrive();
    // the Eject button has gone: the keyboard stays in the list
    if (dialog.open) dialog.querySelector<HTMLElement>('.dos-dialog-head button')?.focus();
    host.say('Drive A: is empty.');
  }

  /** Drive A:'s light, on the Disks button, while the PC reads it. */
  let lightOff: ReturnType<typeof setTimeout> | undefined;
  function light(ms = 700): void {
    button.classList.add('dos-busy');
    clearTimeout(lightOff);
    lightOff = setTimeout(() => button.classList.remove('dos-busy'), ms);
  }

  showDrive();
  return {
    button,
    refresh,
    openDisk,
    light,
    /** The disk in drive A: has its write-protect tab open (an original). */
    protectedA: () => !!inDrive?.writeProtected,
    /** The disk in drive A: (cd:<id>, project:<id>, blank), for the view switch. */
    current: () => inDrive?.id,
    /** The PC was switched off: the disk came out with it. */
    forget() {
      inDrive = undefined;
      showDrive();
    },
  };
}
