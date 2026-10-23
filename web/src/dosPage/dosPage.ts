// dos.html: the 1994 PC on its own, without the desk around it. It boots quickly (the BIOS,
// CONFIG.SYS and AUTOEXEC.BAT) straight into Game-Maker; quitting GM leaves you at DOS. It runs
// the same Computer as the desk (retro/computer.ts),
// with the same drives, saves and downloads, so files made on one show up on the other. The
// page supplies what the desk's room would: the power, reset and turbo buttons, the sound, a
// disk menu in place of the disk box, the Game-Maker CD, and the copy check's Owner's Guide
// and registration card as a panel (retro/gmReg/regSide.ts).
// The addresses it answers (LINKS, shown on the page too; index.html's #/dos and #/dos/<id> lead here):
//   dos.html             Game-Maker from its CD
//   dos.html?game=<id>   that game's disk in drive A:, open in Game-Maker (ids as play.html?game=<id>);
//                        an unknown id, or a secret game not yet found in this browser, gets plain GM
//   dos.html?run=dos     stays at the C:\> prompt
//   dos.html?run=bbs     calls the BBS
import './dosPage.css';
import { h, clear } from '../editor/core/ui';
import { Computer } from '../retro/computer';
import { regSide } from '../retro/gmReg/regSide';
import { soundBlaster, setSoundBlaster } from '../retro/computer/soundBlaster';
import { getVolume, setVolume } from '../audio/output';
import type { SpeedSetting } from '../engine/scene';
import { TURBO_OFF } from '../engine/slowPc';
import { PRODUCT } from '../edition';
import { registerServiceWorker } from '../offline';
import { watchForUpdates } from '../devReload';
import { diskMenu } from './diskMenu';
import { keypad } from './keypad';
import { viewSwitch } from '../viewSwitch';
import { placeNotes } from '../achievements/toast';
import { footer } from './footer';
import { moreMenu } from './moreMenu';

const root = document.querySelector<HTMLElement>('#dos')!;
const speed: SpeedSetting = { slowPc: undefined };
let pc: Computer | undefined;
let booting: Promise<void> | undefined;

const status = h('p', { class: 'dos-status', role: 'status', 'aria-live': 'polite' });
/** A short line under the controls (and read out by screen readers). */
function say(text: string): void {
  status.textContent = text;
}

const hint = h('p', { class: 'dos-off' }, 'The PC is switched off. Press Power.');
const crt = h('div', { class: 'crt dos-crt', role: 'region', 'aria-label': 'Computer monitor' }, hint);
const stage = h('main', { class: 'dos-stage' }, crt);
crt.addEventListener('click', () => (pc?.powered ? pc.focus() : void powerOn()));

// ---- the case's buttons ----------------------------------------------------------------

/** A button's face: its icon, and its word (only the icon shows on a phone; the word still names it). */
const face = (icon: string, word: string) => [h('span', { class: 'dos-ico', 'aria-hidden': 'true' }, icon), h('span', { class: 'dos-word' }, word)];
const toggle = (icon: string, word: string, title: string, onclick: () => void) =>
  h('button', { type: 'button', class: 'dos-btn', 'aria-pressed': 'false', title, onclick }, ...face(icon, word));
const powerBtn = toggle('⏻', 'Power', 'Switch the PC on or off', () => (pc?.powered ? powerOff() : void powerOn()));
const resetBtn = h(
  'button',
  { type: 'button', class: 'dos-btn', title: 'Restart the PC, as the reset button did', onclick: () => void reset() },
  ...face('↺', 'Reset'),
);
const turboBtn = toggle('⚡', 'Turbo', 'Turbo: 66 MHz, or off for a slow PC (about a 286)', () => setTurbo(speed.slowPc !== undefined));
let lastVolume = getVolume() || 1;
const soundBtn = toggle('🔊', 'Sound', 'Sound on or off', () => setSound(getVolume() === 0));
const blaster = h('input', { type: 'checkbox', id: 'dos-blaster', checked: soundBlaster(), onchange: () => setSoundBlaster(blaster.checked) });
const fullBtn = h('button', { type: 'button', class: 'dos-btn', title: 'Fill the screen', onclick: () => void fullScreen() }, ...face('⤢', 'Full screen'));

