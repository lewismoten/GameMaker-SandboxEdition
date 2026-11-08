# @lewismoten/gamemaker-sandbox-archives 3.2.0 - 2026-11-07

Every change in this version (tag `archives-v3.2.0`). The [changelog](../../web/packages/archives/CHANGELOG.md) has the summary and the most important ones.

The first release: game discovery, ZIP and SFX extraction, ZIP creation and a full import scanner, with no Node-only
code. Imports check what FLI, GIF and VOC files really hold and keep the player's build and author bytes.

### Added

- A found game reports the size of its files together (`FoundGame.bytes`).
- Game discovery and ZIP/SFX extraction, and ZIP creation, with no Node-only code.
- A dedicated entry for the complete import scanner, with documented and verified scan-and-select APIs.
- Importing sniffs the contents of FLI, GIF and VOC files, lists each as what it really is, and says when a foreign .FLI is not an animation.
- Imports keep the player's build and author bytes, and a DOS download writes a 3.00 player back.
- A game's displayed title comes from `gameTitle` everywhere outside DOS.

### Fixed

- Imported player identification reasons decode DOS author text as CP437 for display while retaining the original author and About-page byte strings.
