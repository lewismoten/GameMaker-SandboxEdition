# `winHelp/`: the Windows downloads page

Part of the [source map](../README.md). `#/windows`: what SmartScreen's "Windows protected your PC"
means for a downloaded game and how to run it anyway. Siblings: [`macHelp/`](../macHelp/README.md), [`linuxHelp/`](../linuxHelp/README.md).

Entry point: `main.ts` loads `winPage.ts` (`renderWinHelp`) dynamically when the hash is `#/windows`.

- `winPage.ts`: the page's text and layout (it imports `../macHelp/macPage.css`, so it has no CSS of its own).

Must not: be imported statically (it is its own chunk). Text is one voice, US English, no "we".

Tests: none of its own. Check by opening `#/windows` at 390 and 1440 wide, light and dark, with axe.
