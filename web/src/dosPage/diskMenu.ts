// The DOS page's disk box (dos.html): every disk the desk's box holds (retro/dos/disks.ts: the
// CD's games, the Sandbox games, your own and a blank one) as a list in a dialog. Choosing one
// puts it in drive A: and types at the prompt what you would: the game's name to play it, GM
// to design it (C:\GM's GM for a new game on the blank disk).
import { h, clear } from '../editor/core/ui';
import { loadDisks, type Disk } from '../retro/dos/disks';
import type { Computer } from '../retro/computer';

export interface DiskMenuHost {
  pc(): Computer | undefined;
  /** The PC switched on and at its prompt, or undefined (something else is running). */
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
  openGame(id: string): Promise<boolean>;
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

  async function use(d: Disk, action: 'play' | 'design'): Promise<void> {
    const pc = await host.atPrompt();
    if (!pc) return dialog.close();
    if (inDrive?.id !== d.id || !pc.disk()) {
      host.say(`Loading ${d.kind === 'blank' ? 'the blank disk' : d.title}…`);
      pc.insertDisk(d, await d.load());
      inDrive = d;
      showDrive();
    }
    dialog.close();
    host.say('');
    if (action === 'play' && d.gam) await host.command(`A:\n${d.gam.replace(/\.gam$/i, '').toUpperCase()}`);
    else await host.command(d.kind === 'blank' ? 'C:\nCD \\GM\nGM' : 'A:\nGM');
  }

  /** Puts a catalog game's disk (play.html?game=<id>'s id) in drive A: and opens it in GM; false when there is none (unknown, or a secret game still hidden). */
  async function openGame(id: string): Promise<boolean> {
    if (!disks.length) await refresh();
    const d = disks.find((x) => x.id === `cd:${id}`);
    if (!d) return false;
    await use(d, 'design');
    return true;
  }

  function eject(): void {
    const pc = host.pc();
    if (pc?.busy) return host.say('The drive light is on: quit the running program first.');
    pc?.eject();
    inDrive = undefined;
    showDrive();
  }

  showDrive();
  return {
    button,
    refresh,
    openGame,
    /** The disk in drive A: (cd:<id>, project:<id>, blank), for the view switch. */
    current: () => inDrive?.id,
    /** The PC was switched off: the disk came out with it. */
    forget() {
      inDrive = undefined;
      showDrive();
    },
  };
}
