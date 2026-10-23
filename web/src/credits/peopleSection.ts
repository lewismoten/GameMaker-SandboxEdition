// Credits, "AI tools and models, and the people": each AI tool and what it made, as NOTICE.md
// and the games' own credits say, then Lewis's part and the cast who appear as themselves
// (their pictures are the cast page's, public/cast/<id>.png).
import { h } from '../editor/core/ui';
import { section, ext, card, thumb } from './section';
import { CAST, type CastMember } from '../cast/castData';

const tool = (name: string, maker: string, made: string) => card('h4', name, h('p', { class: 'card-meta' }, maker), h('p', null, made));

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
        'Anthropic · the only model named in the project’s commits',
        'Wrote the web port (the 1994 desk and today’s editor and player) from the original C source, and built the Sandbox Software and Bard of Bizarre games in code: their code, levels, art, sounds, FM arrangements and text, directed and reviewed by Lewis. It drew the title and cover art of the Bard games that came without any, and composed the music of Certified Rat Tickler, The Great Dairy Reckoning of 3:17 A.M. and Shakespeare in Sweatpants.',
      ),
      tool('ChatGPT', 'OpenAI', 'Shaped the Bard of Bizarre songs’ lyrics and monologues from Lewis’s prompts.'),
      tool(
        'Riffusion (renamed Producer.ai, now Google Flow Music, after Google bought it)',
        'One service under three names',
        'Made the songs’ recordings and vocals, the covers of Third Goat from the Left and Thread the Needle, Brother Camel (an animated one), and Mustard Seed Hustle’s animated cover, made while it was called Producer.ai.',
      ),
      tool('DeepAI', 'DeepAI', 'Made The Bard of Bizarre’s logo, the rooster in spectacles.'),
      tool(
        'Whisper',
        'OpenAI · MIT License',
        'Gave the word timings used to find where each voice clip starts and ends. It runs on the developer’s computer; none of it ships.',
      ),
    ),
    h('p', { class: 'muted' }, 'None of these tools’ code is used in the site or the games.'),
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
        h('li', null, 'The Bard of Bizarre is his: the songs’ and monologues’ prompts, and the Doc Leo and THE CHEZ photos.'),
        h('li', null, 'The Sandbox BBS is named after the board he ran in Pittsburgh in the 1990s.'),
      ),
    ),
    h('h3', { id: 'credits-cast' }, 'Appearing as themselves'),
    h('div', { class: 'credits-thumbs credits-cast' }, ...SELVES.map((id) => portrait(member(id)))),
    h('p', null, h('a', { href: '#/cast' }, 'Meet the whole cast →')),
  );
}
