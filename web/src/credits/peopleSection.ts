// Credits, "AI tools and models, and the people": each AI tool and what it made, as NOTICE.md
// and the games' own credits say, then Lewis's part and the cast who appear as themselves.
import { h } from '../editor/core/ui';
import { section, ext } from './section';

const tool = (name: string, maker: string, made: string) => h('li', null, h('b', null, name), ` (${maker}): ${made}`);

export function peopleSection(): HTMLElement {
  return section(
    'credits-people',
    'AI tools and models, and the people',
    h('h3', { id: 'credits-ai' }, 'AI tools and models'),
    h(
      'ul',
      { class: 'credits-list' },
      tool(
        'Claude Opus 5.5',
        'Anthropic',
        'wrote the web port (the 1994 desk and today’s web editor and player) from the original C source, and built the Sandbox Software and Bard of Bizarre games in code: their code, levels, art, sounds, FM music arrangements and text, directed and reviewed by Lewis. It drew the title and cover art of the Bard games that came without any, and composed the music of Certified Rat Tickler, The Great Dairy Reckoning of 3:17 A.M. and Shakespeare in Sweatpants. It is the only model named in the project’s commits.',
      ),
      tool('ChatGPT', 'OpenAI', 'shaped the Bard of Bizarre songs’ lyrics and monologues from Lewis’s prompts.'),
      tool(
        'Riffusion, now Google Flow Music',
        'Riffusion; Google',
        'made the songs’ recordings, music and vocals, and the covers of Third Goat from the Left and Thread the Needle, Brother Camel (an animated one).',
      ),
      tool('Producer.ai', 'Producer.ai', 'made Mustard Seed Hustle’s animated cover.'),
      tool('DeepAI', 'DeepAI', 'made The Bard of Bizarre’s logo, the rooster in spectacles.'),
      tool(
        'Whisper',
        'OpenAI, MIT License',
        'gave the word timings used to find where each voice clip starts and ends in the recordings. It runs on the developer’s computer; none of it ships.',
      ),
    ),
    h('p', null, 'None of these tools’ code is used in the site or the games.'),
    h('h3', { id: 'credits-lewis' }, 'Lewis Moten'),
    h(
      'p',
      null,
      'Lewis “Lewie” Moten III made this fork. He directed the port and every game, played each as it came together, and his feedback shaped them. Many games are drawn from ',
      ext('https://lewismoten.com/', 'his blog writing'),
      ', his photos, and conversations about his interests, experiences and hobbies; KEEP IT BRIEF! quotes his 100 Word Stories. The Bard of Bizarre is his: the songs’ and monologues’ prompts are his, and the Doc Leo photos in the games and on The Sofa BBS, and THE CHEZ photos there, are his own. The Sandbox BBS is named after the board he ran in Pittsburgh in the 1990s.',
    ),
    h('h3', { id: 'credits-cast' }, 'Appearing as themselves'),
    h(
      'p',
      null,
      'Teddy the corgi, Gwinn, Doc Leo (Lewis’s friendly hobo clown) and THE CHEZ, Lewis’s tomato-red CitiCar. ',
      h('a', { href: '#/cast' }, 'Meet the cast'),
      '.',
    ),
  );
}
