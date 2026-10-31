// Walk-Through Talk: a two-page Design Workshop piece on the pass-through scene, the trick that
// gives Game-Maker a conversation, a found note or a page of story though PLAYGAME has no dialog
// box. The shots are real renders from three built games: the level with the hero standing on the
// trigger, and the picture and page it shows (passShots.ts). The recipe is the Ultimate Owner's
// Guide chapter 5's, in the zine's voice.
import { grid, head, list, note, p, pull, shot, side } from '../blocks';
import type { MagSection } from '../types';

const REALM = 'realm';
const BRIEF = 'brief';
const SLEUTH = 'sleuth';

export const PASS_THROUGH: MagSection = {
  id: 'passthrough',
  title: 'Walk-Through Talk',
  blurb: 'Dialog, notes and story pages from a game with no dialog box',
  dept: 'DESIGN WORKSHOP',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Walk-Through Talk', {
          kicker: 'Design workshop',
          deck: 'PLAYGAME has no dialog box. Three Sandbox games talk anyway, with a scene the hero only passes through. You can wire one up tonight.',
          size: 'l',
          level: 2,
        }),
        p(
          'Here is the problem. Your hero bumps into the old woman at the gate, and you want her to say something. Game-Maker will not draw a speech balloon. What it does draw, between any two scenes, is a picture. So make the talk a scene of its own: the hero steps on the old woman, the screen fades to her portrait and her words, a key press later he is standing right where he was, and she has said her piece. To the player she simply spoke.',
          { drop: true },
        ),
        grid(
          [
            [
              shot(
                REALM,
                'walk:Grandma Pim',
                'Quest for the Round Tuit: Pip standing on Grandma Pim in the town of Nowish, about to talk',
                'Quest for the Round Tuit. Pip walks into Grandma Pim, and the link under her feet fires.',
              ),
            ],
            [
              shot(
                REALM,
                'page:Grandma Pim',
                'Quest for the Round Tuit: Grandma Pim’s portrait with her words written over it',
                'The scene it goes to: her portrait and her words, then the town comes right back.',
              ),
            ],
          ],
          0.4,
        ),
        p(
          '*Quest for the Round Tuit* talks to everyone this way, thirty-one scenes of it. Every townsperson, signpost and found treasure is its own little scene, none lasts longer than a single tick of the game, and they all share one tiny map of their own, PASS.MAP, instead of the town’s.',
        ),
        pull('“To the player, the friend simply spoke.”'),
        side(
          'The four-step recipe',
          [
            list(
              [
                '**Add a scene on the same level map.** It loads the very map, blocks and monsters of the level your hero is standing in.',
                '**Make its intro picture the message.** A .GIF, an .FLI animation, a .TXT page, or a .LST slide show of all three.',
                '**Give it an all-black palette.** Every color in the scene’s palette is black.',
                '**Land on the way out.** The link into the scene drops the hero on the same cell as the scene’s one link out, and that link leads back to the level, beside the spot that sent him. Not on it, or he talks forever.',
              ],
              true,
            ),
          ],
          'yellow',
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Who else does it, and why it works', { kicker: 'Design workshop', size: 's', level: 2 }),
        grid(
          [
            [
              shot(
                BRIEF,
                'walk:Christmas Hotel WIP',
                'Keep It Brief: Joe standing on the reserve stacks’ shelf that holds the thirty-third book',
                'Keep It Brief. In the Reserve Stacks the hero steps onto the link to the thirty-third book.',
              ),
            ],
            [
              shot(
                BRIEF,
                'page:Christmas Hotel WIP',
                'Keep It Brief: the thirty-third book’s catalog card',
                'The thirty-third book’s card. Red sits at palette entry 0, so the page’s MORE… shows.',
              ),
            ],
            [
              shot(
                SLEUTH,
                'walk:Wrong: lila',
                'Final Curtain: Ada standing on the suspect she has just accused',
                'Final Curtain. Ada steps up to a suspect and makes her accusation.',
              ),
            ],
            [
              shot(
                SLEUTH,
                'page:Wrong: lila',
                'Final Curtain: the Commissioner’s answer to a wrong accusation',
                'The wrong verdict, a portrait and a page. Then back to the dawn scene to try again.',
              ),
            ],
          ],
          0.4,
        ),
        side(
          'Why black? Why the same map?',
          [
            p(
              '**Why black.** PLAYGAME fades every scene’s map in and out, even one that lasts a single tick. With an ordinary palette the level flashes up between the picture and the return, and it looks like a glitch. With every color black that fade happens unseen. The picture is not affected: a .GIF or .FLI carries its own colors.',
            ),
            p(
              '**Why the same map.** The scene is only seen for a tick, so the map is only there for the landing spot and the link out, and the level’s own map already has a cell your hero is standing near. It costs no new files, keeps one place to edit and puts the exit exactly where he was. If something does show, it is the room he was in, so nothing jumps.',
            ),
            list([
              '**Text pages need red.** PLAYGAME writes MORE… in the palette entry nearest red, and in an all-black palette that is entry 0. Give the page’s picture red at 0.',
              '**A gift on arrival.** The block he lands on is touched in that tick, so a talk can score, heal or raise a counter.',
              '**The level comes back fresh.** Keep talks away from prizes, or count what was taken.',
            ]),
          ],
          'yellow',
        ),
        note(
          'The recipe in full, with its traps, is in [The Ultimate Owner’s Guide](go:ultimate/scenes), chapter 5: Talk, pictures and cut-ins. *Final Curtain* leaves its palette lit for its right answers, so the talk just carries on in the room.',
        ),
      ],
    },
  ],
};
