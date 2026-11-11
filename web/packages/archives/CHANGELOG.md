# Changelog

Changes to `@lewismoten/gamemaker-sandbox-archives`, released as `archives-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.2.2] - 2026-11-11

A stored ZIP entry whose declared size doesn't match its bytes is refused.

### Fixed

- A stored ZIP entry whose directory declares a different size than the bytes it holds is refused, so it can no longer return more than the size budget counted.

## [3.2.1] - 2026-11-09

Security fix: zip reading now has safe default limits.

### Security

- Reading a zip with no limits given now uses safe defaults (8,192 entries, 256 MB unpacked), and zips inside zips in an import share one byte budget, so a small zip can no longer unpack to gigabytes.

Full list: [changes/release/archives/3.2.1.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/archives-v3.2.1/changes/release/archives/3.2.1.md)

## [3.2.0] - 2026-11-07

The first release: game discovery, ZIP and SFX extraction, ZIP creation and a full import scanner, with no Node-only
code. Imports check what FLI, GIF and VOC files really hold and keep the player's build and author bytes.

### Added

- Game discovery, ZIP and SFX extraction, and ZIP creation, with no Node-only code.
- A dedicated entry for the complete import scanner, with documented and verified scan-and-select APIs.
- Importing checks what FLI, GIF and VOC files really hold, and keeps the player's build and author bytes.

Full list: [changes/release/archives/3.2.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/archives-v3.2.0/changes/release/archives/3.2.0.md)

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/archives-v3.2.2...HEAD
[3.2.2]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/archives-v3.2.1...archives-v3.2.2
[3.2.1]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/archives-v3.2.0...archives-v3.2.1
[3.2.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/archives-v3.2.0
