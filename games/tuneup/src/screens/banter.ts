// What Doc Leo and the rubber chicken say before and after each level (cards.ts draws them).
// Levels 1-4 are Sir Reginald Cluckington III's dream (he was talking in his sleep): a gas
// engine THE CHEZ never had. He wakes after the swim through the oil pipe, and the real,
// electric tune-up starts at level 5. Every car fact from level 5 on is from THE CHEZ's own
// blog (thechez.car.blog). After Muffled (level 9) the 8-track's clunk startles him into laying an
// egg (EGG), and from level 10 on she is Lady Regina Cluckington III, formally corrected.
import type { Card } from './cards';

/** Before each level, by level number. */
export const INTRO: Record<number, Card> = {
  1: {
    dream: true,
    title: 'LEVEL 1 OF 16: JUMP START',
    lines: [
      ['leo', "The battery's flat, and Gwinn buried my wrenches."],
      ['reggie', 'Then we improvise, old bean. Find the clamps.'],
      ['leo', 'Red on the shelf, black under the bench?'],
      ['reggie', 'And then crank. Hold Space.'],
    ],
  },
  2: {
    dream: true,
    title: 'LEVEL 2 OF 16: SPARK PLUCKS',
    lines: [
      ['reggie', 'The spark plugs are out of tune. Pluck them.'],
      ['leo', "Spark plugs don't have strings."],
      ['reggie', 'These do now. Climb the wires, and mind the sparks. They frizz.'],
    ],
  },
  3: {
    dream: true,
    title: 'LEVEL 3 OF 16: THE TIMING BEAT',
    lines: [
      ['reggie', 'The distributor has a piano roll in it.'],
      ['leo', 'Since when?'],
      ['reggie', 'Since Gwinn. Boop each key as its note lands, and the timing sets itself.'],
    ],
  },
  4: {
    dream: true,
    title: "LEVEL 4 OF 16: OIL'S WELL",
    lines: [
      ['reggie', 'Five squeaky lines, one oil can. Press the note on the line: E, G, B, D or F.'],
      ['leo', "Oil's well that ends well."],
      ['reggie', 'I shall pretend you did not say that. Mind the gauge up top: more Squeaks when it runs out.'],
    ],
  },
  5: {
    title: 'LEVEL 5 OF 16: THE FAN BAND',
    lines: [
      ['leo', 'First, the warm air. It comes up a vent from the motor, through a flap we open under the windshield.'],
      ['reggie', 'The vent is full of little fans. Playing kazoos.'],
      ['leo', 'A fan band! Ride the warm air up, and reach each fan with Space.'],
    ],
  },
  6: {
    title: 'LEVEL 6 OF 16: BRAKE DANCE',
    teddy: true,
    lines: [
      ['leo', "The brake lights won't come on. The switch at the pedal has gone stiff."],
      ['reggie', 'It needs a break. Teddy, show it your tricks.'],
      ['leo', 'Z turn, X roll over, C play dead, V dance. Each lamp wants its own.'],
    ],
  },
  7: {
    title: 'LEVEL 7 OF 16: HUBCAPS AND BALLS',
    lines: [
      ['leo', "The radio's antenna will need a ball on top, for the parade."],
      ['reggie', 'I had one. Then three hubcaps happened.'],
      ['leo', 'Cups and balls! Watch the cap with the ball, then reach up under it.'],
    ],
  },
  8: {
    title: 'LEVEL 8 OF 16: PUMP UP THE VOLUME',
    lines: [
      ['reggie', 'The tires are soft.'],
      ['leo', "The owner's manual says 32 psi. Hand me the pump."],
      ['reggie', 'This pump is for balloons.'],
      ['leo', 'Then I twist a balloon dog under my shoes (B) and float up. Step off before it pops.'],
    ],
  },
  9: {
    title: 'LEVEL 9 OF 16: MUFFLED',
    teddy: true,
    lines: [
      ['reggie', 'Gwinn took the 8-track tapes to bed. She is asleep on the moving blanket.'],
      ['leo', 'Teddy, fetch them. Quietly.'],
      ['reggie', 'Each squeaky toy wakes her a little. A blanket corner tucked in settles her.'],
    ],
  },
  10: {
    title: 'LEVEL 10 OF 16: THE RAIN DELAY',
    lady: true,
    lines: [
      ['regina', 'Rain. The radio will have to wait.'],
      ['leo', 'Last storm, the wiper dragged on wet glass. The accessory battery sank to 12 volts.'],
      ['regina', 'Cross between the sweeps, on the beat. Each drop rings like a tongue drum.'],
    ],
  },
  11: {
    title: 'LEVEL 11 OF 16: THE HORN SECTION',
    lady: true,
    lines: [
      ['leo', 'The horn quit on me once. Now it has its own 10 amp circuit.'],
      ['regina', 'And it honks like a kazoo. The Clown Club horn section will teach it a call.'],
      ['leo', 'Watch the board, then reach up under each pad in turn. A wrong one blows a raspberry.'],
    ],
  },
  12: {
    title: 'LEVEL 12 OF 16: KEY CHANGE',
    lady: true,
    lines: [
      ['leo', 'That whine. Last time, the speedometer gear housing was still on the motor.'],
      ['regina', 'Then shift it up. Four gears, a key change in each.'],
      ['leo', 'Hop the teeth as they come round. The door keeps its own time.'],
    ],
  },
  13: {
    title: 'LEVEL 13 OF 16: THE INSTRUMENT PANEL',
    lady: true,
    teddy: true,
    lines: [
      ['regina', 'A radio was a factory option. A few extra dollars, and nobody paid them.'],
      ['leo', 'Its space is above the accessory light. I drill the antenna hole, Teddy tunes.'],
      ['regina', 'Hop into each preset as the needle crosses its station. Then the gauges.'],
    ],
  },
  14: {
    title: 'LEVEL 14 OF 16: THE BELTWAY',
    lady: true,
    teddy: true,
    lines: [
      ['leo', 'The dial says kHz: Keeps Humming while Zooming. We have to drive it.'],
      ['regina', 'It means kilohertz.'],
      ['leo', 'Then why put it on a car? Round the beltway first.'],
      ['regina', 'Left, Right: lanes. A glint in the mirror? Move over.'],
    ],
  },
  15: {
    title: 'LEVEL 15 OF 16: THE TEST DRIVE',
    lady: true,
    lines: [
      ['leo', 'Off the beltway and round the block. Left to go, Right to brake.'],
      ['regina', 'Stop on red. Count to three at a stop sign.'],
    ],
  },
  16: {
    title: 'LEVEL 16 OF 16: THE PARADE ROUTE',
    lady: true,
    teddy: true,
    lines: [
      ['regina', 'A section of the band waits in every side street for its cue.'],
      ['leo', 'Toot under its lamp (Space) and they fall in behind us.'],
      ['regina', 'Drive past one and back up. Down is reverse.'],
    ],
  },
};

