// The games the hint line gives hints for, in the order the phone menu reads them, with a few short,
// spoiler-light hints each. They are cut from that game's own hint book (games/<id>/printables.json,
// `hintbook` item), reworded to be heard. Only games that have a hint book are here, and a secret
// game (about.json "secret": true) never is; hintTree.test.ts checks both against games/. Pure data.

export interface HintGame {
  /** The folder under games/. */
  id: string;
  /** The name as the phone says it. */
  title: string;
  /** Two to four hints, one or two sentences each. */
  hints: string[];
}

export const HINT_GAMES: HintGame[] = [
  {
    id: 'depth',
    title: 'Depth Perception',
    hints: [
      'Amber blocks are the near plane. Roll onto a focus ring with a cyan lens, and the far plane comes into focus.',
      'Stuck after pulling focus? Every focus ring works both ways. Step off it and back on to pull focus again.',
      'Pulling focus puts the scene back the way it was. Photons and bulbs come back, but your lenses stay in your pocket.',
    ],
  },
  {
    id: 'sleuth',
    title: 'Final Curtain',
    hints: [
      'Start at the box office, off the west side of the lobby. There is a key on the floor and a seating chart on the desk.',
      'Victor’s office is locked. The key from the box office opens it, so walk into the door.',
      'To get backstage, take the west aisle to the front. Then go up through the pass door at stage left.',
    ],
  },
  {
    id: 'brief',
    title: 'Keep It Brief',
    hints: [
      'If THE END will not open, press F2. It counts the words you carry, and every book has exactly one hundred.',
      'THE END opened, but nothing happened? Walk onto the open page, then onto the gold bookmark right behind it.',
      'Brass bars on a door mean that wing belongs to a later chapter. Finish your chapter first, then visit the Reserve Stacks.',
    ],
  },
  {
    id: 'maximus',
    title: 'Maximus, the Hundred Worlds',
    hints: [
      'To leave the training deck, pay the credit door, ride the lift, and get through the clearance gate in the pod bay. Then walk into the airlock.',
      'To land on a planet, fly the pod into the middle of the planet on the sector chart.',
      'To get back to space, walk into the uplink beacon behind you where you landed. On sea worlds, surface at the buoy.',
    ],
  },
  {
    id: 'logic',
    title: 'Ohm Sweet Ohm',
    hints: [
      'Bump a switch from below to turn it on. Current runs along the wire to the gate, so keep off the wire while it glows.',
      'A gate stays open once current has reached it. Turn the power off again, wait for the last spark to drain away, then walk through.',
      'An arrow is a diode, and you can only go through it the way it points. Turn the switch on, wait for the gate to open, then turn the switch off again before you roll through.',
    ],
  },
  {
    id: 'realm',
    title: 'Quest for the Round Tuit',
    hints: [
      'Go first north up the road from Nowish to Laterburg. Walk into the King on his throne to get the Royal Writ.',
      'To talk to people, walk into them. To buy things, walk into the counter once to pay, and again to take it.',
      'Out of gold? Foes drop gems, and the dungeons have chests.',
    ],
  },
  {
    id: 'sandcast',
    title: 'Sandcastle Knight',
    hints: [
      'The shovel is beside Teddy’s toy chest in the southwest corner. Press G to pick it up.',
      'To get into Anthill Keep, dig through the ring of dunes with the shovel. Two bites and a dune is gone.',
      'Gwinn will move for the tennis ball. Walk toward her and press F, and she trots off happy to bury it.',
    ],
  },
  {
    id: 'snowbound',
    title: 'Snowbound',
    hints: [
      'Press F2 to tip out the coffee can and see how much money you have.',
      'Short at the register? Go back out to the mall lot. A squall buries it again every twenty seconds or so, and that means more scoops and more dollars.',
      'There is a five dollar tip in an envelope beside Mrs. Haines’ porch on Gale Street.',
    ],
  },
  {
    id: 'teddy',
    title: 'Teddy’s Little Big Adventure',
    hints: [
      'Found the costume piece? Bring it to Pockets at Doc Leo’s little red car at the end of the stop. The door pops open.',
      'The floating balloon dogs are up high and never on the way. There are three in every stop, so take the detour.',
      'Gwinn running laps with a green ball? Face her and press Space as she zooms by.',
    ],
  },
  {
    id: 'teddy2',
    title: 'Teddy’s Little Bigger Adventure',
    hints: [
      'That faint wispy thing in the air is a scent. Stand next to it and press S to sniff.',
      'Found the thing Gwinn dropped? Bring it to Doc Leo at THE CHEZ at the end of the stop. Its door opens for it.',
      'Gwinn’s collar went down the laundry chute. Drop through the hole in the laundry room floor, then sniff in the basement.',
    ],
  },
  {
    id: 'teddy3',
    title: 'Teddy’s Little Biggest Adventure',
    hints: [
      'The card before each stop says who you are playing. Teddy runs the errands, and on the road you drive THE CHEZ.',
      'If a button does nothing, high five it from just beside it, facing it. Then watch the spark run down the wire.',
      'The keys are in the blue cabinet on the workbench. Hop onto the bench and high five the button on the wall above it.',
    ],
  },
  {
    id: 'tuneup',
    title: 'Tune-Up',
    hints: [
      'Each door waits for something: a clamp, a pluck, enough notes, or every oiled Squeak. Press F2 to see what you have.',
      'To skip a cartoon, press a key. The next key gets you to the level.',
      'If the crank will not turn, stand right under it and hold Space. Eight notches fill the gauge.',
    ],
  },
  {
    id: 'blaster',
    title: 'Virus Blaster',
    hints: [
      'You are always shooting. The twin guns fire whenever the Blaster moves, so just steer under the virus.',
      'The screen never scrolls backward. The arrow pointing back only brakes, so dodge sideways.',
      'Save the Nova Bombs for bosses, and fire from right under the target. Press F2 to see your energy.',
    ],
  },
  {
    id: 'year2000',
    title: 'In the Year 2000',
    hints: [
      'The Laser-Tag Zapper is in your own backyard, north of the garage wall. The clicker on Grandpa’s key ring opens the gate first.',
      'Grandpa’s keys are in the hedge garden at the bottom left of the neighborhood. A robo-mower guards them.',
      'The hoverboard kids zoom up and down the roads. Look both ways, and cross behind them.',
    ],
  },
];

/** Games on a menu page (keys 1 to 8; 9 is "more games"). */
export const PAGE_SIZE = 8;
