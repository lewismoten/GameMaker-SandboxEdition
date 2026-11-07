// npm run release:seed -- pack | upload | fetch
// The build seed: the slow generated files a site build would otherwise make from nothing (the plastic trinkets in
// web/public/trinkets/, the laser nickels in web/public/laser/, Depth Perception's rendered frames in
// games/.render-cache/<frame key>/, and each listed game's disk/ and walkPaths.json with its build-cache entry),
// packed from a finished local build into one .tar.gz on the build-seed GitHub release. The Pages workflow fetches it
// before building the games; every game, trinket set, nickel and frame set keeps its own source key, so build-games.mjs
// still remakes anything whose sources changed and the site is the same with or without the seed (only slower: from
// nothing, the trinkets alone take far over CI's five minutes). Secret games stay out of it (their names would be in
// the archive); CI builds them from source.
//   pack    write <scratch>/site-seed.tar.gz from this checkout (run npm run build:games first)
//   upload  pack, then put it on the build-seed release (made as a prerelease when missing; needs gh signed in)
//   fetch   download and unpack it here; a missing seed is a warning, not a failure
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gameSourceHash, root } from '../game-build-inputs.mjs';

const REPO = 'lewismoten/GameMaker-SandboxEdition';
const TAG = 'build-seed';
const FILE = 'site-seed.tar.gz';
const command = process.argv[2];
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', ...options });

const CACHE = 'games/.render-cache/seed-build-cache.json';

function pack() {
  const frames = `games/.render-cache/${gameSourceHash(true)}`;
  const listed = readdirSync(join(root, 'games')).filter((id) => {
    const about = join(root, 'games', id, 'about.json');
    return existsSync(join(root, 'games', id, 'disk')) && existsSync(about) && JSON.parse(readFileSync(about, 'utf8')).secret !== true;
  });
  const cache = JSON.parse(readFileSync(join(root, 'games/.build-cache.json'), 'utf8'));
  const only = (map) => Object.fromEntries(Object.entries(map ?? {}).filter(([id]) => listed.includes(id)));
  writeFileSync(join(root, CACHE), JSON.stringify({ keys: only(cache.keys), frames: cache.frames, outputs: only(cache.outputs) }));
  const games = listed.flatMap((id) => [`games/${id}/disk`, ...(existsSync(join(root, 'games', id, 'walkPaths.json')) ? [`games/${id}/walkPaths.json`] : [])]);
  const parts = ['web/public/trinkets', 'web/public/laser', frames].filter((p) => existsSync(join(root, p)) && readdirSync(join(root, p)).length);
  if (parts.length < 3)
    throw new Error(
      `Missing ${['web/public/trinkets', 'web/public/laser', frames].filter((p) => !parts.includes(p)).join(', ')}: run npm run build:games first.`,
    );
  const out = join(mkdtempSync(join(tmpdir(), 'site-seed-')), FILE);
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  writeFileSync(join(root, 'games/.render-cache/seed.json'), JSON.stringify({ commit, made: new Date().toISOString(), parts }, null, 2));
  // COPYFILE_DISABLE keeps macOS's ._ resource files out of the archive
  run('tar', ['-czf', out, '--exclude', '.DS_Store', 'games/.render-cache/seed.json', CACHE, ...parts, ...games], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  });
  console.log(`${out} (${parts.join(', ')}, ${listed.length} game disks; commit ${commit.slice(0, 9)})`);
  return out;
}

if (command === 'pack') pack();
else if (command === 'upload') {
  const file = pack();
  try {
    execFileSync('gh', ['release', 'view', TAG, '--repo', REPO], { stdio: 'ignore' });
  } catch {
    run('gh', [
      'release',
      'create',
      TAG,
      '--repo',
      REPO,
      '--prerelease',
      '--title',
      'Build seed (not a release)',
      '--notes',
      'Generated files the Pages build starts from (scripts/release/seed.mjs). Not a download.',
    ]);
  }
  run('gh', ['release', 'upload', TAG, file, '--repo', REPO, '--clobber']);
} else if (command === 'fetch') {
  const dir = mkdtempSync(join(tmpdir(), 'site-seed-'));
  try {
    run('gh', ['release', 'download', TAG, '--repo', REPO, '--pattern', FILE, '--dir', dir]);
  } catch {
    console.log(`warning: no ${FILE} on the ${TAG} release; the games build makes every trinket, nickel and frame from nothing (slow)`);
    process.exit(0);
  }
  run('tar', ['-xzf', join(dir, FILE)]);
  // the seeded games' build-cache entries, unless this checkout already has its own cache
  if (!existsSync(join(root, 'games/.build-cache.json'))) copyFileSync(join(root, CACHE), join(root, 'games/.build-cache.json'));
  console.log(`Unpacked the build seed: ${readFileSync(join(root, 'games/.render-cache/seed.json'), 'utf8').replace(/\s+/g, ' ')}`);
} else {
  console.log('Usage: npm run release:seed -- pack | upload | fetch');
  process.exit(2);
}
