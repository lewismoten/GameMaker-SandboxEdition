// What the level check reports: a finding says what is wrong (or worth a second look), where, how
// much it matters, why players mind, and which part of The Ultimate Owner's Guide explains it. Each check has an id
// here with its guide section, so the panel, the badges and the upload checklist agree. A check
// marked `taste` measures a design preference, not a fault, so its words ask rather than rule.

type Severity = 'error' | 'warning' | 'info';

/** A chapter of The Ultimate Owner's Guide (manual/ultimate/plan.ts ids) and a heading in it. */
export interface GuideRef {
  chapter: 'craft' | 'levels' | 'upload' | 'testing' | 'sounds' | 'actors' | 'blocks' | 'logic' | 'show' | 'tricks' | 'check' | 'players' | 'limits';
  section: string;
}

interface Where {
  /** The scene (its number in the .gam file). */
  scene?: number;
  /** The map file and a cell on it (y * 100 + x). */
  map?: string;
  cell?: number;
  /** More cells of the same finding (a stuck area, every place a block is used). */
  cells?: number[];
  /** A block in a block set (.bbl or .mbl). */
  block?: { file: string; n: number };
  /** A monster in a .mon file. */
  monster?: { file: string; n: number };
  /** A sound slot in a .snd file. */
  sound?: { file: string; n: number };
  /** A whole file (a character, a text screen). */
  file?: string;
}

/** A one-click suggestion the panel can offer for a finding (generators/*.ts). */
type FixId = 'ladder' | 'fill-hazard' | 'outline-monster' | 'key-sign' | 'open-gap' | 'shorten-cycle' | 'spread-healing' | 'landmark' | 'no-soltop';

export interface Finding {
  check: CheckId;
  severity: Severity;
  /** One line: what is wrong, here. */
  title: string;
  /** Extra facts (numbers measured). */
  detail?: string;
  where: Where;
  fix?: FixId;
}

export interface CheckInfo {
  name: string;
  /** Why players mind, in one line. */
  why: string;
  guide: GuideRef;
  /**
   * A design preference rather than a fact: a measure many games do well to follow, which a
   * game can break on purpose (a swarm, a one-off surprise, a maze meant to confuse). The panel
   * calls its warnings suggestions and offers “That’s on purpose” to dismiss one.
   */
  taste?: true;
}

const L = (section: string): GuideRef => ({ chapter: 'levels', section });
const C = (section: string): GuideRef => ({ chapter: 'craft', section });
const P = (section: string): GuideRef => ({ chapter: 'players', section });
/** The solid-monster push checks' section. */
const G: GuideRef = { chapter: 'limits', section: 'The wall glitch' };

