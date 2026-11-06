# `macHelp/`: the Mac downloads page

Part of the [source map](../README.md). `#/mac`: what macOS's "Apple could not verify…" warning
means for a downloaded game and how to open it anyway. Sibling pages: [`winHelp/`](../winHelp/README.md), [`linuxHelp/`](../linuxHelp/README.md).

Entry point: `main.ts` loads `macPage.ts` (`renderMacHelp`) dynamically when the hash is `#/mac`.

- `macPage.ts`: the page's text and layout.
- `macPage.css`: its styles.

Must not: be imported statically (it is its own chunk). Text is one voice, US English, no "we".

Tests: none of its own. Check by opening `#/mac` at 390 and 1440 wide, light and dark, with axe.
