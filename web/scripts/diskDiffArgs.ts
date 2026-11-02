// Argument parsing for `npm run disk:diff`: two disks (folders or zips), or one game id with --since <rev>.
export type DiskDiffArgs =
  | { mode: 'paths'; a: string; b: string; json: boolean; notes: boolean }
  | { mode: 'since'; game: string; since?: string; json: boolean; notes: boolean }
  | { error: string };

export function parseDiskDiffArgs(argv: string[]): DiskDiffArgs {
  const args = argv.filter((a) => a !== '--');
  const json = args.includes('--json');
  const notes = args.includes('--notes');
  const pos: string[] = [];
  let since: string | undefined;
  let hasSince = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--since') {
      hasSince = true;
      const v = args[i + 1];
      if (v && !v.startsWith('--')) {
        since = v;
        i++;
      }
    } else if (a.startsWith('--since=')) {
      hasSince = true;
      since = a.slice(8) || undefined;
    } else if (!a.startsWith('--')) pos.push(a);
  }
  if (hasSince) {
    if (pos.length !== 1) return { error: '--since takes one game id: disk:diff -- <game-id> --since [rev]' };
    return { mode: 'since', game: pos[0], since, json, notes };
  }
  if (pos.length !== 2)
    return {
      error: 'Usage: npm run disk:diff -- <folder|.zip> <folder|.zip> [--json|--notes]\n   or: npm run disk:diff -- <game-id> --since [rev] [--json|--notes]',
    };
  return { mode: 'paths', a: pos[0], b: pos[1], json, notes };
}
