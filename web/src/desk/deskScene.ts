// The desk as it is drawn: the room (poster, window, clock, door, phone, lamp…), the paper and
// disk box on the left, the Game-Maker box on the right, and the PC (case, drives, lights,
// keyboard, monitor). desk.ts gives it what the buttons do and works the parts it hands back.
import { h } from '../editor/core/ui';
import { sevenSegment, floppyDrive, cdDrive } from './pc/caseParts';
import { keyboard } from './pc/keyboard';
import { keyboardTray } from './pc/tray';
import { speakers } from './pc/speakers';
import { mug, wallPhone, deskLamp } from './room/deskProps';
import { deskModem } from './pc/modem';
import { snowyWindow } from './room/snowWindow';
// the box on the desk wears gmBox.css's ribbon; the box's insides load when it is opened
import './boxes/gmBox.css';
import { SANDBOX_SHOTS, sandboxShots } from '../gfx/sandboxShots';
import { keyCardSpot } from './pc/keyCard';
import { newsClipping } from './room/newsClipping';
import { phoneNotes } from './room/phoneNotes';
import { wallClock } from './room/wallClock';
import { wasteBasket } from './room/wasteBasket';
import { roomDoor } from './room/roomDoor';
import { paperStack } from './room/paperStack';
import { cover } from './props/propKit';
import { EDITION, FORK_NOTE } from '../edition';
import { viewSwitch } from '../viewSwitch';

/** `el` with a button laid over it (propKit.ts cover), for the box art's words. */
const withCover = (el: HTMLElement, name: string): HTMLElement => (cover(el, name), el);

/** What the desk's buttons and props do (desk.ts). */
interface DeskActions {
  power(onlyOn?: boolean): void;
  toggleTurbo(): void;
  eject(): void;
  ejectCd(): void;
  /** Types a command at the DOS prompt. */
  command(cmd: string): void;
  catalog(): void;
  magazine(): void;
  /** The disk box: pick a disk for drive A:. */
  flip(): void;
  openGmBox(): void;
  setZoom(zoom: 'manual' | false): void;
  gamePlaying(): boolean;
  restartGame(): boolean;
  /** The disk in drive A:, for the view switch. */
  diskInA(): string | undefined;
  toModern(): void;
  toModernAt?(hash: string): void;
}

export function deskScene(on: DeskActions) {
  const crt = h('div', { class: 'crt', role: 'region', 'aria-label': 'Computer monitor' }, h('div', { class: 'power-hint' }, 'Press the power button ⏻'));
  const floppy = floppyDrive(() => on.eject());
  // What you can do with the disk in drive A: (shown only while there is one).
  const driveActions = h('div', { class: 'drive-actions', hidden: true });
  const cd = cdDrive(() => on.ejectCd());
  const powerLed = h('span', { class: 'led green' });
  const turboLed = h('span', { class: 'led amber' });
  const mhz = sevenSegment(2);
  const powerBtn = h(
    'button',
    {
      class: 'case-btn power',
      'aria-label': 'Power',
      'aria-pressed': 'false',
      onclick: () => on.power(),
    },
    '⏻',
  );
  const turboBtn = h('button', {
    class: 'case-btn',
    'aria-label': 'Turbo',
    onclick: () => on.toggleTurbo(),
  });
  const box = h('div', { class: 'box' });
  // the playing game's key card, taped to the monitor
  // the PC's keyboard, and (on a phone) the strip of large keys under the PC
  const keys = keyboard(() => on.power(true));
  const keyCard = keyCardSpot(() => crt.querySelector<HTMLElement>('.crt-game canvas[tabindex]')?.focus());
  const spk = speakers({
    gamePlaying: () => on.gamePlaying(),
    restartGame: () => on.restartGame(),
  });
  const lamp = deskLamp();
  const modem = deskModem(() => on.command('C:\nTERMINAL'));
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
      viewSwitch('desk', () => on.diskInA(), {
        web: (href) => (on.toModernAt ? on.toModernAt(href.slice(href.indexOf('#'))) : on.toModern()),
      }),
      // where today's web has its ⚙ Settings button: the switch sits at the same top right in every view
      h('span', { class: 'view-switch-end', 'aria-hidden': 'true' }),
    ),
    h(
      'main',
      { class: 'desk-scene', 'aria-label': 'The 1994 desk' },
      poster(),
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
        paperStack({ catalog: () => on.catalog(), magazine: () => on.magazine() }),
        withCover(
          h('div', { class: 'prop disk-box', onclick: () => on.flip() }, box, h('span', { class: 'caption', 'aria-hidden': 'true' }, 'Disk box — pick a game')),
          'Disk box: pick a game to put in drive A',
        ),
        mug(),
      ),
      h(
        'div',
        { class: 'desk-right' },
        withCover(
          h(
            'div',
            {
              class: 'prop gm-box',
              onclick: () => on.openGmBox(),
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
          'Game-Maker SE 3.0 — open the box and look inside',
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
          h('button', { class: 'sticky', onclick: () => on.toModern() }, 'Too retro? Use today’s web →'),
          h(
            'button',
            {
              class: 'enlarge',
              title: 'Fill the window with the screen',
              'aria-label': 'Enlarge screen',
              onclick: () => on.setZoom('manual'),
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
    h('button', { class: 'zoom-exit primary', onclick: () => on.setZoom(false) }, 'Back to the desk'),
  );
  return { desk, crt, floppy, driveActions, cd, powerLed, turboLed, mhz, powerBtn, turboBtn, box, keyCard, spk, lamp, modem, boxTiles };
}

/** Homage: the winter of 1992-93, shoveling snow to buy Game-Maker. */
function poster(): HTMLElement {
  return h(
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
  );
}

/** The Game-Maker box's six screen tiles, drawn once the Sandbox games' shots are ready. */
export function drawBoxTiles(boxTiles: HTMLElement): void {
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
}
