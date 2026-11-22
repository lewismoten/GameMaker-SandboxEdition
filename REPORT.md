# ZIP entry CRC validation

On Sunday, November 22, 2026 at 01:15 UTC, I checked the available Git history and branches for an earlier CRC fix. Commit `505b40d4a` checked stored entry sizes. The shared archive reader still returned same-length damaged data.

The archives package now compares the CRC-32 of each stored or inflated file with its central directory record when the file is read. Both `readZip` and editor import use this reader. The existing import error panel in `web/src/editor/shell/homeImport.ts` displays the filename from the error. I added release fragments for the package and site and credited OpenAI Codex in NOTICE.md.

At 01:16 UTC, 41 tests passed across seven ZIP and import suites. The stored regression flips a payload byte. The deflated regression flips a central directory CRC byte so decompression still succeeds. The intact round trip covers both methods. The editor test picks a corrupted game ZIP and checks the error panel message and that project creation, saving, and navigation never occur.

Prettier and ESLint passed on the changed files they cover. The archives package typecheck passed. At 01:20 UTC the web typecheck also passed with an 8 GiB Node heap after the default heap was exhausted. The full Vitest suite and a live browser import were outside the targeted checks.

Suggested commit message: `Reject ZIP entries with mismatched CRC-32 before importing projects`