function setTurbo(on: boolean): void {
  speed.slowPc = on ? undefined : TURBO_OFF;
  turboBtn.setAttribute('aria-pressed', String(on));
}

function setSound(on: boolean): void {
  if (!on) lastVolume = getVolume() || lastVolume;
  setVolume(on ? lastVolume : 0);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.querySelector('.dos-ico')!.textContent = on ? '🔊' : '🔇';
}

async function fullScreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    say('This browser won’t show the page full screen.');
  }
  pc?.focus();
}
document.addEventListener('fullscreenchange', () => fullBtn.setAttribute('aria-pressed', String(!!document.fullscreenElement)));

// ---- power ------------------------------------------------------------------------------

function makePc(): Computer {
  return new Computer(crt, {
    speed,
    quickBoot: true,
    onDisksChanged: (insert) => void disks.refresh(insert),
  });
}

async function powerOn(): Promise<void> {
  if (booting) return booting;
  if (pc?.powered) return;
  pc ??= makePc();
  const on = pc;
  powerBtn.setAttribute('aria-pressed', 'true');
  crt.dataset.power = 'on';
  say('Booting…');
  booting = on.powerOn().finally(() => (booting = undefined));
  await booting;
  if (on.powered) say('');
}

/** Off at once (every sound with it); the next Power cold-boots a new PC, as on the desk. */
function powerOff(): void {
  const off = pc;
  if (!off) return;
  off.powerOff();
  off.dispose();
  pc = undefined;
  booting = undefined;
  powerBtn.setAttribute('aria-pressed', 'false');
  crt.dataset.power = 'off';
  disks.forget();
  say('Switched off.');
}

async function reset(): Promise<void> {
  powerOff();
  await new Promise((r) => setTimeout(r, 300));
  await powerOn();
}

/** The PC, switched on and at its DOS prompt (a game playing quits first). */
async function atPrompt(): Promise<Computer | undefined> {
  await powerOn();
  const on = pc;
  if (!on) return undefined;
  if (on.busy) await on.stopGame();
  if (on.busy) {
    say('Quit the program that is running first (Esc usually does it).');
    return undefined;
  }
  return on;
}

/** Types commands at the prompt, one line each. */
async function command(cmd: string): Promise<void> {
  const on = await atPrompt();
  if (on && !on.typeCommand(cmd)) say('Quit the program that is running first (Esc usually does it).');
}

// ---- disks, the CD, Game-Maker ------------------------------------------------------------

const disks = diskMenu({
  pc: () => pc,
  atPrompt,
  command,
  say,
});

const cdBtn = toggle('💿', 'Game-Maker CD', 'Put the Game-Maker CD in drive D:, or take it out', () => void setCd(!pc?.cdInserted));

async function setCd(on: boolean): Promise<void> {
  await powerOn();
  if (!pc) return;
  if (!on && pc.busy) return say('The CD-ROM is in use. Quit the running program first.');
  if (on) pc.insertCd();
  else pc.ejectCd();
  cdBtn.setAttribute('aria-pressed', String(on));
  say(on ? 'The Game-Maker CD is in drive D:.' : 'The CD is out of drive D:.');
}

async function startGameMaker(): Promise<void> {
  if (!(await atPrompt())) return;
  if (!pc?.cdInserted) await setCd(true);
  await command('GM');
}

const gmBtn = h('button', { type: 'button', class: 'dos-btn dos-primary', onclick: () => void startGameMaker() }, ...face('▶', 'Game-Maker'));
const bbsBtn = h(
  'button',
  { type: 'button', class: 'dos-btn', title: 'Call the BBS with the modem', onclick: () => void command('C:\nTERMINAL') },
  ...face('☎', 'BBS'),
);
const guideBtn = h(
  'button',
  {
    type: 'button',
    class: 'dos-btn',
    title: 'Read Game-Maker’s Owner’s Guide',
    onclick: () => void import('../manual/dosManual').then((m) => m.openDosManual()),
  },
  ...face('📖', 'Owner’s Guide'),
);

