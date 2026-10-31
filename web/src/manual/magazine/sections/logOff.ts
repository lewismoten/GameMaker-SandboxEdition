// Log Off the Games: a three-page Net Notes piece on useful things to do on the web in 1996, in
// the spirit of the era's "something productive to do online" columns and written fresh here.
// Every site, host and address is made up (.edu, .gov and country-code hosts that are not real
// institutions), and the three screenshots are real renders of made-up pages in a made-up browser
// (scripts/oldWebShots.ts, scripts/oldWebPages.ts).
import { art, head, list, note, p, side } from '../blocks';
import type { MagSection } from '../types';
import { mockSite, mockUrl } from '../mockSites';

// Every address, host, organization and title below comes from mockSites.json.
const dict = mockSite('dict');
const zip = mockSite('zip');
const recipes = mockSite('recipes');
const weather = mockSite('weather');
const yellow = mockSite('yellow');
const gopher = mockSite('gopher');
const dictDir = dict.path.slice(0, dict.path.indexOf('/', 1) + 1);
const dictProgram = dict.path.slice(dictDir.length);

export const LOG_OFF: MagSection = {
  id: 'logoff',
  title: 'Log Off the Games',
  blurb: 'Five useful things to do on the web (really), with the addresses to type',
  dept: 'NET NOTES',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Log Off the Games', {
          kicker: 'Net notes',
          deck: 'Five useful things to do on the web. Really. Put the joystick down, and bring a pencil, because the addresses are long.',
          size: 'l',
          level: 2,
        }),
        p(
          'Ever since word got out that this magazine was coming, readers have written to ask what the World Wide Web is *for*. We have looked into it. The honest answer is that most of it is somebody’s dog, somebody’s cat and a counter that says you are visitor number 004,127. This month we went looking for the rest. We found a handful of pages that do one plain job and do it well. Show them to the boss when he asks what you did all day.',
          { drop: true },
        ),
        head('1. The dictionary', { level: 3 }),
        p(
          `Start small. ${dict.org}’s ${dict.dept} keeps a 38,000-word dictionary on a machine in the basement of its library, and it answers anyone with a forms-capable browser. Type a word in the box, press Submit Query, and the definition comes back in a few seconds. That is the whole page. There is a banner and a guestbook nobody signs.`,
        ),
        art(
          'oldweb-dict',
          `A 640 by 480 screen of an old browser called WebWanderer 1.1 showing the ${dict.org} Word Lookup page: a blue and gold banner, a gray page, the word diskette typed in a box and three gray buttons`,
          `Plain gray, plain Times, one box and a button. ${dict.title.split(' ')[0]}’s word lookup is at *${dict.host}:${dict.port}${dict.path}*.`,
        ),
        p(
          `Mind the address. The ${dictDir.replace(/\//g, '')} part means the dictionary lives in one fellow’s home directory, and when he graduates, so may the dictionary. Bookmark it today. The same department keeps a thesaurus next door at *thes.pl*.`,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('2. Your town, by ZIP code', { level: 3 }),
        p(
          `${zip.org}, a federal office that exists nowhere but a gopher hole, runs a ZIP code lookup at *${mockUrl('zip')}*. Give it five digits and it gives you a town. Give it a town and it gives you the digits. Anyone who has ever stood at the post office window with a half-addressed birthday card will see why this made our list.`,
        ),
        head('3. Recipes, with no pictures', { level: 3 }),
        p(
          `The ${recipes.org} home economics club has put its whole casserole file online at *${mockUrl('recipes')}*. Eleven hundred recipes, sorted by main ingredient, in plain text, so it loads at 14.4 before the water boils. Another archive, this one in New Zealand, serves up soup at *${mockUrl('soups')}*. Print them. Do not try to eat the modem.`,
        ),
        head('4. A weather map, with a plain-spoken forecast', { level: 3 }),
        p(
          `${weather.org} posts a current weather map at *${mockUrl('weather')}*. It is a gray picture of the country with some blue and green blobs, and it is updated, they promise, every hour. It will not tell you whether to bring an umbrella. It will tell you the blobs are headed your way.`,
        ),
        side(
          'Reading an address, left to right',
          [
            list([
              '**http://** the way to talk to it. **gopher://** is the older way, with menus.',
              `**${dict.host}** the machine. The end tells you what kind of place: .edu a school, .gov an office, .com a business, and two letters, like .nz, a country.`,
              `**:${dict.port}** the port. Most servers answer on 80 and need no number. Some basements use something else.`,
              `**${dictDir}** the squiggle means a person’s own folder on that machine.`,
              `**${dictProgram}** a program on the server, not a page. It makes the answer when you press the button.`,
            ]),
          ],
          'cyan',
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('5. The yellow pages', { level: 3 }),
        p(
          `It is usually pizza. ${yellow.org}, a directory out of New Zealand with an American area code section, lets you type a business and an area code and gives back a list. Handy. Not handy: the background, which is the site’s name, over and over, in two shades of yellow, behind the text you are trying to read. The buttons look like toasted bread. We cannot say whether the author was happy with it, but he was thorough, and he has 1,000 listings.`,
        ),
        art(
          'oldweb-yellow',
          'A 640 by 480 screen of the same old browser showing Dandelion Pages: the page background is the words DANDELION PAGES repeated in yellow and gold, a red banner with a rotary telephone dial and a finger, a search form, and four brown textured buttons',
          `${yellow.org}, an example of what happens when a page tiles its own name behind its own text. Ugh. Holy smokes.`,
        ),
        side(
          'A note about addresses',
          [
            p(
              'Type them exactly. Capital letters count, the tilde is the squiggle left of the 1, and a trailing slash can be the difference between a page and a “404 Not Found.” If a host does not answer, try again tomorrow. Servers in basements need sleep too.',
            ),
          ],
          'cyan',
        ),
        note('Every site named in this article is made up for this magazine, and none of these addresses will answer. Bookmark early anyway.'),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Bonus: the card catalog, over gopher', { level: 3 }),
        p(
          `Not everything has made the jump yet. ${gopher.org}’s library still answers over gopher, a menu system from before pictures, at *${mockUrl('gopher')}*. Pick a menu, pick another, and you reach a search box. It is faster than any page on this list.`,
        ),
        art(
          'oldweb-gopher',
          `A 640 by 480 screen of the old browser showing a gopher menu for the ${gopher.description}: seven lines, each with a small folder, magnifying glass, page or telephone icon`,
          'Seven lines, no banner, no counter. We almost miss it already.',
        ),
        side(
          'Addresses to copy',
          [
            list([
              `*${mockUrl('dict')}*`,
              `*${mockUrl('zip')}*`,
              `*${mockUrl('recipes')}*`,
              `*${mockUrl('weather')}*`,
              `*${mockUrl('yellow', false)}*`,
              `*${mockUrl('gopher')}*`,
            ]),
          ],
          'yellow',
        ),
        p('*Tagline of the month:* “I haven’t lost my train of thought. It’s on a diskette in the other room.”'),
      ],
    },
  ],
};
