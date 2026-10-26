// How the printed Level Maps cut up a map of separate rooms (levelRooms.ts), where the rooms
// alone don't say: names for rooms of one scene, rooms numbered as a game's hint book numbers
// them, a room drawn once for all its copies, and a panel of who you meet there. By game id,
// then "map|bbl". A map not listed is still cut into rooms when it plainly is rooms (each one a
// scene's own place); one listed here always is.
import type { RoomsHint } from './levelRooms';

/** Ohm Sweet Ohm's boards, in the game's (and the hint book's) order. */
const BOARDS = {
  label: 'Board',
  names: [
    'The Toaster',
    'The Blender',
    'The Microwave',
    'The Dishwasher',
    'The Fridge',
    'The Coffee Maker',
    'The Doorbell',
    'The TV Set',
    'The VCR',
    'The Floor Lamp',
    'The Stereo',
    'The Night-Light',
    'The Garage Door Opener',
    'The Wet-Dry Vac',
    'The Power Drill',
    'The Lawn Mower',
    'The Christmas Lights',
    'The CitiCar',
    'The Home Computer',
    'The Clock Radio',
    'The Electric Train',
    'The Breadboard Computer',
    'Home Sweet Ohm',
  ],
};

/** Final Curtain's five suspects: their portrait in their first interview room, and both interviews. */
const SUSPECTS = [
  ['Lila Fontaine', 'leading lady'],
  ['Edgar Bliss', 'the understudy'],
  ['Agatha Crane', 'the widow'],
  ['Felix Morrow', 'stage manager'],
  ['Oliver Pike', 'the critic'],
].map(([name, role], i) => ({
  name: `${name}, ${role}`,
  picture: [i * 16 + 7, 11, 2, 2] as [number, number, number, number],
  visits: [
    { label: 'Act One', at: [i * 16 + 8, 15] as [number, number], show: [5, 5, 7, 3] as [number, number, number, number] },
    { label: '2 AM', at: [i * 16 + 8, 25] as [number, number], show: [5, 5, 7, 3] as [number, number, number, number] },
  ],
}));

export const ROOM_HINTS: Record<string, Record<string, RoomsHint>> = {
  // the green room twice (after Act One, and at 2 AM), an interview room per suspect per round,
  // and the stage at dawn: the green room is drawn once, with the suspects beside it
  sleuth: {
    'green.map|green.bbl': {
      rooms: [{ at: [8, 5], name: 'The Green Room', same: [[24, 5]], note: 'at 2 AM the evidence board holds nine clues' }],
      cast: { beside: [8, 5], title: 'Who you question here', people: SUSPECTS },
    },
  },
  // the Teleport-A-Phone Exchange: one scene, every booth a way into another room of it
  year2000: {
    'exchange.map|city.bbl': {
      rooms: [
        { at: [2, 13], name: 'Exchange: the hall', short: 'Hall' },
        { at: [38, 8], name: "Exchange: Grandma's condo (booth 1)", short: 'Florida' },
        { at: [39, 24], name: 'Exchange: the bottom of the sea (booth 2)', short: 'Sea' },
        { at: [59, 8], name: 'Exchange: inside a TV set (booth 3)', short: 'TV set' },
        { at: [64, 26], name: 'Exchange: the Jurassic period', short: 'Jurassic' },
        { at: [9, 29], name: 'Exchange: the launch pad', short: 'Launch pad' },
      ],
    },
  },
  // Ohm Sweet Ohm: each room of the house is one map of boards, one board a scene
  logic: {
    'kitchen.map|kitchen.bbl': { numbered: BOARDS },
    'living.map|living.bbl': { numbered: BOARDS },
    'garage.map|garage.bbl': { numbered: BOARDS, rooms: [{ at: [78, 87], name: 'The Fuse Box' }] },
    'attic.map|attic.bbl': { numbered: BOARDS, rooms: [{ at: [10, 47], name: 'The Crawlspace' }] },
  },
};

/** A game's hints by "map|bbl". */
export const listedRoomHints = (id: string): Record<string, RoomsHint> => ROOM_HINTS[id] ?? {};