// every level's card says the save keys under it
for (const k of Object.values(INTRO)) k.footer = 'F5 SAVES, F6 LOADS';

/** After each level (or a part of one), by scene file. */
export const OUTRO: Record<string, Card> = {
  jump: {
    dream: true,
    lines: [
      ['leo', 'CHARGE! Is it fixed?'],
      ['reggie', 'Fully charged. I tightened the terminals myself.'],
      ['leo', 'With what?'],
      ['reggie', 'My beak, naturally.'],
    ],
  },
  spark: {
    dream: true,
    lines: [
      ['leo', 'C, E, G, E. Sounds fixed to me.'],
      ['reggie', 'Nearly. Listen: the timing is off. It ticks sideways.'],
      ['leo', 'Then we try something else.'],
    ],
  },
  beat1: {
    dream: true,
    lines: [
      ['reggie', 'Steady. Now the off-beats. One pipe splits in two, another takes the long way round.'],
      ['leo', 'Stand under the fork and I get both keys?'],
      ['reggie', 'You may try.'],
    ],
  },
  beat2: {
    dream: true,
    lines: [
      ['reggie', 'Double time, if you please.'],
      ['leo', 'My feet are already in double time.'],
      ['reggie', 'Then your hands may catch up.'],
    ],
  },
  beat3: {
    dream: true,
    lines: [
      ['leo', 'The timing is perfect.'],
      ['reggie', 'Naturally. Now the oil. Every engine needs its oil.'],
    ],
  },
  oil: {
    dream: true,
    lines: [
      ['reggie', 'One last thing: the oil pipe is clogged. I shall swim it.'],
      ['leo', "You can't swim."],
      ['reggie', 'I am rubber. I float.'],
      ['leo', 'So does wood. And a duck.'],
      ['reggie', 'Do NOT weigh me against a duck.'],
    ],
  },
  // the dream ends: he dozed off on the workbench
  swim: {
    asleep: true,
    lines: [
      ['reggie', 'Zzz... the plugs... the oil... bawk...'],
      ['leo', 'Reginald. REGINALD! Wake up!'],
      ['reggie', 'BAWK! Is the oil pipe clear?'],
      ['leo', 'You dozed off on the workbench. You were talking in your sleep.'],
    ],
  },
  fan2: {
    lines: [
      ['leo', 'Warm air on the windshield. Is it fixed?'],
      ['reggie', 'Warm glass. And the fans know the parade tune now.'],
    ],
  },
  brake: {
    teddy: true,
    lines: [
      ['leo', 'Brake lights! Good boy, Teddy.'],
      ['reggie', 'He took a bow, too. Technically a fifth trick.'],
    ],
  },
  cups1: {
    lines: [
      ['reggie', 'Lucky.'],
      ['leo', 'Skill. Again, faster.'],
    ],
  },
  cups2: {
    lines: [
      ['reggie', 'Twice. Suspicious.'],
      ['leo', 'Once more, and then it waits for the antenna.'],
    ],
  },
  cups3: {
    lines: [
      ['leo', 'Ta-da! One antenna ball.'],
      ['reggie', 'Bravo. The antenna will look very festive.'],
    ],
  },
  pump: {
    lines: [
      ['leo', 'All four tires at 32 psi. Is it fixed?'],
      ['reggie', 'Firm as a balloon poodle. Not one of them popped.'],
      ['leo', 'Then on to the tapes.'],
    ],
  },
  hush: {
    teddy: true,
    footer: 'CHAPTER 2 DONE. F5 SAVES.',
    lines: [
      ['leo', "The tapes! Let's hear one."],
      ['reggie', 'It fades in and out. Muffled.'],
      ['leo', 'The belt in the player is on wrong. Turned inside out, it plays fine.'],
      ['reggie', 'Now all it needs is a radio to live in.'],
    ],
  },
  rain: {
    lady: true,
    lines: [
      ['regina', 'The wind is fierce. Could it tip us over?'],
      ['leo', "I've wondered that myself, in a storm like this. Not today."],
      ['regina', 'And the wiper keeps time beautifully. Two, three, and the tricky five.'],
    ],
  },
  horn1: {
    lady: true,
    lines: [
      ['leo', 'Honk, honk, HONK.'],
      ['regina', 'Promising. Four notes this time.'],
    ],
  },
  horn2: {
    lady: true,
    lines: [
      ['regina', 'The clowns are cheering.'],
      ['leo', 'One more call. Five notes, the big finish.'],
      ['regina', 'The board shows it twice, then goes dark. Remember it.'],
    ],
  },
  horn3: {
    lady: true,
    lines: [
      ['leo', 'Is it fixed?'],
      ['regina', 'It honks the parade call. Not a kazoo in sight. Well. One kazoo.'],
    ],
  },
  gear1: {
    lady: true,
    lines: [
      ['regina', 'Up a step.'],
      ['leo', 'And the needle with it.'],
    ],
  },
  gear2: {
    lady: true,
    lines: [
      ['leo', 'Higher still.'],
      ['regina', 'Like the last chorus of a pop song. Everyone stands up.'],
      ['leo', 'And the door opens quicker in the high gears.'],
    ],
  },
  gear3: {
    lady: true,
    lines: [
      ['regina', 'One more. Top gear.'],
      ['leo', 'Hold on to your comb.'],
    ],
  },
  gear4: {
    lady: true,
    lines: [
      ['leo', 'No whine. Is it fixed?'],
      ['regina', 'Fixed, and in a much better key.'],
    ],
  },
  dash2: {
    lady: true,
    teddy: true,
    footer: 'CHAPTER 3 DONE. F5 SAVES.',
    lines: [
      ['leo', 'An AM radio with a state of the art 8-track. Four programs on every tape.'],
      ['regina', 'And a head cleaning cartridge, for afterwards.'],
      ['leo', 'Good boy, Teddy. Now: a test drive.'],
    ],
  },
};

