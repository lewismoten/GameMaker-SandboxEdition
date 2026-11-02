// Badges for the preset pictures. Ninety presets share thirty-odd instrument drawings (every
// guitar is a guitar), so a preset that shares its drawing wears a small badge in the
// bottom-right corner: a 7x7 white tile with a 5x5 shape in one palette color. The badge
// (shape and color) is what tells two guitars apart; presetIcons.test.ts fails if any two
// presets' pictures end up too much alike. A preset with no entry here wears no badge.

/** 5x5 shapes: "#" is the badge color. */
const SHAPES: Record<string, string[]> = {
  dot: ['.###.', '#####', '#####', '#####', '.###.'],
  plus: ['..#..', '..#..', '#####', '..#..', '..#..'],
  stripes: ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  cross: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  tri: ['..#..', '.###.', '.###.', '#####', '#####'],
  diamond: ['..#..', '.###.', '#####', '.###.', '..#..'],
  ring: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  star: ['..#..', '#####', '.###.', '##.##', '#...#'],
  down: ['#####', '.###.', '.###.', '..#..', '..#..'],
  bars: ['#####', '.....', '#####', '.....', '#####'],
  corner: ['#....', '#....', '#....', '#....', '#####'],
  check: ['....#', '...#.', '#.#..', '.#...', '..#..'],
};

/** id -> [shape, palette letter]. Presets that sit alone on their drawing have no entry. */
export const BADGES: Record<string, [string, string]> = {
  // keys
  'piano-mellow': ['ring', 'b'],
  harpsichord: ['star', 'o'],
  'epiano-round': ['dot', 'r'],
  clavinet: ['bars', 'e'],
  'tine-glass': ['diamond', 'c'],
  // strings and basses on the violin and guitar drawings
  orchestra: ['star', 'r'],
  pizzicato: ['dot', 'e'],
  'upright-bass': ['down', 'b'],
  strings: ['bars', 'p'],
  'guitar-nylon': ['ring', 'o'],
  'slap-bass': ['cross', 'r'],
  'finger-bass': ['stripes', 'b'],
  fretless: ['tri', 'e'],
  bass: ['corner', 'p'],
  'harp-chime': ['diamond', 'c'],
  pluck: ['dot', 'p'],
  // voices, basses, synths
  ooh: ['ring', 'r'],
  soprano: ['tri', 'p'],
  'punch-bass': ['cross', 'y'],
  'sub-round': ['ring', 'e'],
  'lead-saw': ['stripes', 'r'],
  lead: ['corner', 'b'],
  'synth-brass': ['bars', 'o'],
  'pad-80s': ['diamond', 'p'],
  'pad-warm': ['dot', 'o'],
  'pad-sweep': ['tri', 'c'],
  'pad-wobble': ['cross', 'e'],
  pad: ['ring', 'b'],
  // organs, brass, winds
  tonewheel: ['bars', 'r'],
  'combo-organ': ['stripes', 'b'],
  kazoo: ['dot', 'r'],
  trombone: ['down', 'o'],
  brass: ['star', 'y'],
  tuba: ['down', 'b'],
  oboe: ['tri', 'e'],
  'reed-soft': ['ring', 'p'],
  // mallets and percussion
  celesta: ['star', 'c'],
  bell: ['dot', 'y'],
  chimes: ['stripes', 'e'],
  xylophone: ['diamond', 'o'],
  'vibes-wobbly': ['cross', 'p'],
  // proposed from the archive survey (placeholders)
  'choir-distant': ['ring', 'b'],
  'fuzz-stab': ['star', 'r'],
  'whistle-lead': ['plus', 'c'],
  'organ-wobble': ['cross', 'p'],
  'brass-swell': ['star', 'o'],
  'reed-swell': ['tri', 'o'],
  'steel-clank': ['bars', 'b'],
  'sparkle-bell': ['star', 'p'],
  'timpani-tom': ['ring', 'r'],
  'melodic-kick': ['dot', 'c'],
  'kick-boomy': ['down', 'r'],
  'melodic-snare': ['dot', 'e'],
  'snare-fat': ['bars', 'b'],
  rimshot: ['cross', 'o'],
  'melodic-hat': ['dot', 'p'],
  'hat-open': ['ring', 'c'],
  'hat-pedal': ['down', 'y'],
  'tom-mid': ['bars', 'e'],
  'tom-high': ['stripes', 'o'],
  ride: ['ring', 'y'],
  // the song maker's piano and organ (its other seven are badged above)
  piano: ['star', 'y'],
  organ: ['star', 'b'],
};

/** Draws a preset's badge onto a copy of the picture's rows. */
export function withBadge(rows: string[], id: string): string[] {
  const badge = BADGES[id];
  if (!badge) return rows;
  const shape = SHAPES[badge[0]];
  const out = rows.map((r) => r.split(''));
  for (let y = 13; y < 20; y++) {
    for (let x = 13; x < 20; x++) {
      const edge = y === 13 || y === 19 || x === 13 || x === 19;
      const on = !edge && shape[y - 14][x - 14] === '#';
      out[y][x] = edge ? 'k' : on ? badge[1] : 'w';
    }
  }
  return out.map((r) => r.join(''));
}
