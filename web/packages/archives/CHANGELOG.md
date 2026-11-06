# Changelog

Changes to `@lewismoten/gamemaker-sandbox-archives`, released as `archives-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

The first release: portable game discovery, ZIP and SFX extraction, and ZIP creation for Game-Maker files.

### Added

- A found game reports the size of its files together (`FoundGame.bytes`).
- Game discovery and ZIP/SFX extraction, and ZIP creation, with no Node-only code.
- A dedicated entry for the complete import scanner, with documented and verified scan-and-select APIs.
- Importing sniffs the contents of FLI, GIF and VOC files, lists each as what it really is, and says when a foreign .FLI is not an animation.
- Imports keep the player's build and author bytes, and a DOS download writes a 3.00 player back.
- A game's displayed title comes from `gameTitle` everywhere outside DOS.

### Fixed

- Imported player identification reasons decode DOS author text as CP437 for display while retaining the original author and About-page byte strings.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/commits/develop/web/packages/archives
