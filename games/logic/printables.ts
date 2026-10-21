// printables.json (what's in the box besides the disk), written by the build so the hint
// book always matches the boards: a hint and an answer for every board, the promo postcard
// for it, Watt's repair license and the wiring poster promised to registered players.
import { writeFileSync } from 'node:fs';
import { BOARDS } from './boards';
import { OX, OY } from './board';

const ROOMS: Record<string, string> = { kitchen: 'The Kitchen', living: 'The Living Room', garage: 'The Garage', attic: 'The Attic' };

export function printables(): unknown {
  const sections = Object.entries(ROOMS).map(([room, head]) => ({
    head,
    hints: BOARDS.filter((b) => b.room === room).map((b) => ({ q: `${b.title}: ${b.hint}`, a: b.answer })),
  }));
  return {
    pitch: 'Watt the repair robot rolls home through fifteen haywire circuit boards. Route the current, never touch it.',
    keys: { 'Arrows / W A S D / keypad': 'Roll one block', R: 'Reboot the board (costs a spare battery)' },
    news: [
      {
        head: 'Ohm Sweet Ohm: puzzles made of pure Game-Maker',
        html: '<p>Every switch, fuse and relay in Sandbox Software\'s new puzzler is built from ordinary Game-Maker blocks and monsters: batteries are blocks that give birth to "current" monsters, and gates fall when a stronger monster touches them. Not one line of code!</p>',
      },
    ],
    stickers: [
      { text: 'THINK BEFORE YOU ROLL', sub: 'Ohm Sweet Ohm', shape: 'badge', color: '#0d3a24', ink: '#ffd23c' },
      { text: 'DANGER: LIVE CURRENT', sub: 'Watt says so', shape: 'badge', color: '#ffd23c', ink: '#111111' },
    ],
    items: [
      {
        kind: 'hintbook',
        title: 'Ohm Sweet Ohm Hint Book',
        note: 'A nudge and an answer for every board',
        promised: true,
        intro:
          'Stuck on a board? Find it below. The question tells you what most people get stuck on; the answer, printed under red, tells you how to get past. Read the answers through the red film, one at a time, and only when you need them!',
        sections,
      },
      {
        kind: 'letter',
        title: 'Hint book postcard',
        note: 'Stuck? Help is a stamp away',
        letterhead: 'SANDBOX SOFTWARE HINT LINE (BY MAIL)',
        address: 'P.O. Box 1995, Pittsburgh, PA 15213 (a make-believe address)',
        date: 'Spring 1995',
        to: 'Dear stuck electrician,',
        body: "<p><b>Watt fizzled again?</b> The Christmas lights got you tangled? Is the home computer computing you right out of spare batteries?</p><p>The <b>Ohm Sweet Ohm Hint Book</b> has a gentle nudge and a full answer for all fifteen boards, printed under red so you only read as much as you want. Every registered copy comes with one, and with the hint book in hand, there is no board you can't solve.</p><p>Register for <b>$12</b> and it's in the mail to you!</p>",
        signature: 'Watt (and the folks at Sandbox Software)',
        style: 'print',
      },
      {
        kind: 'map',
        title: 'Wiring poster',
        note: 'Board 13, the home computer',
        promised: true,
        heading: 'THE HOME COMPUTER: WIRING DIAGRAM',
        intro:
          'The trickiest chip in the Bitmore house, wire by wire. Two pink control lines throw four relays; only one combination gets current safely to the gate.',
        panels: [
          {
            map: 'computer.map',
            x: OX,
            y: OY,
            w: 16,
            h: 10,
            caption: 'Follow each pink wire up through the chip: which relays does it throw?',
            marks: [
              { x: OX + 8, y: OY + 5, label: 'Watt drops onto the GND pad here', kind: 'start' },
              { x: OX + 13, y: OY + 2, label: 'The outlet home', kind: 'goal' },
              { x: OX + 6, y: OY + 7, label: 'Left pink switch', kind: 'note' },
              { x: OX + 9, y: OY + 7, label: 'Right pink switch', kind: 'note' },
            ],
          },
        ],
        legend: ['NO: normally open relay', 'NC: normally closed relay', 'Copper bridges mark wires that cross without touching'],
        landscape: true,
      },
      {
        kind: 'idcard',
        title: 'Repair robot license',
        note: "Watt's very own",
        org: 'BITMORE SMART HOME - MAINTENANCE',
        name: 'WATT',
        role: 'Repair robot, fuse box division',
        fields: [
          ['Height', '6 in. (antenna up)'],
          ['Rated', '9 volts, 1 smile'],
          ['Lives at', 'Main fuse box, Juniper Lane'],
          ['Do not', 'touch live current'],
        ],
        color: '#0d3a24',
        ink: '#ffd23c',
        portrait: { chr: 'watt.chr', cbl: 'watt.cbl', pal: 'watt.pal' },
        back: 'If found fizzled, please return to the nearest charging socket. Thank you!',
      },
    ],
  };
}

export function writePrintables(file: string): void {
  writeFileSync(file, JSON.stringify(printables(), null, 2) + '\n');
}
