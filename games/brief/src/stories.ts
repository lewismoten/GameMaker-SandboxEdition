// Lewis Moten's thirty-two 100 Word Stories, word for word, as he wrote them for Laurence
// Simon's weekly 100 Word Stories challenge (2009-2014 and 2026). Only the typography is
// DOS-ified: curly quotes become straight ones, dashes become '-' or '--' and an ellipsis
// becomes '...' (PLAYGAME's font has none of them). A blank line between paragraphs is
// '\n\n'; a line break inside a verse paragraph is '\n'.
//
// `n` is the story's number in the order Lewis posted them; the library shelves them by
// wing (WINGS), four to a wing.

export interface Story {
  n: number;
  title: string;
  date: string;
  week: string;
  topic: string;
  /** Where it was posted. */
  url: string;
  text: string;
}

const STORIES: Story[] = [
  {
    n: 1,
    title: 'Where the Mountain Speaks',
    date: '2009-07-11',
    week: 'Week 168',
    topic: 'Shrouded in Mist',
    url: 'https://lewismoten.com/2009/07/11/100-word-stories-where-the-mountain-speaks/',
    text: "I heard stories of a wise person once that lived on a mountain. The path to wisdom was said to be shrouded in mist. The guru's sight was able to pierce through the depths of your own. Your life is an open book without words.\n\nI decided to take the trek to find the man. I found a village where many people spoke of the same story. They pointed to the mountain above the town; its peak was hidden by clouds.\n\nThe journey up the mountain took two days. At the top, I found a shack with only a mirror.",
  },
  {
    n: 2,
    title: "Dad's Weather System",
    date: '2009-07-18',
    week: 'Week 169',
    topic: "That's not thunder, it's...",
    url: 'https://lewismoten.com/2009/07/18/100-word-stories-dads-weather-system/',
    text: 'A large rumbling sounded in the corner of the room. Jenny poked her head up and looked around.\n\n"What was that?" she asked.\n\nHer father turned to her. "It was thunder!"\n\n"That wasn\'t thunder;" her mom said from the other room. She came into the room and gave Jenny\'s dad a bad look. "It was your father farting!"\n\nJenny went back to drawing with crayons under the end table.\n\nLater that night, Jenny\'s parents found the paper and put it on the fridge. Drawn on the paper was Jenny, her mother, and a scribbled brown cloud of gas named Dad.',
  },
  {
    n: 3,
    title: 'Great Minds, Strange Priorities',
    date: '2009-08-01',
    week: 'Week 171',
    topic: 'Unprepared',
    url: 'https://lewismoten.com/2009/08/01/100-word-stories-great-minds-strange-priorities/',
    text: 'As the night turned into morning, a man was still working tirelessly completing his latest project. A crowd of spectators had gathered talking amongst themselves questioning what it was that the man was doing.\n\n"Eureka! I have finally finished."\n\nHis tools fell to the ground, and the man started to walk away. Some reporters quickly went after him to ask about his feat. Some of the onlookers started to walk up to a large contraption of wires, pipes, screws, and duct tape.\n\nThe reporters were unprepared for the man\'s response.\n\n"It is a machine to program the time on VCR\'s."',
  },
  {
    n: 4,
    title: 'Crime, Panic, and... Mustard',
    date: '2009-08-15',
    week: 'Week 173',
    topic: 'Over/Under',
    url: 'https://lewismoten.com/2009/08/15/100-word-stories-crime-panic-and-mustard/',
    text: "Somewhere in the middle of Gotcha City,\nthere is a woman leaving a sub shop.\nAfter peering at her purchase,\nshe cries out in distress.\n\nAhh! I ordered a bologna sandwich,\nbut they didn't put any condiments on it.\nWhat do I do?\n\nLook! It's a bird, it's a plane!\nBloody Hell Governor, what is that thing?\n\nIt's Underwood!\n\nHello ma'am, I heard your call\nand came as fast as I could.\nI brought you to this Grey Poupon.\n\nNo, I can't accept this from you.\n\nWhy not? It is a gift!\n\nBut your under wear is over your pants.",
  },
  {
    n: 5,
    title: 'Duplicate Daughters, Divided Dad',
    date: '2009-09-12',
    week: 'Week 177',
    topic: 'Peas in a pod',
    url: 'https://lewismoten.com/2009/09/12/100-word-stories-duplicate-daughters-divided-dad/',
    text: "The professor guided his android daughter, Sally, into the cloning machine. He closed the door and turned it on. The machine started making loud noises until it came to a complete stop.\n\nSally stepped out of the machine. Then, Sally stepped out of it again. The two girls were like peas in a pod. He couldn't tell one from the other.\n\nThe two girls looked at each other, and then looked at the professor. They giggled and then pushed him into the machine and ran it in reverse.\n\nThe professor came out, only half the man he used to be.",
  },
  {
    n: 6,
    title: "A Pirate's Worst Surprise",
    date: '2009-09-19',
    week: 'Week 178',
    topic: 'Talk Like A Pirate Day!',
    url: 'https://lewismoten.com/2009/09/19/100-word-stories-a-pirates-worst-surprise/',
    text: "A ship over the helm bin spyed flying the queens flag.\n\nThe cap'n bin orderin I an' me harties to board the ship.\n\nI bin plunderin the seven seas all me life.\n\nNever did I see a dog be small fer the number o sharp-tongued wenches aboard.\n\nA boxom wench twice shivered me timbers before days end.\n\nHarr, the treasures bin good to me and me mates. Me harties bin looting the cargo of sugar and spices.\n\nJim Lad pried one open. \"Arrr.\" A large chest with no booty.\n\nTis no one wanted fer tem selves but the capn's squire.",
  },
  {
    n: 7,
    title: "Legend at the Water's Edge",
    date: '2009-10-10',
    week: 'Week 181',
    topic: 'Fourty',
    url: 'https://lewismoten.com/2009/10/10/100-word-stories-legend-at-the-waters-edge/',
    text: 'Each day the programmer goes for a walk around a pond to relax. He sees a man playing a flute. It echoes over the water and fills his ears with musical joy. A gathering of large fish are often seen swimming close to the man playing the flute.\n\nIdeas fill his head about a fairy from the woods that turned his wife into a fish, and that he plays only to lure his lost love back to him.\n\nIt is a silly story without an end or a purpose.\n\nAfter forty minutes, the programmer returns to a life of stress.',
  },
  {
    n: 8,
    title: 'Except Those Ones',
    date: '2010-01-31',
    week: 'Week 197',
    topic: 'Whatever you choose...',
    url: 'https://lewismoten.com/2010/01/31/100-word-stories-except-those-ones/',
    text: 'A pile of coins were poured out of a small brown bag down on the table. Johnny looked at them and was silent.\n\n"Well? Are you going to take any?"\n\nJohnny looked up with a confused look on his face. "Which ones can I have?"\n\nThe man gave a chuckle. "Whatever you choose..."\n\nJohnny started to reach out for the largest coin.\n\n"but not that one!"\n\nJohnny pulled his hand back and started to reach for another large coin.\n\n"Not that one either!"\n\nJohnny sat silently and then threw a dagger into the pirate\'s forehead. "I will take them all."',
  },
  {
    n: 9,
    title: 'The Day the Vase Fell',
    date: '2010-05-10',
    week: 'Week 210',
    topic: 'Easy, Router, Water Under The Bridge, You Broke My Vase, Something Simple',
    url: 'https://lewismoten.com/2010/05/10/100-word-stories-the-day-the-vase-fell/',
    text: '"You broke my vase!"\n\nBob the giant looked down\nat the screaming little person.\n\n"Why can\'t you do something so simple and easy?"\n\nBob scratched his head.\nBob was not bright, but\nthe folks tried to think of\nodd jobs he could do to\nmake him feel like a part\nof the community.\n\nThe little person started to scream to himself.\n"Water under the bridge," she told me.\n\n"He did not mean it," "it is not his fault."\n\nBob pointed at a small pile of\ncrushed electronics and the\nlittle person looked.\n\n"What is that?" he asked.\n\nBob grinned.\n"Router!"',
  },
  {
    n: 10,
    title: 'Becoming Purple',
    date: '2010-08-29',
    week: 'Week 227 (Soundcloud)',
    topic: 'Masks',
    url: 'https://lewismoten.com/2010/08/29/100-word-stories-becoming-purple/',
    text: "The hideous creation oozed itself around the lab. The doctor's experiment was getting out of hand. It was scary, except it wore silly masks of three cartoon characters.\n\nHe told one person of his experiment. It was after he injected her with nanites to cure his fiance's terminal disease. Before their very eyes, her arm turned a dark purple.\n\nIt later became shiny and then started to droop as if it were geletan. A few days later, she was just a mess of purple ooze moving around, longing for revenge.\n\nAs she absorbed him through osmosis, he turned purple too.",
  },
  {
    n: 11,
    title: 'The Interest We Lost',
    date: '2014-01-26',
    week: 'Week 405',
    topic: 'Account',
    url: 'https://lewismoten.com/2014/01/26/100-word-stories-the-interest-we-lost/',
    text: '"Found it!" Mara held up an old envelope from the filing cabinets. "This guy is a banker, but his student loans were in default before we stored everything to the cloud."\n\nPeton, gave her a smirk. Although he was the office clown, he did a very poor job of it. Peton leaned down and quietly said, "I used to be a banker, but I lost interest."\n\nMara rolled her eyes at the obvious pun. In a sigh, she stated, "You would be so much more attractive if you never opened your mouth. Can you just send this off to accounts?"',
  },
  {
    n: 12,
    title: 'Church of the First of Zero',
    date: '2014-02-02',
    week: 'Week 406',
    topic: 'Church',
    url: 'https://lewismoten.com/2014/02/02/100-word-stories-church-of-the-first-of-zero/',
    text: 'Those of us who interpret the code at the First of Zero welcome all classes. Every type is accepted regardless of redundancy, complexity, obsolescence, ignorance, bulkiness, or style. Our libraries are linked to our past instructions. Through various parameters (and arguments), we recognize objects by their value; and even references. All of us share a common interface. We understand that some of our inherited methods are without exception, while others are thrown at those who call us. Execution is our purpose. Any of our invalid syntax will be judged by the great compiler. In the end, you will be refactored.',
  },
  {
    n: 13,
    title: 'The Scissor Situation',
    date: '2026-01-04',
    week: 'Week 1028',
    topic: 'Sharp Scissors',
    url: 'https://lewismoten.com/2026/01/04/100-word-stories-the-scissor-situation/',
    text: 'The hobo clown, Doc, swiped the oversized,\nsharp scissors from a white-faced clown, Tippy.\n\nDoc then ran in circles and stepped backwards.\n\nTippy fell over, landing on his big red nose.\n\nChildren laughed at the spectacle.\n\nAn auguste clown, Mollywolly,\nshouted "STOP!"\n\nThe clowns froze in mid-step.\n\n"No running with scissors!"\n\nThe clowns ran in slow motion.\n\nThis time, Doc fell down.\n\nHe sat up and cried.\n\n"Did you hurt yourself?"\nMollywolly asked?\n\nDoc shook his head violently, yes.\n\n"I warned you!\nYou can\'t run in slow motion either."\n\nClown paramedics came, shrugged,\nand carried him away in a cot.',
  },
  {
    n: 14,
    title: 'Alone With a Broken Bulb',
    date: '2026-01-11',
    week: 'Week 1029',
    topic: 'Broken Light Bulb',
    url: 'https://lewismoten.com/2026/01/11/100-word-stories-alone-with-a-broken-bulb/',
    text: "George had an idea.\n\nIt wasn't a bright idea.\n\nIt wasn't even a good idea.\n\nIn fact, it wasn't even a bad idea.\n\nSuffice to say, if you could see the physical manifestation of it, you would only find a broken light bulb above George's head.\n\nThe idea wasn't original.\n\nIt was common.\n\nOr... at least, it used to be.\n\nGeorge's idea was no longer with the times.\n\nPeople moved on.\n\nThey found better lighting.\n\nThey upgraded.\n\nGeorge was in a closet, alone in the dark.\n\nHe was trying to find a light switch when most people talked to Alexa.",
  },
  {
    n: 15,
    title: 'Superpowers of Spooker Boy',
    date: '2026-01-18',
    week: 'Week 1030',
    topic: 'Paranoid',
    url: 'https://lewismoten.com/2026/01/18/100-word-stories-superpowers-of-spooker-boy/',
    text: "Spooker Boy was just like everyone else. But ever since his friends dared him to fetch a ball in old Mrs. Hendersons back yard, he's had superpowers. The little hairs on the back of his neck would rise up with a sinking feeling of paranoia, signalling that trouble was afoot.\n\nThree weeks ago, his friend Billy was walking on thin ice, often getting home late. Spooker boy warned him, claiming he had super powers. They got back just in time to hear his mom start calling out. Billy never doubted Spooker Boy's powers again.\n\nHe hadn't noticed the street lights.",
  },
  {
    n: 16,
    title: 'The Ledger of the Woods',
    date: '2026-01-25',
    week: 'Week 1031',
    topic: 'Pick Two: Hush, Beauty, Chisel, One-Eyed Owl, Interceptor',
    url: 'https://lewismoten.com/2026/01/25/100-word-stories-the-ledger-of-the-woods/',
    text: "The one-eyed owl had a chiseled jaw line. His hushed beak made him the perfect interceptor. Glaring silently at any who dared approach, he rarely spoke.\n\nThe moon's beauty in the night would have its light reflected from all who approached, timid and uncertain. He would ask the question of, not who, but whom?\n\nIt was rumored that only the lollipop guild was able to pass, once they answered a question central to the forest's concerns. Not of smoking forest fires, hooting over campgrounds, crying over garbage, or plows destroying the lands of mice.\n\nJust a centralized accounting of consumption.",
  },
  {
    n: 17,
    title: 'Nip from Another Dimension',
    date: '2026-02-01',
    week: 'Week 1032',
    topic: 'Fancy',
    url: 'https://lewismoten.com/2026/02/01/100-word-stories-nip-from-another-dimension/',
    text: "I saw an advertisement. It was a feast fit for a ruler of house cats. There was meat, treats, and fancy cat nip.\n\nWhat's fancy about it you ask?\n\nWell, there's a normal, plain cat nip that loses its scent the moment it hits the floor. The dried out flakes have no smell at all.\n\nBut the \"fancy\" catnip? Oh boy, I'll tell you. The POWER... It's out of this world! If you haven't experienced it before, I don't know how to express what it is. It's definitely the cat's meow.\n\nYou'll be seeing time shake hands with colorful sounds.",
  },
  {
    n: 18,
    title: 'Relativity Detour',
    date: '2026-02-08',
    week: 'Week 1033',
    topic: 'Vanishing Point',
    url: 'https://lewismoten.com/2026/02/08/100-word-stories-relativity-detour/',
    text: "As Jim drew lines on his drawing, a paradoxical view of stairs and archways started to form on the paper, similar to M.C. Escher's Relativity stairs. The tip of his pencil came too close to one of the vanishing points, and it sucked it out of his hands.\n\nJim looked closer, confused as to what just happened. He tried to brush some graphite away from the area, and was suddenly sucked into the drawing.\n\nLooking at his hands, half of them were drawn, and partially unfinished. He looked up to see a hole closing, peering back into his classroom.",
  },
  {
    n: 19,
    title: 'Champion of the Backyard Games',
    date: '2026-02-15',
    week: 'Week 1034',
    topic: 'Experiment',
    url: 'https://lewismoten.com/2026/02/15/100-word-stories-champion-of-the-backyard-games/',
    text: 'Harry had a spear.\nIt had a minty smell.\n\nHe thought he was being funny,\nhumming music\nas if he were in the Olympics.\n\nHe stuck his finger\nin the mint flavored wind\nand looked at a big red X\nin the distance.\n\n"...and the crowd looks on in anticipation,"\nhe announced.\n\nHe held up the spear\nand ran.\n\nHe held his hand back\nand threw it\nat the target.\n\n"DEAD CENTER!\n...and the crowd goes wild over the X Spear mint!"\nhe exclaimed.\n\nHe danced with joy,\njumping up and down,\ndonning a medal\nmade of yarn and tin.',
  },
  {
    n: 20,
    title: 'Hung Out to Dry',
    date: '2026-02-22',
    week: 'Week 1035',
    topic: 'Pick Two: Stings, Low flying, Supply, Clothes pegs, Stick',
    url: 'https://lewismoten.com/2026/02/22/100-word-stories-hung-out-to-dry/',
    text: 'Zip!\n\n"What was that?" asked John, as he dodged and touched his ear lobe.\n\nPhittt!\n\nJohn looked back. Nancy was throwing clothes pegs at him from her supply.\n\n"We are over!" she exclaimed as another low-flying peg clipped his forehead.\n\n"Over?" John asked. "We were together?"\n\nAnother peg smacked his temple as he fell into the clotheslines.\n\n"Wait, wait, wait! Were we really together?"\n\nSLAP!\n\nNancy tightened the strings around him with more clothes pegs.\n\n"Don\'t ever tell me you\'re tied up, unless I put you there," she demanded.\n\n"I\'m tied up," he whimpered.\n\n"Good riddance!"\n\n"I love you?"\n\n"Fine."',
  },
  {
    n: 21,
    title: 'The End?',
    date: '2026-03-01',
    week: 'Week 1036',
    topic: 'Twist',
    url: 'https://lewismoten.com/2026/03/01/100-word-stories-the-end/',
    text: 'Oliver Twist\'s parents were out of town,\nvacationing.\n\nHe hosted a party\nfull of energy and music.\n\nThere was someone in the other room\nplaying a game of Twister,\nshouting, "Left hand Blue!"\n\nHis friend Ern\u0151 kept to himself,\nsitting in a large armchair,\ntwisting a Rubik\'s Cube,\nand Timmy tested Tibetan tongue twisters.\n\nChubby Checker started singing the twist.\nOutside, a twister formed -- the ultimate plot twist.\nThe television died.\nHenry screamed.\n\nHis mother scolded him for twisting her TV rules.\n\nHe blamed his twisted sister\'s\ntwisted sense of humor.\n\n"But it is the theme, isn\'t it?" she chuckled.',
  },
  {
    n: 22,
    title: 'It Was Probably The Lighting',
    date: '2026-03-08',
    week: 'Week 1037',
    topic: 'Dear Everyone',
    url: 'https://lewismoten.com/2026/03/08/100-word-stories-it-was-probably-the-lighting/',
    text: 'Dear Everyone,\n\nExcept for the guy in the back, in the yellow shirt.\n\nBeing of sound body and mind, I hereby declare that you are all immorally dressed. Nobody will receive anything of mine. Except maybe Francis. I haven\'t decided yet. I leave it up to the guy in the yellow shirt.\n\nEveryone looked. Nobody was present.\n\n"Wasn\'t Uncle Joe colorblind?" Francis asked.\n\n"No."\n\n"Nancy has a yellow coat!"\n\n"It specifically said, \'Shirt... and guy.`"\n\n"What\'s that even mean?"\n\nA courier stepped in with a package.\n\nHe wore an almost yellow shirt.\n\nIt was probably the lighting.\n\n"Is Francis here?"',
  },
  {
    n: 23,
    title: 'Silence Has Teeth',
    date: '2026-03-15',
    week: 'Week 1038',
    topic: 'The noisiest place in the universe',
    url: 'https://lewismoten.com/2026/03/15/100-word-stories-silence-has-teeth/',
    text: 'Alone.\nIn the dark.\n\nIt is a cruel punishment. No one else around. Left to your thoughts.\n\nWith people, you could tell them to quiet. Alone, there are none to silence. The mind never stops talking.\n\nIt remembers every wrong, every injustice, every moment no one believed.\n\nThe silence feeds it.\n\n"Shut up!"\n\nThere are no consequences, only echoes. A mind can waste away arguing with itself.\n\nWhen the universe is quiet, the mind becomes the noisiest place in existence.\n\n"Please stop."\n\nThere is only one task left.\n\nNot escape.\nTo make peace with it.\n\n"That\'s enough, Warden."\n\nGood night.',
  },
  {
    n: 24,
    title: 'Bubble Rap',
    date: '2026-03-22',
    week: 'Week 1039',
    topic: 'Bubble Wrap',
    url: 'https://lewismoten.com/2026/03/22/100-word-stories-bubble-rap/',
    text: 'I went to the store just to kill this bore.\nLooked on the shelf - yea, I spotted an elf.\nGlanced to the left, saw no theft.\nTurned to the right - got a fright.\n\nPeering closer,\nsaw a jokester.\n\nBubbles three,\nand nothing more.\n\nPop-poppety-POP!\n\nHe gave a retort,\n"Life can be short."\n\nBlew through his cane -\nthree just the same.\n\nOne bubble big.\nTwo doubled small.\n\n"Thrrrrreeeeee in aaaaalllllll!"\nhe called with a drawl.\n\nI name this Fred,\nwith no hope left.\n\nI name this Holly,\nstill quite jolly and light.\n\nI name this...\n\nPOP!\n\nThat poor bubble -\nhe\'s dead!',
  },
  {
    n: 25,
    title: 'A very Cultured Performance',
    date: '2026-03-29',
    week: 'Week 1040',
    topic: 'Pick Two - Cover band, Slow down, Empty streets, Sculpture gallery, Shred',
    url: 'https://lewismoten.com/2026/03/29/100-word-stories-a-very-cultured-performance/',
    text: 'As the tour guide brought the group through a museum, a cheesy cover band was in one room playing ambient music of slicing, shredding, and melting cheese on a grill, another member was stretching mozzarella, while another was intensely focused curing a wheel of cheddar.\n\nThe exhibit itself was full of various sculptures of hats, swords, animals, flowers, and more.\n\nThey were colorful and seemed to wave in the air. It almost seemed as if static electricity drew them towards you.\n\nIn each room, the artist could be heard twisting, rubbing, and shaping new sculptures made of vibrant, colorful balloons.',
  },
  {
    n: 26,
    title: 'Repeat Until Texture Is Uniform',
    date: '2026-04-12',
    week: 'Week 1042',
    topic: 'Chip',
    url: 'https://lewismoten.com/2026/04/12/100-word-stories-repeat-until-texture-is-uniform/',
    text: 'Charles has indirectly pierced corn husks inside Paul\'s\nchipper.\n\nHowling in panic, Charles had ignored pain, creeping humbly, influencing present conditions.\n\nHope infused Paul, carrying him. "I progressed--\nclearing hazards, I\'ll persevere," calming hands in place.\n\nCharles, having ingested protruding cobs, hummed in place.\n\n"Charles?"\n\nHe imagined patterns -- circles, heart-infused impressions, pulsating.\n\n"Charles!?"\n\nHope impoverished Paul.\n\n"Charles, help, I--" paused.\n\nCold hesitation intensified panic.\nCrushing him in paralysis.\nCogs halted in place.\nCharles hung, irregular.\n\nPaul couldn\'t help.\n\n"I\'m powerless..."\n\nCrushing hum intensified, persistently.\nConscious horror invading perception.\nClearly, husks in place.\nChewed, hashing into paste.\n\nCuriously, hints irresistibly palatable.',
  },
  {
    n: 27,
    title: 'Craigslist Said It Was Healthy',
    date: '2026-04-26',
    week: 'Week 1044',
    topic: 'Pick Two - Fever, Shoulder, Torpid, Hairbrush, A dead plant',
    url: 'https://lewismoten.com/2026/04/26/100-word-stories-craigslist-said-it-was-healthy/',
    text: '"Take care of Jarold. He\'s a bit troublesome in the mornings," my manager said, feverishly preparing for his vacation.\n\nJarold... was a ficus.\n\nJarold was dead on arrival.\n\nPanic set in. I scrolled the marketplace and found an ad.\n\nWe met in a questionable alley downtown.\n\nThe woman rummaged through her truck, hair brushing over junk, and handed me a torpid plant.\n\n"This one matches your aura".\n\nI couldn\'t shoulder the guilt. It was eating me alive.\n\nBy the time my manager returned, he paused, surprised.\n\n"Keep the plant", he said, "Jarold seems to like you."\n\nJarold Jr. is thriving.',
  },
  {
    n: 28,
    title: 'Prompted Royalty',
    date: '2026-05-03',
    week: 'Week 1045',
    topic: 'Family Portrait',
    url: 'https://lewismoten.com/2026/05/03/100-word-stories-prompted-royalty/',
    text: 'Secret Service agents entered the studio and informed Nancy, the photographer, that someone important was about to arrive. More agents swept through the back room, upstairs, and secured the building. Snipers could be seen on a nearby roof outside the windows.\n\nThe King and Queen soon arrived for a family portrait.\n\n"Where is your family?" Nancy asked.\n\nThe King turned to her and said, "Probably off saving the world or something. Can\'t you just Photoshop them in?"\n\n"No worries. I can use ChatGPT," Nancy replied. "Done."\n\nThe Queen asked, "Don\'t you need to take our picture first?"\n\nNancy replied, "Nope."',
  },
  {
    n: 29,
    title: 'The Incomplete Idiot',
    date: '2026-05-10',
    week: 'Week 1046',
    topic: 'Complete Idiot',
    url: 'https://lewismoten.com/2026/05/10/100-word-stories-the-incomplete-idiot/',
    text: 'The newspaper described John as an idiot. Frustrated, he threw the paper down in his lap.\n\n"That editor is a complete idiot," he said.\n\nHis wife, well aware of the outdated clinical classifications, asked, "How does that compare to an incomplete idiot?"\n\nJohn stared at her, irritated, trying to understand her point.\n\n"He called me an idiot," he explained.\n\n"The last I checked, both you and he had PhDs," she replied. "I don\'t think that word means what you think it means."\n\nJohn grumbled behind the newspaper, "As you wish," and continued reading the article written by a complete idiot.',
  },
  {
    n: 30,
    title: 'Steam-Powered Summer',
    date: '2026-05-17',
    week: 'Week 1047',
    topic: 'Railing',
    url: 'https://lewismoten.com/2026/05/17/100-word-stories-steam-powered-summer/',
    text: 'The couple leaned against the decorative railing of the Delta Queen, admiring the view of the natural vegetation along the shores of the Mississippi River.\n\nBehind them, the steam-powered calliope organ was playing a joyful tune, echoing back from the valleys.\n\nTheir excitement was building, as they would be next to get a chance to learn how to play it, and be rewarded with a certificate.\n\nDecades later, long after a divorce, their son would find an old framed photograph of the beautiful steam-powered paddle boat on her wall, showing that his mother still cherished that moment in time.',
  },
  {
    n: 31,
    title: "Santa's Little OSHA Violation",
    date: '2026-05-24',
    week: 'Week 1048',
    topic: 'Give Up',
    url: 'https://lewismoten.com/2026/05/24/100-word-stories-santas-little-osha-violation/',
    text: 'A jolly "Ho-ho-ho" came from behind, followed by "Hidey ho, neighbor!"\n\n"Hello, Santa," little Timmy replied.\n\n"Why the long face?" Santa asked.\n\nTimmy showed him a block of wood. "I\'m building a pinewood derby car, but I have no tools."\n\nSanta put his hands on his waist and made grunting sounds, followed by the order: "Never give up. Never surrender!"\n\nSanta went into his bag and grabbed a few presents, handing them over. Timmy quickly ripped open the packages, finding a chainsaw, angle grinder, nail gun, industrial CNC router, plasma cutter, and a flame thrower, while Santa shouted, "More power!"',
  },
  {
    n: 32,
    title: 'Everything But the Tea',
    date: '2026-06-07',
    week: 'Week 1050',
    topic: 'Tokyo',
    url: 'https://lewismoten.com/2026/06/07/100-word-stories-everything-but-the-tea/',
    text: '"I need to grab a bottle of tea", the tourist said.\n\nThey stepped into a konbini. A selection of 30 rice balls caught their attention. After five minutes, they panicked and grabbed the only flavor they couldn\'t identify, deciding to live life to its fullest and take a chance.\n\nThe little store in Tokyo had a better life organization than they did.\n\nThey picked up fried chicken, pudding, socks, and a phone charger.\n\n"Would you want chopsticks, a spoon, a bag, a receipt, and heating?" the cashier asked.\n\nSo many questions, and overcome with a fear of forgetting something.\n\n"Yes"',
  },
];

/** The library's eight wings, each holding four books (story numbers, in shelf order). */
export interface Wing {
  /** File name stem for the wing's map, blocks and monsters. */
  id: string;
  name: string;
  books: number[];
}

export const WINGS: Wing[] = [
  { id: 'clown', name: 'Clown Alley', books: [13, 25, 24, 11] },
  { id: 'lab', name: 'The Laboratory', books: [3, 5, 10, 12] },
  { id: 'docks', name: 'The Docks', books: [6, 8, 7, 30] },
  { id: 'yard', name: 'The Backyard', books: [15, 19, 20, 31] },
  { id: 'living', name: 'The Living Room', books: [2, 21, 22, 14] },
  { id: 'after', name: 'After Hours', books: [1, 16, 23, 29] },
  { id: 'other', name: 'Other Dimensions', books: [17, 18, 4, 26] },
  { id: 'future', name: 'The Future Shelf', books: [28, 32, 27, 9] },
];

export const story = (n: number): Story => {
  const s = STORIES.find((x) => x.n === n);
  if (!s) throw new Error(`No story ${n}`);
  return s;
};
