// The Privacy page (#/privacy): what this site keeps on the device, how to clear it, what is
// sent and when. Written to match the code; privacyData.ts and privacy.test.ts keep it so.
import './privacy.css';
import { h, clear } from '../editor/core/ui';
import { PRODUCT } from '../edition';
import { LOCAL_KEYS, type SectionId } from '../backup/inventory';
import { KEPT, DATABASES, CACHE_NAMES } from './privacyData';

const SECTION_ORDER = Object.keys(LOCAL_KEYS) as SectionId[];

/** The page into `el`. */
export function renderPrivacy(el: HTMLElement): void {
  const ext = { target: '_blank', rel: 'noopener' };
  const main = h(
    'main',
    { class: 'privacy-page' },
    h('p', { class: 'privacy-back' }, h('a', { href: '#/' }, '← All games')),
    h('h1', null, 'Privacy'),
    h(
      'p',
      { class: 'lead' },
      `${PRODUCT} does not track you. There are no accounts, no cookies, no analytics, no ads and no counters of any kind, and nothing you do here is reported to anyone. It is safe for children to use.`,
    ),
    h(
      'section',
      { 'aria-labelledby': 'privacy-kept' },
      h('h2', { id: 'privacy-kept' }, 'What stays on this device'),
      h('p', null, 'Everything below lives in this browser on this device. It never leaves unless you export it yourself.'),
      h('ul', null, ...SECTION_ORDER.map((id) => h('li', null, KEPT[id]))),
      h('p', null, 'Databases (what a browser’s developer tools list):'),
      h('ul', null, ...Object.entries(DATABASES).map(([name, what]) => h('li', null, h('code', null, name), `: ${what}`))),
      h(
        'p',
        null,
        'The site also keeps a copy of its own pages and files for playing offline, in the browser’s cache storage (named ',
        h('code', null, CACHE_NAMES.join(', ')),
        '), once you use Play offline or the site installs its offline helper.',
      ),
    ),
    h(
      'section',
      { 'aria-labelledby': 'privacy-clear' },
      h('h2', { id: 'privacy-clear' }, 'How to clear it'),
      h(
        'ul',
        null,
        h('li', null, 'Settings, then Back up / restore, saves everything to a file you keep, in case you want it back later.'),
        h(
          'li',
          null,
          'In your browser’s settings, find “site data” or “cookies and site data”, look for this site and choose Clear or Delete. That removes all of the above, and the offline copy.',
        ),
        h('li', null, 'A private or incognito window keeps nothing after you close it.'),
      ),
    ),
    h(
      'section',
      { 'aria-labelledby': 'privacy-sent' },
      h('h2', { id: 'privacy-sent' }, 'What is sent, and when'),
      h(
        'p',
        null,
        'Playing, making games, the desk and the Library all run in your browser. The site asks its own server only for its pages, pictures, sounds and game files, the way any web page does.',
      ),
      h('p', null, 'Only these reach anywhere else, and only when you ask:'),
      h(
        'ul',
        null,
        h(
          'li',
          null,
          h('strong', null, 'Your own AI. '),
          'If you set up the Assistant, your messages, and the parts of your game the Assistant reads to answer, go to the address you typed, such as a model on your own computer or an OpenAI-style service you chose. The key goes only there. Nothing is sent until you set it up and send something, and Forget in AI setup removes the address and key.',
        ),
        h(
          'li',
          null,
          h('strong', null, 'Videos. '),
          'A Library video loads from YouTube (youtube-nocookie.com) only after you press Play, a chapter or a time. YouTube then sees the visit, as on any site that embeds it.',
        ),
        h(
          'li',
          null,
          h('strong', null, 'A game from a link. '),
          'If a link asks this site to open a game from another address, the site asks you first, then downloads that game. It sends no cookies or sign-ins with the request.',
        ),
        h('li', null, h('strong', null, 'Links you click. '), 'Links to GitHub, YouTube and other sites open their pages, which have their own rules.'),
      ),
    ),
    h(
      'section',
      { 'aria-labelledby': 'privacy-more' },
      h('h2', { id: 'privacy-more' }, 'More'),
      h(
        'p',
        null,
        'The site’s code is open, so all of this can be checked: ',
        h('a', { href: 'https://github.com/lewismoten/GameMaker-SandboxEdition', ...ext }, 'Source on GitHub'),
        '. Questions go there as an issue.',
      ),
    ),
  );
  clear(el, main);
}
