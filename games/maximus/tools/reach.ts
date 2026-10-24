// Level-design audit: on every world, flood-fills from the landing site (the courier flies on
// jet hops and the bell swims, so open space is two-way) through doors, force fields, crystal
// walls and the secret rock, and reports pickups, springs and vaults that can't be reached.
//   cd web && npx vite-node ../games/maximus/tools/reach.ts
import { reachable } from '../src/levels/mapkit';
import { buildGame } from '../src/game';

const b = buildGame();
let bad = 0;
for (const info of b.scenes) {
  if (!['surface', 'ocean', 'station', 'rover', 'core', 'boss'].includes(info.kind)) continue;
  const s = b.sets[info.bbl as keyof typeof b.sets];
  const passNames = [
    'door',
    'field:on',
    'field:on2',
    'field:off',
    'glass',
    'fake',
    'rock:fake',
    'laser:v',
    'laser:v0',
    'laser:h',
    'laser:h0',
    'plat:off',
    'seal',
  ];
  const pass = new Set(passNames.filter((n) => s.has(n)).map((n) => s.id(n)));
  const seen = reachable(info.map, s.blocks, info.arrive.x, info.arrive.y, { tall: info.chr === 'courier', pass: (n) => pass.has(n) });
  const names = new Map([...s.names_()].map(([n, i]) => [i, n]));
  const lost: string[] = [];
  for (let i = 0; i < 10000; i++) {
    const n = names.get(info.map.get(i % 100, Math.floor(i / 100))) ?? '';
    if (!/^(p:|pc:|heal$|shard:|module:)/.test(n)) continue;
    // a pickup counts as reachable when the body can stand in its cell or beside it
    const near = [0, 1, -1, 100, -100].some((d) => seen[(i + d + 10000) % 10000]);
    if (!near) lost.push(`${n}@${i % 100},${Math.floor(i / 100)}`);
  }
  if (lost.length && process.env.SHOW === info.name)
    for (const l of lost.slice(0, 3)) {
      const [x, y] = l.split('@')[1].split(',').map(Number);
      for (let dy = -3; dy <= 3; dy++)
        console.log([-3, -2, -1, 0, 1, 2, 3].map((dx) => (names.get(info.map.get(x + dx, y + dy)) ?? '?').padEnd(12).slice(0, 12)).join(' '));
      console.log('');
    }
  if (lost.length) {
    bad++;
    console.log(`${info.name}: ${lost.length} out of reach: ${lost.slice(0, 6).join(' ')}`);
  }
}
console.log(`reach: ${bad} worlds with things out of reach`);
