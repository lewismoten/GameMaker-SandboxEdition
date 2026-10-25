// What each page and editor loads up front stays small: walks the imports each entry reaches
// before anything is loaded on demand (importWalk.ts), and fails if one brings in something
// that should wait until it is used (the magazine, the desk, the level check's explorer, the
// engine…). The chain in a failure shows which import to make dynamic.
import { describe, expect, it } from 'vitest';
import { chains, reachable } from './importWalk';

const CHECK_RUN = /^editor\/check\/(explore|sim|playtest|report|live)\.ts$/;

const RULES: [entry: string, mustNot: [what: string, match: RegExp][]][] = [
  ['main.ts', [['the desk, the magazine or the level check', /^(desk|manual\/magazine|editor\/check)\//]]],
  [
    'modernUi.ts',
    [
      ['the desk, the magazine or the level check', /^(desk|manual\/magazine|editor\/check)\//],
      ['new game and importing', /^editor\/shell\/homeImport\.ts$/],
      ['the engine', /^engine\//],
    ],
  ],
  [
    'desk/desk.ts',
    [
      ['the magazine or the level check', /^(manual\/magazine|editor\/check)\//],
      ['the felt eggs’ art', /^eggs\/eggArt\.ts$/],
    ],
  ],
  ['manual/magazine/viewer.ts', [['the Shareware Shelf’s list', /^manual\/magazine\/data\//]]],
  ['editor/shell/workspace.ts', [['the engine', /^engine\//]]],
  [
    'editor/editors/map/map.ts',
    [
      ['the Level check panel', /^editor\/editors\/map\/check\/checkPanel\.ts$/],
      ['the block editor', /^editor\/editors\/blocks\/blocks\.ts$/],
      ['the level check’s explorer and report', CHECK_RUN],
      ['the engine', /^engine\//],
    ],
  ],
  ...['blocks/blocks', 'monsters/monsters', 'sounds/sounds', 'integrator/integrator', 'character/character'].map((e): [string, [string, RegExp][]] => [
    `editor/editors/${e}.ts`,
    [['the level check’s explorer and report', CHECK_RUN]],
  ]),
  ...['blocks/blocks', 'monsters/monsters', 'sounds/sounds', 'integrator/integrator'].map((e): [string, [string, RegExp][]] => [
    `editor/editors/${e}.ts`,
    [['the engine', /^engine\//]],
  ]),
];

describe('what loads up front', () => {
  for (const [entry, mustNot] of RULES)
    for (const [what, match] of mustNot)
      it(`${entry} doesn't bring in ${what}`, () => {
        const graph = reachable(entry, { dynamic: false });
        expect(graph.size).toBeGreaterThan(3); // the walk found the entry's imports
        expect(chains(graph, match)).toEqual([]);
      });
});