/** The addresses this page answers, for the page's own "Links to this page". */
const LINKS: [href: string, what: string][] = [
  ['dos.html', 'Boots straight into Game-Maker.'],
  ['dos.html?game=teddy', 'Puts a game’s disk in drive A: and opens it in Game-Maker, to play or change (any game’s id from the play page, play.html?game=…).'],
  ['dos.html?run=dos', 'Stays at the C:\\> prompt.'],
  ['dos.html?run=bbs', 'Calls the BBS.'],
];
const links = h('ul', { class: 'dos-links' }, ...LINKS.map(([href, what]) => h('li', null, h('a', { href }, href), ' ', what)));

// ---- the page --------------------------------------------------------------------------

// the less used, in the ⋯ menu; turbo and sound as icons (named for screen readers, with tooltips)
turboBtn.classList.add('dos-icon-only');
soundBtn.classList.add('dos-icon-only');
fullBtn.classList.add('dos-full');
const more = moreMenu('More: reset, the Sound Blaster card, the Game-Maker CD, the BBS and the Owner’s Guide', [
  resetBtn,
  h('label', { class: 'dos-check', for: 'dos-blaster', title: 'Without the card, games play their sounds on the PC speaker' }, blaster, 'Sound Blaster card'),
  cdBtn,
  bbsBtn,
  guideBtn,
]);

clear(
  root,
  h(
    'div',
    { class: 'dos-page' },
    h(
      'header',
      { class: 'dos-bar' },
      h('a', { class: 'dos-back', href: './', title: `Back to ${PRODUCT}`, 'aria-label': 'Back to the site' }, ...face('←', 'Site')),
      h('h1', null, 'DOS Game-Maker'),
      // Desk | DOS | Web, with the disk in drive A: coming along
      viewSwitch('dos', () => disks.current()),
      h('div', { class: 'dos-controls', role: 'group', 'aria-label': 'The PC' }, powerBtn, gmBtn, disks.button, turboBtn, soundBtn, fullBtn, more),
    ),
    stage,
    footer(
      [
        { icon: '⌨️', word: 'Keys', name: 'On-screen keys', content: keypad(crt) },
        { icon: '🔗', word: 'Links', name: 'Links to this page', content: links },
      ],
      status,
    ),
  ),
);

// Achievement notes: in a band the screen makes room for at the top of the stage, as wide as
// the screen, so they never cover it, the controls or the copy check's guide and card (which lie
// beside the screen, or over the bottom of the window). Two at a time; clicks go through them.
const NOTES_BAND = 48;
let notesWatched = false;
function placeNotesHere(host: HTMLElement): void {
  const fit = () => {
    const shown = host.childElementCount > 0;
    stage.style.paddingTop = shown ? `${NOTES_BAND}px` : '';
    if (!shown) return;
    const s = stage.getBoundingClientRect();
    const c = crt.getBoundingClientRect();
    host.style.top = `${s.top + 4}px`;
    host.style.left = `${Math.max(8, c.left)}px`;
    host.style.right = 'auto';
    host.style.width = `${Math.min(c.width, innerWidth - 16)}px`;
  };
  fit();
  requestAnimationFrame(fit); // once the screen has made room
  if (notesWatched) return;
  notesWatched = true;
  new MutationObserver(fit).observe(host, { childList: true });
  new ResizeObserver(fit).observe(crt);
}
placeNotes(placeNotesHere);

// GM's copy check and GM REGISTER: the Owner's Guide and the registration card beside the screen
regSide(
  () => crt,
  () => pc?.focus(),
);

setTurbo(true);
setSound(getVolume() > 0);
// straight into Game-Maker (the sound starts with the first key or click: browsers wait for one)
const params = new URLSearchParams(location.search);
const game = params.get('game');
const run = params.get('run');
void powerOn().then(async () => {
  if (!pc?.powered) return; // switched off while it booted
  if (run === 'dos') return;
  if (run === 'bbs') return command('C:\nTERMINAL');
  if (game && (await disks.openGame(game))) return;
  return startGameMaker();
});
void disks.refresh();

registerServiceWorker();
void import('../achievements/start').then((m) => m.startAchievements());
watchForUpdates();
