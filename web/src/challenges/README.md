# Challenge foundations

Part of the [source map](../README.md). Phase 1 contains data and visit-only storage,
not a challenge launcher. The printable pilot is in
[`manual/printables/relay.ts`](../manual/printables/relay.ts).

`profile.ts` reviews one public stage: Teddy's backyard. `BACKYARD_START` specifies a
fresh New Play, pristine character defaults, scene 2 at (6,39), seed 1, no overlays,
untimed rules, the handover and the normal exit. A future runner must enforce those
conditions and release all keys before presenting Ready. The target is manually observed,
not a verified result. No engine behavior or DOS content changes here.

`descriptor.ts` accepts only that reviewed game/version/hash/scene/profile/rules/target.
Text is eight pipe-separated ASCII fields starting `gm-challenge/1`; fragments are
`#challenge=` plus URI-encoded text. Only fragments are parsed, never whole URLs. The text
limit is 256 characters (also bytes for this ASCII format); the encoded limit is 779.
Fields are exact, with canonical scene numbers and no free text or extension fields.
Errors are identical for malformed, unknown, stale and restricted content and never echo
input. Parsing has bounded work and no I/O, browser state, rule evaluation or game loading.
This does not add a route to the site: a fragment currently has no Start action.

The content pin is SHA-256 of all pristine disk files in lowercase filename order, each
encoded as UTF-8 `filename`, NUL, decimal byte length, NUL, then raw bytes. The metadata
and disk fixture test refuses drift. When content changes, review it again, update the
pin and profile version deliberately, and retain an older profile only if its exact assets
remain available. A future launcher must hash the loaded bytes against the pin before
starting; trusting the descriptor alone does not verify downloaded content. The explicit
allowlist excludes every other game, including revealed secret games and Starters. Adding
profiles requires checking `about.json` for those restrictions; tests cover secret metadata.

## Guest-state isolation design

Use an explicit per-run capability, never a global “guest” switch, save-name prefix or
save-and-restore of owner data. Two tabs must be able to run independently. Guest runs
receive only a fully loaded pristine disk and a copied allowlist of presentation settings
(e.g. reduced motion and muted audio). They never receive a project, save ID, companion,
backup, collection inventory or a reference to owner stores.

`guestState.ts` implements the small storage seam: deep-copied `GameFiles` and an in-memory
settings map for each turn. The caller must select the presentation settings: the seam copies
every supplied entry, not a built-in allowlist. It does not inherit stream, guard or change callbacks. Saves,
recordings and `.HIS` writes remain inside those files. Reads cannot discover owner saves.
No IndexedDB, localStorage or sessionStorage is used, so blocked storage is also supported.
Closing removes the capability's file entries and settings; late normal file writes fail.
It does not erase byte arrays a caller already holds. Call close only after
stopping the engine and releasing input; discard the object afterwards. The pristine disk
argument is a trusted loader boundary, not an imported owner's overlaid directory.

**Integration gate for Phase 2:** do not pass this seam into the current `mountPlayer` and
claim isolation. `play.ts` currently loads owner overlays and installs `playAchievements`
and `playSaves`. `player/player.ts` adds tin-heart, score-trophy and piggy-bank hooks and
hardware setup; `player/hardwareSetup.ts` persists choices. A guest adapter must bypass
all those writes, including indirect achievement events, egg detection through saves,
tin hearts, score trophies, hardware/audio/speed/touch preferences, last-played history,
dev interaction logging and automatic backups. Supply engine callbacks through a
separate guest policy and use presentation-only controls backed by this memory map.
Never install a regular hook and hope it sees a fake save ID.

At Ready create a new capability from the pinned pristine assets. On Done/Close/error,
stop the machine, clear keyboard/touch/gamepad state, detach listeners, await pending work,
then close the capability. Retry gets another clean capability. Resume/refresh loses the
visit by design; explain “This turn lasts only for this visit.” Any later event save/export
needs its own bounded schema, explicit preview and independent clear action. Never merge
it through whole-site backup/import. Owner settings are copied selectively, never restored
by overwriting storage after a turn.

Before a guest launcher ships, integration tests must seed sentinel owner saves,
achievements, eggs, tin hearts, trophies and settings, run through pickups, saves, loss,
finish, retry, failure and exit, and compare owner stores byte-for-byte. Test two tabs and
blocked storage. Current unit tests establish only the seam's storage/copy/disposal
properties; they do not establish isolation of the existing player. Until then the paper
pilot directs players to a separate browser guest profile.
