// A one-sheet cooperative pilot, using the Backyard's existing manual and hint-book route.
import './relay.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from './kit';
import type { BoxItem } from './viewer';
import type { CatalogEntry } from '../../project/files';

export function relayItem(entry: CatalogEntry): BoxItem[] {
  if (entry.id !== 'teddy' || entry.series === 'starter') return [];
  return [
    {
      id: 'navigator-relay',
      title: 'Navigator and player relay',
      note: 'Two people · one backyard · one printable hint sheet',
      icon: '🧭',
      render: () => Promise.resolve([relaySheet()]),
    },
  ];
}

function relaySheet(): Sheet {
  const section = (title: string, text: string) => h('section', null, h('h2', null, title), h('p', null, text));
  return sheet(
    8.5,
    11,
    'relay',
    h('p', { class: 'relay-kicker' }, 'PLAY TOGETHER · TEDDY’S LITTLE BIG ADVENTURE'),
    h('h1', null, 'One backyard. Two explorers.'),
    h('p', null, 'Bring Doc Leo’s fedora to Pockets. Take turns steering Teddy and helping him find the way. No timer, score target or winner between you.'),
    section(
      'Start here',
      'Use a guest window or a separate browser profile, so nobody’s saved progress changes. Open Teddy’s Little Big Adventure, choose Play for a new run, and begin at Doc Leo’s Backyard. Do not load a saved game.',
    ),
    section(
      'Choose two roles',
      'Player: steer Teddy and say what you see. Navigator: hold this hint sheet, listen and suggest one step at a time. Ask before giving the next hint. Either person can ask to pause or stop.',
    ),
    h(
      'section',
      null,
      h('h2', null, 'Navigator’s hint sheet'),
      h(
        'p',
        null,
        'These hints come from the existing Teddy Hint Book, “1. Doc Leo’s Backyard.” For a larger picture, open this game’s Level Maps in the Library.',
      ),
      h(
        'ol',
        null,
        h('li', null, 'Head toward the old oak. Bark at a squirrel before passing it: face it and press Space.'),
        h('li', null, 'Hop through the oak’s branches one at a time. The fedora is in the top branches. Stand on it and press F to fetch it.'),
        h('li', null, 'Beyond the oak, look for soft dirt with paw prints at the tall fence. Stand on it and press Down to dig underneath.'),
        h('li', null, 'Carry the fedora to Pockets at Doc Leo’s little red car. The door opens; hop in to ride to Maple Street.'),
      ),
    ),
    section(
      'Swap at the fedora',
      'Once Teddy has fetched the hat, press F2 to open the status screen and pause play. Release every key. Exchange the controls and this sheet. The new player says “Ready,” then presses Enter to return. The former player now navigates the fence and car.',
    ),
    section(
      'Finish together',
      'Ride in the car and let the Maple Street introduction finish, voices included. That is the end of this activity, so cheer! Then choose: keep exploring, or stop. To stop, press Esc to quit to the menu, then close the guest window. No save is needed.',
    ),
    section(
      'Take another try',
      'If Teddy takes a nap, keep the current roles and try again. If the game ends, choose a fresh Play and swap at the hat again. Stopping early is fine. What was one helpful direction your partner gave?',
    ),
    h('footer', null, 'Keys: Left/Right walk · Up hops · Space barks · Down digs · F fetches · F2 pauses on status · Enter returns. Hints are always welcome.'),
  );
}
