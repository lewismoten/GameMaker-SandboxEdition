// A diagonal leg's track: lanes laid corner to corner across a 100x100 map that wraps on
// every side. Each lane is a band running up and to the right at 45 degrees, with a strip of
// solid ground between it and the next. Near the right edge every band bends flat (the kink),
// so when it comes round the wrap it carries on as the next lane down instead of meeting
// itself, and riding along goes through every lane in turn.
//
// Every cell has a track value t: x + y on the slant, y + kink on the kink. Bands are `pitch`
// wide in t: the first `board` of them solid ground, the rest lane. Crossing the top edge
// adds 100 to t and crossing the right edge takes away `kink`, so a lap moves the ship
// `pitch` further: one lane. The course starts at a piece on the first lane's kink and ends at
// another on the last lane's; the rest of those two lanes is bare ground.

const mod = (n: number, m: number) => ((n % m) + m) % m;

interface TrackSpec {
  pitch: number;
  lanes: number;
  board: number;
  kink: number;
  /** The lane the BLASTER launches in (only its kink is lane) and the last one. */
  first: number;
  last: number;
  /** The columns the start and end pieces cover on the kink. */
  startCols: number[];
  endCols: number[];
}

export class DiagTrack implements TrackSpec {
  readonly pitch: number;
  readonly lanes: number;
  readonly board: number;
  readonly kink: number;
  readonly first: number;
  readonly last: number;
  readonly startCols: number[];
  readonly endCols: number[];

  constructor(s: TrackSpec) {
    if (s.pitch * s.lanes !== 100) throw new Error('A diagonal track needs pitch x lanes = 100');
    // round the wrap, t loses `kink`: that must be one lane on
    if (s.kink + s.pitch !== 100) throw new Error('A diagonal track needs kink + pitch = 100');
    this.pitch = s.pitch;
    this.lanes = s.lanes;
    this.board = s.board;
    this.kink = s.kink;
    this.first = s.first;
    this.last = s.last;
    this.startCols = s.startCols;
    this.endCols = s.endCols;
  }

  /** The track value of cell (x, y), as 0..99. */
  tOf(x: number, y: number): number {
    return mod(x < this.kink ? x + y : y + this.kink, this.lanes * this.pitch);
  }

  /** The lane ridden on lap `lap` (0, the launch, is only the kink). */
  laneOfLap(lap: number): number {
    return (this.first + lap) % this.lanes;
  }

  /** Is there lane on lane `lane` at column x? (Before the start piece and after the end piece, bare ground.) */
  hasLane(lane: number, x: number): boolean {
    if (lane === this.first) return x >= this.startCols[0];
    if (lane === this.last) return x <= this.endCols[this.endCols.length - 1];
    return true;
  }

  /** The cell at column x of lap `lap`, `o` across its lane (board..pitch-1 is lane). */
  cellOf(lap: number, x: number, o: number): { x: number; y: number } {
    const t = this.laneOfLap(lap) * this.pitch + o;
    return { x, y: mod(t - (x < this.kink ? x : this.kink), 100) };
  }
}
