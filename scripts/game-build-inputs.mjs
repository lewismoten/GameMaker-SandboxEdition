// Shared fingerprint for generated game disks and reusable rendered animation frames.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function gameSourceHash(frames = false) {
  const hash = createHash('sha256');
  function tree(dir) {
    if (!existsSync(dir)) return;
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (['disk', 'walkPaths.json', '.build-cache.json', '.render-cache', '.DS_Store', '__pycache__'].includes(item.name)) continue;
      const file = join(dir, item.name);
      if (item.isDirectory()) tree(file);
      else if (item.isFile() && !item.name.endsWith('.md'))
        hash.update(relative(root, file).replaceAll('\\', '/')).update('\0').update(readFileSync(file)).update('\0');
    }
  }
  const dirs = frames
    ? [join(root, 'games/depth/src'), join(root, 'games/kit'), ...['engine', 'tools'].map((p) => join(root, 'web/packages', p, 'src'))]
    : [join(root, 'games'), join(root, 'web/src'), ...['engine', 'tools', 'archives'].map((p) => join(root, 'web/packages', p, 'src'))];
  for (const dir of dirs) tree(dir);
  hash.update(readFileSync(join(root, 'package-lock.json')));
  return hash.digest('hex');
}
