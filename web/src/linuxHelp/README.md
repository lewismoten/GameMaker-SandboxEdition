# `linuxHelp/`: the Linux downloads page

Part of the [source map](../README.md). `#/linux`: how to extract and play a game downloaded for
Linux (`src/export/linuxApp.ts`), the WebKitGTK package it needs on common distributions, the web
browser fallback, adding it to the applications menu and removing it. Siblings: [`macHelp/`](../macHelp/README.md), [`winHelp/`](../winHelp/README.md).

Entry point: `main.ts` loads `linuxPage.ts` (`renderLinuxHelp`) dynamically when the hash is `#/linux`.
The Download chooser (`editor/shell/download.ts`) links to it.

- `linuxPage.ts`: the page's text and layout. It shares `../macHelp/macPage.css`, builds a
  table of contents with `../pageToc.ts` and records the Linux help visit with `tally`.
- `../seo/route.ts` observes the route and updates its metadata; `linuxPage.ts` imports only
  the repository URL from `seo/site.ts`.

Must not: be imported statically (it is its own chunk). Text is one voice, US English, no "we".

Tests: none of its own. Check by opening `#/linux` at 390 and 1440 wide, light and dark, with axe.
