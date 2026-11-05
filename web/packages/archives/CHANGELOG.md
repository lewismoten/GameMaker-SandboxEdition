# Changelog

Changes to `@lewismoten/gamemaker-sandbox-archives`, released as `archives-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.2.0] - 2026-11-05

The first release: portable game discovery, ZIP and SFX extraction, and ZIP creation for Game-Maker files.

### Added

- Game discovery and ZIP/SFX extraction, and ZIP creation, with no Node-only code.
- A dedicated entry for the complete import scanner, with documented and verified scan-and-select APIs.
- Importing sniffs the contents of FLI, GIF and VOC files, lists each as what it really is, and says when a foreign .FLI is not an animation.
- Imports keep the player's build and author bytes, and a DOS download writes a 3.00 player back.
- A game's displayed title comes from `gameTitle` everywhere outside DOS.



[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/archives-v3.2.0...HEAD
[3.2.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/archives-v3.2.0