/** After the test drive's parts (appended to OUTRO below). */
const DRIVE_OUTRO: Record<string, Card> = {
  belt: {
    lady: true,
    teddy: true,
    lines: [
      ['regina', 'Twenty-five miles an hour, and everybody honked.'],
      ['leo', 'They were waving. The 8-track never skipped once.'],
      ['regina', 'Then the radio is fixed. Our exit, Doc.'],
    ],
  },
  road1: {
    lady: true,
    lines: [
      ['leo', 'Hear that? It hums while we zoom.'],
      ['regina', 'And it hushes at every red light. Very law-abiding.'],
      ['leo', 'Main Street next.'],
    ],
  },
  road2: {
    lady: true,
    lines: [
      ['regina', 'The radio says the Clown Club parade is lining up without its lead car.'],
      ['leo', 'Then the radio works. Is it fixed?'],
      ['regina', 'Fixed, tested, and running late.'],
    ],
  },
  band1: {
    lady: true,
    lines: [
      ['leo', 'Bells and bugles. Is it fixed?'],
      ['regina', "It's a parade, Doc. It isn't broken."],
    ],
  },
  band2: {
    lady: true,
    lines: [
      ['regina', 'Kazoos! Just like the horn this morning.'],
      ['leo', 'Only now it is on purpose.'],
    ],
  },
  band3: {
    lady: true,
    teddy: true,
    lines: [
      ['leo', 'Every section, and the radio humming along. Is it fixed?'],
      ['regina', 'Tuned up. Every last part.'],
    ],
  },
};
Object.assign(OUTRO, DRIVE_OUTRO);

