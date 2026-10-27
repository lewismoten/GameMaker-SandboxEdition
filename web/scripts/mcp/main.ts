// Starts the Game-Maker MCP server on stdio (npm run mcp). Standard output carries only the
// protocol; notes go to standard error. Arguments: --root <dir> (writable, repeatable; or
// GM_MCP_ROOTS), --read-root <dir> (read-only), --app-dir <dir> (a built site for exports).
// The process makes no network requests: fetch is refused outright (exports.ts reads the built
// site through its own).
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';
import { Roots } from './roots';
import type { ServerState } from './serverTools';
import { EditorBridge } from './bridge';

globalThis.fetch = async (input) => {
  throw new Error(`No network: ${String(input instanceof Request ? input.url : input)} was not fetched.`);
};

const argv = process.argv.slice(2);
const arg = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

// --bridge-origin <origin> lets another page pair (beside this computer's and the published site)
const origins = argv.flatMap((a, i) => (a === '--bridge-origin' && argv[i + 1] ? [argv[i + 1]] : []));
const bridge = new EditorBridge(origins);
bridge.onChange = (paired) => console.error(paired ? 'An editor tab paired.' : 'The editor tab disconnected.');
const state: ServerState = { roots: Roots.fromArgs(argv, process.env), appDir: arg('--app-dir'), bridge };
const server = createServer(state);
await server.connect(new StdioServerTransport());
console.error(`Game-Maker MCP server ready. Writable: ${state.roots.write.join(', ')}`);
// --bridge starts the editor bridge at once (else the editor_bridge tool starts it)
if (argv.includes('--bridge')) {
  const port = await bridge.start();
  console.error(`Editor bridge: ws://127.0.0.1:${port}  pairing code ${bridge.code}`);
}
