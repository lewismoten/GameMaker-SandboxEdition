# Repository scripts

`verify-packages.mjs` runs through root `npm run verify:packages`. It copies each SDK
workspace outside the monorepo, installs declared development dependencies plus locally
packed SDK dependencies, and invokes that package's own build and packed-consumer tests.
A final consumer exercises engine, archives and tools together. Run this longer verification locally before a package release. GitHub workflows have five-minute job limits and run only the fast Vitest selection; they do not run this isolated-consumer check. Temporary source copies
and tarballs are removed afterwards. This catches hidden repository source dependencies
that testing a package inside the workspace would miss.

Site build-time tools remain in [`web/scripts`](../web/scripts/README.md).