export const CHECKS = {
  stuck: { name: 'Stuck spots', why: 'A player who can’t go on or go back has to start over, and few will.', guide: L('Never trap the player') },
  unreachable: { name: 'Out of reach', why: 'A prize nobody can get to reads as a mistake, not a secret.', guide: L('Everything on the map has a job') },
  'prize-in-view': {
    name: 'Prizes in view but out of reach',
    why: 'A prize the screen shows that no way leads to reads as a cruel joke: players spend lives trying for it.',
    guide: L('Everything on the map has a job'),
  },
  'link-unreached': { name: 'Exits never reached', why: 'A link the hero can’t touch is a door to nowhere.', guide: L('Never trap the player') },
  'blind-drop': {
    name: 'Blind drops',
    why: 'A fall faster than the view, or to a landing off screen, is more guess than choice. A leap of faith the game has taught can be fun.',
    taste: true,
    guide: L('Look before you leap'),
  },
  'hazard-landing': {
    name: 'Hazard landings',
    why: 'A long fall onto something that hurts punishes a jump the player couldn’t aim.',
    guide: L('Look before you leap'),
  },
  'hazard-art': {
    name: 'Hazard art smaller than its cell',
    why: 'A block hurts through its whole cell, so thin spikes hurt the hero in thin air.',
    guide: L('Hazards that hit where they are drawn'),
  },
  opposites: { name: 'Opposite blocks side by side', why: 'One tap too many takes the hero the wrong way with no warning.', guide: L('Opposites apart') },
  'hurt-lock': {
    name: 'Hurts that hold',
    why: 'Something that holds the hero while it hurts drains a life with no way to dodge.',
    guide: L('Danger players can see'),
  },
  'push-edge': {
    name: 'Solid monsters on the map’s edge',
    why: 'A solid monster on the top or bottom row can push the hero over the edge of the map: he comes out on the far side, often stuck in a wall, and the view races round after him.',
    guide: G,
  },
  'push-gap': {
    name: 'Solid monsters that shove into walls',
    why: 'A solid monster puts the hero next to it without looking for walls, so one whose path ends against a block shoves a hero in the gap inside it, where he sticks.',
    guide: G,
  },
  'push-squeeze': {
    name: 'Solid monsters that close in',
    why: 'Caught between two solid monsters, the hero is popped out of the gap the other way, into the ceiling or the floor if one is there. Two that never meet with the hero between can be fine.',
    taste: true,
    guide: G,
  },
  'solid-hurt': {
    name: 'Solid monsters that hurt',
    why: 'A solid hazard pushes the hero as it hurts him: it can sink him into the floor or pin him to a wall. One he can pass through is usually fairer; a solid one can be right for a boss you stand on.',
    taste: true,
    guide: G,
  },
  'every-tick': {
    name: 'Scores or heals every tick',
    why: 'Standing still to farm points or health breaks the game’s balance.',
    guide: { chapter: 'tricks', section: 'Cameos that say hello once' },
  },
  counters: {
    name: 'Counters that run out',
    why: 'Running out of breath, keys or faith before the gate that needs them is a trap.',
    guide: { chapter: 'logic', section: 'Counters, Gates and Puzzles' },
  },
  telegraph: {
    name: 'Hazards that look safe',
    why: 'A hazard drawn in the colors of safe ground is hard to spot the first time. A trick floor can be fun if the game plays fair with it.',
    taste: true,
    guide: L('Danger players can see'),
  },
  footing: {
    name: 'Floors and walls that look alike',
    why: 'Players stand on what looks like floor and walk round what looks like wall. A block you fall through that looks solid feels like a trick; a fair secret door is fine when the game hints at it.',
    taste: true,
    guide: L('Footing you can trust'),
  },
  mechanics: {
    name: 'Mechanics used once',
    why: 'A mechanic that comes back with a twist often lands better than one used once, plainly; a one-off can still be a fine surprise.',
    taste: true,
    guide: L('Teach, test, twist'),
  },
  maze: {
    name: 'Mazes',
    why: 'A maze where every passage looks the same can turn choosing into guessing. Some mazes are meant to confuse; is this one?',
    guide: L('Mazes with a compass'),
    taste: true,
  },
  waits: {
    name: 'Long waits',
    why: 'Standing still for a lift or a timed block can feel like waiting, not playing. A pause can build tension; is this one meant?',
    guide: L('Waiting is not a challenge'),
    taste: true,
  },
  density: {
    name: 'Crowded screens',
    why: 'Two or three foes at once is usually plenty to read; a crowd can blur into noise. A swarm can be the point of a level, though.',
    guide: C('Fair enemies'),
    taste: true,
  },
  speed: {
    name: 'Enemies faster than the hero',
    why: 'A foe much faster than the hero is hard to escape, and often learned only by dying. A clear, readable path makes it fair.',
    taste: true,
    guide: L('Everything on the map has a job'),
  },
  'start-threat': {
    name: 'A threat at the start',
    why: 'A level that hurts before the player has moved often feels unfair; a moment to look around helps. A boss that meets the hero at the door can be the point.',
    taste: true,
    guide: P('A safe start'),
  },
  lookalike: {
    name: 'Scenery that looks like a prize',
    why: 'Players try to grab anything drawn like a prize; one that gives nothing reads as a bug. A decoy can be a fair joke, once.',
    taste: true,
    guide: P('Scenery that looks collectable'),
  },
  'tap-twice': {
    name: 'A tap that moves twice',
    why: 'PLAYGAME plays a sequence again while its key is down, and an “Always finish” step reads a key let go only during its first frame, so a short first frame moves the hero twice for one press.',
    taste: true,
    guide: P('A tap is not a hold'),
  },
  'teach-first': {
    name: 'Keys taught at the start',
    why: 'A key needed to grab, use or fight that nothing near the start names is a key many players never find; few read the instructions first.',
    taste: true,
    guide: P('Teach the controls in the first room'),
  },
  'one-way': {
    name: 'One-way spots',
    why: 'A move the hero can’t undo (a drop, a door that shuts) surprises a player who wanted to look back. A chute everyone can see is one-way is fine.',
    taste: true,
    guide: P('Ways back, and no softlocks'),
  },
  softlock: {
    name: 'Things left behind',
    why: 'Going on without something a later part needs, with no way back for it, leaves the player unable to finish; they find out only at the end.',
    guide: P('Ways back, and no softlocks'),
  },
  steady: {
    name: 'Steady hands',
    why: 'The bot presses keys to the tick. A part that needs two keys at once or a split-second change can stop a player with slower hands.',
    taste: true,
    guide: P('Designing for slower hands'),
  },
  fli: {
    name: 'Animations DOS can’t play',
    why: 'RSD’s player garbles an animation chunk too big for its memory and a line of 128 changes, and crashes on an all-black chunk.',
    guide: { chapter: 'limits', section: 'Animations and DOS memory' },
  },
  chasers: {
    name: 'Chasers that never let go',
    why: 'A monster that chases forever turns a level into a race. Is that the idea? A lifetime or a slower chase gives players a breather.',
    guide: C('Fair enemies'),
    taste: true,
  },
  births: {
    name: 'Births that never rest',
    why: 'A birth block that keeps giving birth can flood the screen. A wave to survive can be the point; is it here?',
    guide: C('Fair enemies'),
    taste: true,
  },
  contrast: {
    name: 'Hard-to-see monsters',
    why: 'An enemy the color of the scenery can hit players who never saw it. Camouflage can be a fair trick when the game hints at it.',
    guide: C('Fair enemies'),
    taste: true,
  },
  sounds: {
    name: 'Loud or long frequent sounds',
    why: 'A sound heard a hundred times usually wears best short and soft; a long one can be a signature, if it stays welcome.',
    guide: C('Polish that players notice'),
    taste: true,
  },
  controls: {
    name: 'Keys never taught',
    why: 'A key the game never shows is a key many players never find. A hidden key can be a secret, if that is the plan.',
    guide: L('Controls the level teaches'),
    taste: true,
  },
  'help-keys': {
    name: 'Help that names the wrong keys',
    why: 'Players press the keys the help names. A key nothing uses reads as a broken game, and the real key may never be found.',
    guide: { chapter: 'show', section: 'Instructions players read' },
  },
  'text-contrast': {
    name: 'Text that’s hard to read',
    why: 'PLAYGAME draws text in the picture’s nearest deep purple. Over a dark or busy patch, players can’t read the goal or the keys, and skip the screen.',
    guide: { chapter: 'show', section: 'Text screens and slide shows' },
  },
  reach: {
    name: 'Keys out of reach',
    why: 'A key the hand has to leave its place for is often pressed late. Fine for a rare key; is this one needed in the thick of play?',
    taste: true,
    guide: C('Keys under the hands'),
  },
  response: {
    name: 'Slow keys',
    why: 'A key that waits before it answers can feel broken. A wind-up can suit a heavy move; is the wait meant?',
    guide: L('Controls the level teaches'),
    taste: true,
  },
  facing: {
    name: 'Facing the way it walks',
    why: 'A hero who slides sideways facing the player can look like a corner was cut. Something drawn the same from every side is fine.',
    taste: true,
    guide: C('Face the way you walk'),
  },
  'hero-speed': {
    name: 'Hero speed',
    why: 'A slow walk can make levels drag, an uneven one feel slippery and a jump cut off in mid-air feel broken, unless the weight is the point.',
    guide: C('A hero who feels right'),
    taste: true,
  },
  curve: {
    name: 'Difficulty curve',
    why: 'Most games ask a little more each level. One that only gets easier can lose players, unless a gentle wind-down is the plan.',
    taste: true,
    guide: C('A difficulty curve, not a cliff'),
  },
  checkpoints: {
    name: 'Long scenes',
    why: 'A death starts the scene over, so a long scene costs a lot each time. Long can be right for a finale; is this one meant?',
    taste: true,
    guide: C('A difficulty curve, not a cliff'),
  },
  'start-values': {
    name: 'Starting values PLAYGAME ignores',
    why: 'PLAYGAME takes hit points, lives, counters and the inventory from the first scene’s character only. A hero chosen later who “starts with more” doesn’t, and players notice the promise broken.',
    guide: { chapter: 'logic', section: 'The counters' },
  },
  'blank-idle': {
    name: 'A hero with no standing picture',
    why: 'With no Idle frames PLAYGAME shows character block 0 whenever the hero stands still, so he flickers into the wrong picture or vanishes.',
    guide: { chapter: 'actors', section: 'The hero’s own tricks' },
  },
  'shot-prize': {
    name: 'Shots that destroy prizes',
    why: 'A stronger monster kills a weaker one it touches, so a shot fired at an enemy can blow away the prize beside it, sometimes the one the level needs.',
    guide: L('Everything on the map has a job'),
  },
  'fake-exit': {
    name: 'Doors that lead nowhere',
    why: 'A block drawn like the level’s exits that isn’t one sends players round in circles, and they stop trusting the real doors. A fair secret is fine, once.',
    taste: true,
    guide: L('Footing you can trust'),
  },
  music: {
    name: 'Levels without music',
    why: 'A level with no song, or one DOS won’t play, is silent. Quiet can set a mood; more often players hear it as something broken.',
    guide: C('Polish that players notice'),
  },
  flashing: {
    name: 'Flashing',
    why: 'Light and dark swapping more than three times a second over much of the screen can bring on seizures in some players.',
    guide: C('Polish that players notice'),
  },
  stakes: {
    name: 'Lives to spare',
    why: 'With many lives a death costs nothing, and the danger stops mattering. A few lives keep each mistake worth avoiding.',
    taste: true,
    guide: C('A difficulty curve, not a cliff'),
  },
  'help-length': {
    name: 'Long instructions or story',
    why: 'Most players read a page or three, then skip. Help that runs on hides the goal and the keys among everything else.',
    taste: true,
    guide: { chapter: 'show', section: 'Instructions players read' },
  },
  ending: { name: 'Ending and screens', why: 'A game with no won screen, credits or instructions feels unfinished.', guide: L('An ending, not an ad') },
  variety: {
    name: 'Variety',
    why: 'Something new every level or two keeps a game lively; one look all the way through can be a style of its own.',
    guide: C('Variety'),
    taste: true,
  },
  coverage: {
    name: 'How far the check got',
    why: 'Parts the bot didn’t reach in time weren’t checked.',
    guide: { chapter: 'testing', section: 'A play-test checklist' },
  },
} satisfies Record<string, CheckInfo>;

export type CheckId = keyof typeof CHECKS;

/** The pace the Level check's Steady hands plays at unless told another: ms between key changes. */
export const STEADY_MS = 300;

/** How the panel and badges name a finding: a taste check's warning is a suggestion. */
export type Kind = Severity | 'suggestion';

export const kindOf = (f: Pick<Finding, 'check' | 'severity'>): Kind =>
  f.severity === 'warning' && (CHECKS[f.check] as CheckInfo).taste ? 'suggestion' : f.severity;

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Findings sorted worst first, then by check. */
export function sortFindings(list: Finding[]): Finding[] {
  return [...list].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.check.localeCompare(b.check));
}

/** "(12, 40)" for a map cell. */
export const at = (cell: number) => `(${cell % 100}, ${Math.floor(cell / 100)})`;
