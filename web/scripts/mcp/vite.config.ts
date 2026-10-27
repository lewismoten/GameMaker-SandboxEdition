// The MCP server's Vite settings for vite-node (npm run mcp): none of the site's build plugins,
// no file watching and no output, so standard output carries only the MCP protocol.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, '../..'),
  logLevel: 'silent',
  clearScreen: false,
  server: { watch: null, hmr: false },
});
