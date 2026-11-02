// The Vite config a game build child uses (`vite-node -c`): web/vite.config.ts's module resolution and nothing else.
// The site config also loads the CD scan, SEO and offline plugins and a file watcher, which a game build never uses
// and which cost every one of the 28 children about a third of a second.
export default {
  resolve: { conditions: ['gamemaker-source', 'module', 'browser', 'development|production'] },
  ssr: { noExternal: [/^@lewismoten\/gamemaker-sandbox-/], resolve: { conditions: ['gamemaker-source', 'module', 'node', 'development|production'] } },
  base: './',
};
