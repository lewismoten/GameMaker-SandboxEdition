// Log Off the Games: a Net Notes piece on useful things to do on the web in 1996, in
// the spirit of the era's "something productive to do online" columns and written fresh here.
// Every site, host and address is made up (.edu, .gov and country-code hosts that are not real
// institutions), and the seven screenshots are real renders of made-up pages in a made-up browser
// (scripts/oldWebShots.ts, scripts/oldWebPages.ts).
import { art, head, list, note, p, side } from '../blocks';
import type { MagSection } from '../types';
import { mockSite, mockUrl } from '../mockSites';

// Every address, host, organization and title below comes from mockSites.json.
const dict = mockSite('dict');
const zip = mockSite('zip');
const recipes = mockSite('recipes');
const weather = mockSite('weather');
const soups = mockSite('soups');
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
          `Start small. ${dict.org}’s ${dict.dept} keeps a 38,000-word dictionary on a machine in the basement of its library, and it answers anyone with a forms-capable browser. Type a word in the box, press Submit Query, and the definition comes back in a few seconds. That is the whole page. There is a banner and a guestbook nobody signs. Every kid who ever asked what a word meant heard it: “Look it up, dear.” Said sweetly, and meaning that you would not. Now you can look it up without leaving the chair, and the sentence has finally run out of excuses.`,
        ),
        p(
          `Mind the address. The ${dictDir.replace(/\//g, '')} part means the dictionary lives in one fellow’s home directory, and when he graduates, so may the dictionary. Bookmark it today.`,
        ),
        art(
          'oldweb-dict',
          `A 640 by 480 screen of an old browser called WebWanderer 1.1 showing the ${dict.org} Word Lookup page: a blue and gold banner, a gray page, the word diskette typed in a box and three gray buttons`,
          `Plain gray, plain Times, one box and a button. ${dict.title.split(' ')[0]}’s word lookup is at *${dict.host}:${dict.port}${dict.path}*.`,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('2. Your town, by ZIP code', { level: 3 }),
        art(
          'oldweb-zip',
          `A 640 by 480 screen of the old browser showing the ${zip.title} page: a plain gray form with a ZIP code box, a town box, a gray Submit Query button, and a bordered table with one result, ${(zip.items ?? [])[0].split('|')[1]}`,
          'A form, a button, a table. That is the whole government.',
        ),
        p(
          `${zip.org}, a federal office that exists nowhere but a gopher hole, runs a ZIP code lookup at *${mockUrl('zip')}*. Give it five digits and it gives you a town. Give it a town and it gives you the digits. Anyone who has ever stood at the post office window with a half-addressed birthday card will see why this made our list.`,
        ),
        head('3. Recipes, with no pictures', { level: 3 }),
        art(
          'oldweb-recipes',
          `The old browser showing the ${recipes.title} home page: a bulleted list of recipe links, an under construction sign with a hard hat, and a visitor counter`,
          'A home page in its natural state: a list, a sign and a counter.',
        ),
        p(
          `The ${recipes.org} home economics club has put its whole casserole file online at *${mockUrl('recipes')}*. Eleven hundred recipes, sorted by main ingredient, in plain text, so it loads at 14.4 before the water boils. Print them. Do not try to eat the modem.`,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Also: soup, from the bottom of the world', { level: 3 }),
        art(
          'oldweb-soups',
          `The old browser showing the ${soups.title}: an index of soup recipe folders`,
          `The soup archive in New Zealand, a plain index with one fine mirror link.`,
        ),
        p(
          `Another archive, this one in New Zealand, is an index of soup and nothing else, which is how soup should be. Find it at *${mockUrl('soups')}*. It is cheaper than a can.`,
        ),
        head('4. A weather map, with a plain-spoken forecast', { level: 3 }),
        art(
          'oldweb-weather',
          `The old browser showing the ${weather.title}: a pixel-art map of the United States with blue, green, yellow, orange and red temperature blobs, and a list of regions`,
          'A gray country with blobs. The red one is somebody’s problem.',
        ),
        p(
          `${weather.org} posts a current weather map at *${mockUrl('weather')}*. It is a gray picture of the country with some blue and green blobs, and it is updated, they promise, every hour. It will not tell you whether to bring an umbrella. It will tell you the blobs are headed your way.`,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('5. The yellow pages', { level: 3 }),
        p(
          `This is where the Web is headed, and ${yellow.org} has already arrived. A directory out of New Zealand with an American area code section, it lets you type a business and an area code and gives back a list. Our reviewer found it breathtaking. The clip art! A rotary dial with a finger in it, which is exactly what a telephone directory should have on it. The background tiles the site’s own name, over and over, in two shades of yellow, so no visitor can forget where they are. The buttons are textured, like toasted bread, and the banner has a drop shadow, the first we have seen on a page that was not trying to sell us a modem. “It takes full advantage of everything the Web can do,” he wrote, and then, in a smaller voice, “I am told there is also text.” There is: 1,000 listings, and we have never been more certain of anything than that the author is not done adding clip art.`,
        ),
        art(
          'oldweb-yellow',
          'A 640 by 480 screen of the same old browser showing Dandelion Pages: the page background is the words DANDELION PAGES repeated in yellow and gold, a red banner with a rotary telephone dial and the name in big yellow letters, a search form in a beveled table, and four brown textured buttons',
          `${yellow.org}, the cutting edge: clip art, a tiled background, textured buttons and a banner. Our reviewer would like to see anyone top it.`,
        ),
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
          'A note about addresses',
          [
            p(
              'Type them exactly. Capital letters count, the tilde is the squiggle left of the 1, and a trailing slash can be the difference between a page and a “404 Not Found.” If a host does not answer, try again tomorrow. Servers in basements need sleep too.',
            ),
          ],
          'cyan',
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
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
        note('Every site named in this article is made up for this magazine, and none of these addresses will answer. Bookmark early anyway.'),
        p('*Tagline of the month:* “I haven’t lost my train of thought. It’s on a diskette in the other room.”'),
      ],
    },
  ],
};
