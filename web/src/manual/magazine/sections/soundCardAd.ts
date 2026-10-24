// A full-page ad for the desk PC's sound card in the 1995 magazine's voice: Sound Boaster by
// Overcreative Labs, a made-up parody brand (NOTICE.md), Sound Blaster compatible as the clone
// cards were. Its joke is the card that brags, and its pitch the before and after of every
// 1995 sound card ad: the PC speaker's beep beside the card's boom. The price is part of the
// story; the button goes to the real switch under the desk's right speaker (desk/pc/blasterSwitch.ts).
import { adPage, adframe, art, callouts, card, grid, list, side } from '../blocks';
import type { MagSection } from '../types';

const soundCardAd = () =>
  adPage(
    'sound-card-ad',
    'Overcreative Labs',
    [
      adframe(
        'SOUND BOASTER',
        [
          callouts(
            'boaster',
            'The Sound Boaster card: a green circuit board with black chips, gold edge fingers, a metal bracket of jacks, a volume wheel and a joystick port, and its name printed across it in big white letters',
            [
              { x: 45, y: 13, title: 'FM music chip', text: 'Nine voices at once, in every song of every game.' },
              { x: 68, y: 13, title: 'Digital sound', text: 'Real recorded sound: voices, roars, breaking glass.' },
              { x: 11, y: 66, title: 'Joystick/MIDI port', text: 'For a joystick, or a music keyboard.' },
              { x: 11, y: 18, title: 'Jacks and a volume wheel', text: 'The wheel is because your parents asked.' },
              { x: 70, y: 75, title: 'The name', text: 'Readable from across the room. *Modest* isn’t on the board.' },
            ],
          ),
          grid(
            [
              [
                side(
                  'BEFORE: THE PC SPEAKER',
                  [
                    art('boaster-before', 'A kid at the computer, eyelids half shut, mouth a flat line, and a speech bubble that says beep'),
                    list(['Dragon: *bip.*', 'Explosion: *brrt.*', 'Theme song: *(nothing)*', 'Little brother: asleep']),
                  ],
                  'white',
                ),
              ],
              [
                side(
                  'AFTER: SOUND BOASTER',
                  [
                    art('boaster-after', 'The same kid, hair blown back by sound waves, eyes wide and mouth wide open, under the words KA-BOOM'),
                    list(['Dragon: **RAWWRR!**', 'Explosion: **KA-BOOM!**', 'Theme song: **nine voices**', 'Little brother: wide awake']),
                  ],
                  'yellow',
                ),
              ],
            ],
            0.38,
          ),
          card('ORDER SOUND BOASTER', ['Sound Boaster, 8-bit, **Sound Blaster compatible** ..... **$79.95**'], {
            fields: ['Name', 'City, State, ZIP'],
            go: 'go:desk/speakers',
            button: 'Flip the switch on the desk speakers',
          }),
        ],
        {
          burst: 'HEAR THE DIFFERENCE!',
          sub: 'From Overcreative Labs: *we would tell you how good it is, but the card already did.*',
          small:
            'Prices are part of the story; Sound Boaster and Overcreative Labs are made up. The card is in the desk PC, free: flip its switch on the right speaker, then start a game again.',
          tone: 'white',
        },
      ),
    ],
    'cyan',
  );

export const SOUND_CARD_AD: MagSection = {
  id: 'sound-card-ad',
  title: 'Overcreative Labs',
  toc: false,
  pages: () => [soundCardAd()],
};