/**
 * After Muffled, before The Rain Delay: the 8-track changes programs with its KA-CHUNK, and he
 * lays an egg. Doc Leo stares; only hens lay eggs, so by rubber-chicken logic he must be a hen
 * (a hen with a comb); the paperwork is corrected; and the egg is hers to keep.
 */
export const EGG: Card[] = [
  {
    leoPose: 'hurt',
    egg: true,
    lines: [
      ['leo', 'Hear that? The tape changes programs with a big KA-CHUNK.'],
      ['reggie', 'BAWK!'],
      ['leo', '...'],
      ['reggie', 'What? Why are you staring at me like that?'],
    ],
  },
  {
    egg: true,
    lines: [
      ['leo', 'Reginald, you laid an EGG. Only hens lay eggs. Barnyard rule number one.'],
      [
        'reggie',
        'Then let us reason it out. I laid an egg. Only hens lay eggs. I am rubber, so I bend to the facts: I am a hen. A hen with a comb, the very best kind.',
      ],
      ['leo', "I can't argue with that."],
    ],
  },
  {
    lady: true,
    egg: true,
    lines: [
      ['leo', 'Then the paperwork needs fixing. One new name card.'],
      ['stamp', 'Lady Regina Cluckington III'],
      ['regina', 'In triplicate. I am the Third, after all. And this egg is mine, Doc. I am keeping it for myself.'],
      ['leo', "Wouldn't dream of taking it."],
    ],
  },
];

/** Then, in the same break: Lady Regina keeps her egg somewhere safe. */
export const EGG_KEEP: Card = {
  lady: true,
  teddy: true,
  hatEgg: true,
  lines: [
    ['regina', 'Now my egg needs somewhere safe.'],
    ['leo', 'Where will you keep it safe?'],
    ['regina', 'Somewhere warm, high up and well guarded.'],
    ['leo', '...Under my HAT?'],
    ['regina', 'On it. Hold very still.'],
  ],
};

/** Waking up, before level 5's cartoon: the dream dismissed, and what's really wrong. */
export const WAKE: Card[] = [
  {
    lines: [
      ['leo', 'THE CHEZ is electric. No exhaust pipe. No spark plugs. No distributor.'],
      ['leo', 'The only oil is in the rear differential, and I topped that off.'],
      ['reggie', 'So everything so far...'],
      ['leo', 'Can be dismissed.'],
    ],
  },
  {
    lines: [
      ['reggie', 'Battery fumes. They went to my head.'],
      ['leo', "Can't be. Its batteries are lithium ion now. No fumes."],
      ['reggie', 'Lithium ion? In a CAR? It is 1994!'],
      ['aside', "Car batteries like that are years off. Don't look at me like that. I read ahead."],
    ],
  },
  {
    lines: [
      ['leo', 'Reginald, this is ridiculous.'],
      ['reggie', 'This coming from a man having an argument with a rubber chicken...'],
      ['leo', 'Fair. So what IS wrong with it?'],
    ],
  },
  {
    footer: 'CHAPTER 1 DONE. F5 SAVES.',
    lines: [
      ['reggie', 'It has no radio. The parade car, and not one note.'],
      ['leo', 'A radio was always an extra. Its space is just above the accessory light.'],
      ['reggie', 'Then we fill it. An AM radio, with an 8-track.'],
      ['leo', 'And tune up the rest on the way.'],
    ],
  },
];
