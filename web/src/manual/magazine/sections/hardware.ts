// Full-page ads for the desk's hardware: the modem and its line speeds (retro/bbs/lineSpeed.ts),
// the disk box, the ILLOGITECH speakers with the SOUND BOASTER switch, and the GRAVITAS game pad
// (desk/pc/). The makers
// are made up (only the historical names stay: Sound Blaster, VGA, MS-DOS); prices are part of
// the story, and each ad's button looks at its prop on the desk, where it is free.
import { LINE_SPEEDS, connectLine, speedWords } from '../../../retro/bbs/lineSpeed';
import { adPage, adframe, art, card, grid, list, p, side } from '../blocks';
import type { MagContext, MagSection } from '../types';
import '../gravitasAd.css';

const FREE = 'Prices are part of the story.';

const modemAd = () =>
  adPage(
    'hardware',
    'Tin Can Telecom',
    [
      adframe(
        'THE HOOTENANNY MODEM',
        [
          grid(
            [
              [
                art(
                  'modem',
                  'An external modem, a low charcoal box: DATA/FAX 14.4 kbps across the top of its front and its eight lights in a row under it, six of them lit red',
                ),
              ],
              [
                p('Dial every board in the 412 tonight. One modem, **every speed a BBS ever answered at**, and one more.'),
                list([
                  'Eight front lights: **MR, TR, OH, CD, HS, RD, SD, AA**. Watch your call happen',
                  'Pick the speed **right on the front**',
                  'Tired of waiting? It offers to **travel through time**',
                ]),
              ],
            ],
            0.3,
          ),
          side(
            'EVERY SPEED, ONE BOX',
            [
              p(LINE_SPEEDS.map((s) => `**${speedWords(s).replace(' ', '\u00a0')}**`).join(' · ')),
              p(
                `Bell 103 at 300 baud to V.34 and V.90 at the top, every one with the handshake you remember. At 14.4 it answers “${connectLine(14400).replace(/\//g, '/\u200b')}”. At **Unlimited**, today’s speed, there is no wait at all.`,
              ),
              p('Then dial [THE -= S A N D B O X =- BBS](go:bbs), 1-412-555-SAND.'),
            ],
            'cyan',
          ),
          card('ORDER YOUR HOOTENANNY', ['External modem, cable and phone cord ..... **$149.00**'], {
            fields: ['Name', 'City, State, ZIP'],
            go: 'go:desk/modem',
            button: 'Look at the modem on the desk',
          }),
        ],
        {
          burst: '300 BAUD TO UNLIMITED!',
          sub: 'From Tin Can Telecom: *we put the string between you and the world.*',
          small: `${FREE} The modem is on the desk, free: click the speed on its front to change it.`,
          tone: 'white',
        },
      ),
    ],
    'cyan',
  );

const diskBoxAd = (ctx: MagContext) =>
  adPage(
    'hardware-2',
    'Shoebox Media Co.',
    [
      adframe(
        'THE DISK-O-DECK',
        [
          grid(
            [
              [
                art(
                  'diskbox',
                  'A beige disk box with its smoked lid standing open: two rows of colored 3½" disks, GAMES and MY DISKS on label tape across the front, a round lock between them, and its key lying beside it',
                ),
              ],
              [
                p('Your games, standing tall. Flip through your 3½" floppies, **labels up**, and the one you want goes in drive A: in a snap.'),
                list([
                  'A **smoked see-through lid**: see every label without opening it',
                  'Two compartments: **GAMES** and **MY DISKS**, label tape included',
                  'Index cards to divide your rows, and room for the games you make yourself',
                ]),
              ],
            ],
            0.3,
          ),
          side(
            'LOCK IT AND LEAVE IT',
            [
              p(
                'A **round lock in the front wall** and **two keys** on a ring. Turn the key and the lid stays shut: your disks are secured while you’re away from the office, and nobody “borrows” your saved games over lunch.',
              ),
              p('Keep one key on your key chain and the spare in your desk drawer. *Not* in the disk box.'),
            ],
            'yellow',
          ),
          side(
            'FILL IT UP',
            [
              p(
                `Every Sandbox Software game comes on 3½" disks with printed labels: ${ctx.games
                  .filter((g) => g.kind === 'sandbox')
                  .map((g) => `[${g.title}](go:play/${g.id})`)
                  .join(' · ')}.`,
              ),
            ],
            'cyan',
          ),
          card('ORDER THE DISK-O-DECK', ['Disk box for 3½" diskettes, with lock and two keys ..... **$12.95**'], {
            fields: ['Name', 'City, State, ZIP'],
            go: 'go:desk/diskbox',
            button: 'Open the disk box on the desk',
          }),
        ],
        {
          burst: 'LOCKS TIGHT!',
          sub: 'From Shoebox Media Co.: *because the shoebox didn’t lock.*',
          small: `${FREE} The disk box is on the desk, free and unlocked: open it to pick a game.`,
          tone: 'pink',
        },
      ),
    ],
    'white',
  );

