// AUTOEXEC's mouse line at boot. Usually the plain "Mouse driver installed"; once in a while the
// driver has a day of its own, and now and then it's out on the race track with a pit report.

const DAYS = [
  'designated driver installed',
  'driver implanted',
  'driver insulated',
  'driver infiltrated',
  'driver installed?',
  'driver got the cheese',
  'driver trapped',
  'driver sprung',
  'driver made bail',
  'driver on wrong side',
  'driver on the loose',
  'driver won the race',
  'driver went home',
  'driver tickled',
  'driver ran blind',
  "driver after the farmer's wife",
  'driver on strike',
];

const LAPS: { status: string; telemetry: string; speed: string }[] = [
  { status: 'pitstopping', telemetry: '4-Wheel Alignment OK', speed: '120 DPI (Restricted under caution)' },
  { status: 'refueling', telemetry: 'Cheese tank 3/4 full', speed: '200 DPI (Green flag)' },
  { status: 'black flagged', telemetry: 'Ball rolling outside the line', speed: '0 DPI (See the stewards)' },
  { status: 'redlining', telemetry: 'Ball bearings glowing', speed: '400 DPI (Mind the tach)' },
  { status: 'qualifying', telemetry: 'Lap 1 of 3, clean', speed: '200 DPI (Hot lap)' },
  { status: 'drifting', telemetry: 'Pad friction LOW', speed: '160 DPI (Sideways)' },
  { status: 'spun out', telemetry: 'Cord tangled at turn 4', speed: '0 DPI (Yellow flag)' },
  { status: 'in the wall', telemetry: 'Left button scuffed', speed: '40 DPI (Limping to the pits)' },
  { status: 'stalled', telemetry: 'Ball needs a cleaning', speed: '0 DPI (Push start)' },
  { status: 'on pole position', telemetry: 'Tires warm, cord clear', speed: '400 DPI (Lights out)' },
];

/** One boot's mouse line, ending in a newline: plain most times, a quirk about one boot in eight. */
export function mouseDriverLine(rand: () => number = Math.random): string {
  if (rand() >= 1 / 8) return 'Mouse driver installed\n';
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  // a quarter of the quirky boots go racing
  if (rand() < 1 / 4) {
    const lap = pick(LAPS);
    return `Mouse driver ${lap.status}: PS/2 Port\nTelemetry: ${lap.telemetry}\nMax Speed: ${lap.speed}\n`;
  }
  return `Mouse ${pick(DAYS)}\n`;
}
