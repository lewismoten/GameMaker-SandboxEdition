// Credits, "AI tools and models, and the people": each AI tool and what it made, as NOTICE.md
// and the games' own credits say, then Lewis's part and the cast who appear as themselves
// (their pictures are the cast page's, public/cast/<id>.png).
import { h } from '../editor/core/ui';
import { section, ext, card, thumb } from './section';
import { NOTICE_URL } from '../edition';
import { CAST, type CastMember } from '../cast/castData';

/** One tool's card: its name, a short subtitle, two or three short lines, and any longer story in a small disclosure. */
const tool = (name: string, maker: string, made: string, story?: Parameters<typeof h>[2]) =>
  card(
    'h4',
    name,
    h('p', { class: 'card-meta' }, maker),
    h('p', null, made),
    story && h('details', { class: 'credits-mini' }, h('summary', null, 'More', h('span', { class: 'sr-only' }, ` about ${name}`)), h('p', null, story)),
  );

/** Who appears as themselves, as the cast page shows them (public/cast/<id>.png). */
const SELVES = ['teddy', 'gwinn', 'leo', 'chez'];
const member = (id: string) => CAST.find((m) => m.id === id)!;
const portrait = (m: CastMember) =>
  thumb(`./cast/${m.id}.png`, m.art.alt, [h('b', null, m.name), h('br'), m.role], `#/cast?who=${m.id}`, [m.art.width, m.art.height]);

export function peopleSection(): HTMLElement {
  return section(
    'credits-people',
    'AI tools and models, and the people',
    'Which tools made what, and the person behind all of it.',
    h('h3', { id: 'credits-ai' }, 'AI tools and models'),
    h(
      'div',
      { class: 'credits-cards credits-cards-grid' },
      tool(
        'Claude Opus 5.5',
        'Anthropic',
        'The web port and every new game: code, levels, art, sounds, FM music and text, directed by Lewis.',
        'It ported the 1994 desk and today’s editor and player from the original C source; drew the title and cover art of the Bard games that came without any; composed the music of Certified Rat Tickler, The Great Dairy Reckoning of 3:17 A.M. and Shakespeare in Sweatpants; ray traced the “Made with Game-Maker: Sandbox Edition” card new games can open with; made the desk’s Doc Leo black-light poster from two of Lewis’s photos, over many rounds of his corrections; and wrote and laid out TURBO BUTTON, the site’s 1990s game magazine. It is the only model named in the project’s commits.',
      ),
      tool('ChatGPT', 'OpenAI', 'The Bard songs’ lyrics and monologues, shaped from Lewis’s prompts.'),
      tool(
        'Riffusion',
        'now Google Flow Music',
        'Song recordings, vocals and covers. Later called Producer.ai (Mustard Seed Hustle’s animated cover). Free-plan audio is non-commercial.',
        [
          'One service under three names: Riffusion renamed itself Producer.ai, and Google bought it and made it Google Flow Music. Lewis pays for it now and made the animated covers on a paid plan, but every recording was made on the free plan, whose terms allow “personal, non-commercial uses” only, so the voice clips are not MIT licensed. ',
          ext(NOTICE_URL, 'NOTICE.md'),
          ' lists them.',
        ],
      ),
      tool('DeepAI', 'paid commercial plan', 'The Bard of Bizarre’s rooster logo and the desk’s “Moten Snow-to-Software Operations” poster.'),
      tool('ChatGPT-6.1 Sol', 'OpenAI', 'Reviews of the fork, TURBO BUTTON and the games’ content, now and then, which Lewis brings back as notes.'),
      tool(
        'Google Gemini 3',
        'Google',
        'A sounding board for ideas: 1990s nostalgia and Lewis’s memories, home-office supplies of the time, how the CMF music format worked, what came in a 1990s software box, how a save editor might look, and getting more out of a game. It drew the ASCII-art can in LUNCHMEAT’s flood on The Sofa.',
      ),
      tool('Whisper', 'OpenAI · MIT License', 'Word timings for cutting the voice clips. Runs on the developer’s computer; nothing ships.'),
    ),
    h('p', { class: 'muted' }, 'None of these tools’ code is used in the site or the games.'),
    h(
      'div',
      { class: 'credits-people-row' },
      h(
        'div',
        null,
        h('h3', { id: 'credits-lewis' }, 'Lewis Moten'),
        h(
          'div',
          { class: 'credits-person' },
          portrait(member('lewis')),
          h(
            'ul',
            { class: 'credits-list' },
            h(
              'li',
              null,
              'Lewis “Lewie” Moten III made this fork, directed the port and every game, and played each as it came together. His feedback shaped them.',
            ),
            h(
              'li',
              null,
              'Many games are drawn from ',
              ext('https://lewismoten.com/', 'his blog writing'),
              ', his photos, and his interests, experiences and hobbies.',
            ),
            h(
              'li',
              null,
              'KEEP IT BRIEF! is his 100 Word Stories, written for Laurence Simon’s weekly challenge on the ',
              ext('https://oneadayuntilthedayidie.com/', '100 Word Stories Podcast'),
              '. Laurence and the podcast’s writers and listeners chose the topics: each week’s winner picks the next one.',
            ),
            h('li', null, 'The Bard of Bizarre is his: the songs’ and monologues’ prompts, and the Doc Leo and THE\u00a0CHEZ photos.'),
            h(
              'li',
              null,
              'The photos on the BBSes are his, except one shot of him holding Teddy in front of THE\u00a0CHEZ, taken by Nicky Foster (see Pictures on the BBS, below).',
            ),
            h('li', null, 'The Sandbox BBS is named after the board he ran in Pittsburgh in the 1990s.'),
          ),
        ),
      ),
      h(
        'div',
        null,
        h('h3', { id: 'credits-cast' }, 'Appearing as themselves'),
        h('div', { class: 'credits-thumbs credits-cast' }, ...SELVES.map((id) => portrait(member(id)))),
        h('p', null, h('a', { href: '#/cast' }, 'Meet the whole cast →')),
      ),
    ),
  );
}