const speakersAd = () =>
  adPage(
    'hardware-3',
    'Illogitech',
    [
      adframe(
        'ILLOGITECH SPEAKERS',
        [
          grid(
            [
              [
                art(
                  'speakers',
                  'A pair of beige Illogitech computer speakers with dark cloth grilles: the left one has the brand on it, the right one a volume knob, a green power light, a headphone jack and a Sound Boaster switch set to on',
                ),
              ],
              [
                p('Hear your games the way the designers did. A matched pair for either side of your VGA monitor.'),
                list([
                  'A **volume knob** that turns with the mouse, the wheel or the arrow keys',
                  'A **power light** that comes on with your PC',
                  'A **headphone jack** for late-night play',
                ]),
              ],
            ],
            0.3,
          ),
          side(
            'THE SOUND BOASTER SWITCH',
            [
              p(
                'Under the knob is a switch that puts the Sound Boaster card in or takes it out. **On:** music and digital sound. **Off:** every sound on the PC speaker, and no music, the way a PC without the card heard it.',
              ),
              p('Games look for the card as they start, so flip it, then start your game again to hear the difference.'),
            ],
            'yellow',
          ),
          card('ORDER ILLOGITECH', ['Stereo speakers, pair ..... **$29.95**', 'Plugs into your sound card'], {
            fields: ['Name', 'City, State, ZIP'],
            go: 'go:desk/speakers',
            button: 'Look at the speakers on the desk',
          }),
        ],
        {
          burst: 'TURN IT UP!',
          sub: 'From Illogitech: *big sound for little rooms.*',
          small: `${FREE} The speakers are on the desk, free, with the Sound Boaster switch under the right one’s knob.`,
          tone: 'white',
        },
      ),
    ],
    'yellow',
  );

// The GRAVITAS ad has the look of a 1990s game pad ad (gravitasAd.css): a deep purple page with
// a glossy grid floor, a spaced serif headline with one word in hot pink, two pads tilted over
// each other with their buttons lit, and the pitch at the bottom right beside a small coupon.
const gamePadAd = () =>
  adPage(
    'hardware-4',
    'Gravitas',
    [
      adframe(
        'Winning isn’t everything…',
        [
          art(
            'gamepad',
            'A GRAVITAS PC GamePad, light gray and shaped like a peanut in its shell, tilted on a shiny purple floor: its joystick shaft is out, so the brass socket shows in the middle of the purple d-pad, and its red, yellow, green and blue buttons glow',
          ),
          art('gamepad', 'A second GRAVITAS PC GamePad tilted under the first, its white joystick shaft screwed into the d-pad and standing straight up'),
          side(
            'GRAVITAS PC GAMEPAD',
            [
              list([
                '**Four buttons:** red, yellow, green and blue',
                'A **joystick shaft that screws in** for flight games',
                'A purple **8-way d-pad**, diagonals and all',
                'Plugs into your **game port**. Nothing to install',
                'Ergonomically shaped like **your favorite snack**',
              ]),
              p('Four buttons on one plug: the pad borrows the second joystick’s button lines. Game-Maker games read the d-pad, red and yellow.'),
              p('**GRAVITAS**'),
              p('*serious about fun.*'),
            ],
            'black',
          ),
          card(
            'SHELL OUT FOR THE BEST',
            [
              'GRAVITAS PC GamePad, 8-way d-pad, 4 buttons, screw-in shaft ..... **$24.95**',
              'GRAVITAS Joystick, two-button flight stick ..... **$33.95**',
              'Now in Honey Roasted Purple',
              'Not edible. Do not dip in chocolate.',
            ],
            {
              fields: ['Name', 'City, State, ZIP'],
              go: 'go:desk/gamepad',
              button: 'Play with the pad on the desk',
            },
          ),
        ],
        {
          sub: 'But it’s **nuts** how well it plays!',
          small: `${FREE} The pad is on the desk, free, left of the keyboard, with its shaft lying beside it.`,
          tone: 'black',
        },
      ),
    ],
    'black',
  );

export const HARDWARE: MagSection = {
  id: 'hardware',
  title: 'Hardware',
  toc: false,
  pages: (ctx) => [modemAd(), diskBoxAd(ctx), speakersAd(), gamePadAd()],
};
