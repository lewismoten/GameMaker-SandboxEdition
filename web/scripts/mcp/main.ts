// Starts the Game-Maker MCP server on stdio (npm run mcp). Standard output carries only the
// protocol; notes go to standard error. Arguments: --root <dir> (writable, repeatable; or
// GM_MCP_ROOTS), --read-root <dir> (read-only), --app-dir <dir> (a built site for exports).
// The process makes no network requests: fetch is refused outright (exports.ts reads the built
// site through its own).
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';
import { Roots } from './roots';
import type { ServerState } from './serverTools';

globalThis.fetch = async (input) => {
  throw new Error(`No network: ${String(input instanceof Request ? input.url : input)} was not fetched.`);
};

const argv = process.argv.slice(2);
const arg = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const state: ServerState = { roots: Roots.fromArgs(argv, process.env), appDir: arg('--app-dir') };
const server = createServer(state);
await server.connect(new StdioServerTransport());
console.error(`Game-Maker MCP server ready. Writable: ${state.roots.write.join(', ')}`);
