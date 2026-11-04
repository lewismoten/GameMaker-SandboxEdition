# `desk/`: the 1994 desk

Part of the [source map](../README.md).

The 1994 desk. `desk.ts` puts it together and works it: the disks, the
boxes, the catalog and what the address asks for (`deskRestore.ts`). `deskScene.ts` draws the
scene (`stage.ts` scales it to the window); `deskPc.ts` switches the PC on and off and loads its
insides; `deskShelf.ts` fills the shelf, `deskGmBox.ts` opens the Game-Maker box, `deskLook.ts`
points out a prop, and `wallTrophies.ts` hangs the eggs and trophies once earned.
`overlayFocus.ts` moves the keyboard into an overlay and back. `wallTrophies.ts` also puts Teddy's Forte Locks toy safe ([`fortKnox/`](../fortKnox/README.md)) at the desk's right end after a catalog win, including the zero left by games with no money counter. Its combination is scribbled in pencil on the sticky note under the phone (`room/phoneNotes.ts`). `deskTour.ts` is the guided tour's BBS chapter on this PC: it
calls The Sandbox BBS and types for the tour, then puts back what the call changed.

- `pc/`: the case (`caseParts.ts`, with the hard disk's flickering HDD light beside POWER and TURBO; the key lock beside the POWER and RESET buttons is drawn only; RESET reboots a PC that is on, `Computer.reset`; the TURBO button sits beside the MHz display), the CRT (`crtWarp.ts`; `screenGlow.ts` lights the bezel with
  the colors of the picture on the tube; `crtWarmUp.ts` and `crtOn.css` warm the tube up at switch-on: dark, the beam's flickering line, the picture fading up torn into jagged rows that settle;
  `crtOff.css` collapses it at switch-off), the fans whining up and the drives the boot reads (floppy seek test,
  hard disk seeks, the CD-ROM's test), fading out slowly at the DOS prompt (`bootSounds.ts`), the drives' own sounds after the boot (`driveSounds.ts`, synthesized, no files: the floppy's disk seating, head recalibration and FAT read, its eject push-button and the disk sliding out, the CD tray's motor and clunk, the disc spinning up and reading; they play on real access through `onDriveAccess`, follow the Sound effects setting and wait for a first gesture), the two 5.25" half-height bays (146 x 41.3 mm; every size in `desk.css` is mm times one `--mm` factor: the CD-ROM fills its bay, the 3.5" floppy sits on an adapter plate with a 101.6 mm face, a 93 mm slot, the light under it at the left and the eject push-button at the right), a game's paper code wheel or code sheet lying beside the monitor on its puzzles' scenes, to turn or read or be told the answer (`codeWheelSpot.ts`, the decoders themselves `manual/printables/codeWheel.ts` and `codeSheet.ts`; the PC passes the scene with `onScene`), the keyboard (`keyboard.ts`) and the keyboard tray
  (`tray.ts`) with its mouse pad (its print, `padPrints.ts`, chosen in `padChooser.ts` from the
  magazine's mouse pad ad and remembered by `padChoice.ts`), the GRAVITAS game pad
  (`gamePad.ts`; its drawing `gamePadArt.ts`, its SVG parts `gamePadSvg.ts`, its large controls
  `gamePadPanel.ts`, what is held `gamePadHolds.ts`, its TURBO switch `gamePadSwitch.ts`), the modem (`modem.ts`; click its speed to
  pick the line speed), the speakers (`speakers.ts`) with the SOUND BOASTER switch
  (`blasterSwitch.ts`, applied immediately to the active game without restarting), the key card taped to the monitor (`keyCard.ts`, `keyCardRows.ts`) and
  the capture card (`capture.ts`, loaded by `captureStub.ts` on the first press).
  Narrow layouts hide the physical speakers and expose a 32px Sound Boaster switch beneath
  the key strip. Both controls share the remembered state and apply it to the current player.
- `boxes/`: the retail boxes and their shelf (`shelf.ts`, `shelfLayout.ts`), turned in the box
  viewer (`boxViewer.ts`). The box in the viewer is kept in the address (`boxAddress.ts`): `#/desk?open=box:<game id>`, with `&turn=<y>,<x>,<zoom>` once turned by hand. Opening pushes a history entry (Back closes the viewer), stepping along the shelf replaces it; a reload or shared link opens it again, but only for a box on this visitor's shelf (an unknown id, or a secret game not yet revealed, opens nothing and is dropped from the address). A game's box (`gameBox.ts`) is drawn from the game itself
  (`boxFacts.ts`, its play hours from its walkthrough in `playtime.ts`) with `boxPaint.ts`,
  `boxSeals.ts`, shelf wear (`boxWear.ts`), a glow under the black light (`boxUv.ts`) and a
  painted cover (`covers/<id>.ts`, with the brushes in `covers/paint.ts`); what came in it is
  `gameBoxContents.ts`, `boxList.ts` and `printContext.ts`. `gmBox.ts` is the Game-Maker box. A game's plastic trinkets (3D-printable STL, 3MF and support files its build
  makes into `public/trinkets/<id>/`) are listed as `trinketShelf.ts` in the box viewer: choosing one takes the turning box's place
  (choosing it again, or "Back to the box", returns the box), with a labeled STL (one color) / 3MF (colors,
  the default) switch; Depth's trinkets and the pixel figures of the other games (`games/kit/pixelTrinkets.ts`,
  whose items name a color-carrying `preview` STL) share it. It is drawn by the small WebGL viewer `trinketGl.ts`, turned by `trinketTurntable.ts` (spinning, drag and arrow keys; shared with the Library toy box's closer look). `trinketData.ts` reads the manifests and STL meshes (shared with the Library's toy box, `library/toyBox.ts`) and `trinketSnap.ts` draws a trinket once as a still PNG for lists.
  Laser kits sit under the trinkets on the same shelf (its heading is then "Trinkets and kits", and a game with kits but no trinkets still gets the shelf): `laserKits.ts` reads `public/laser/<id>/manifest.json` and `public/laser/<id>/stage-box/manifest.json` (a game can hold both kits; written by `games/kit/laserNickels.ts`; a secret game has none) and `laserKitList.ts` draws each kit's real PNG previews, a one-line what-it-is and labeled SVG download links. The wooden nickel (`key: "laser-nickel"`) is worded in `kitOf`; any other kit (the Stage Box, `games/sleuth/laser/stageBox.ts`, in the `stage-box/` folder) adds a `kit: { title, summary, previews: [{ file, alt }], downloads: [{ file, label }] }` entry to its manifest and needs no UI code. Tests: `laserKits.test.ts`.
  `boxes/phone/` is The Phone of the Future kit (year2000's box only): one more item on that shelf, loaded with its first look. `phoneData.ts` parses the committed `games/year2000/phone/viewer/parts.json` and `parts.bin` (copied to `public/trinkets/phone/` by `scripts/build-games.mjs`) and gives each part a group (shell, dial, board, components, battery; a part's own `group` wins); `phoneExplode.ts` works out each stack's explode offset along the height from the parts' own extents (so shell, dial and button-cap parts added to the data need no code); `phoneMesh.ts` and `phoneGl.ts` draw them with the trinket shader; `phoneViewer.ts` has the four views (assembled, exploded, electronics, bare board), the explode slider and the controls. Tests: `phoneData.test.ts`.
- `disks/`: the disk box (`diskBox.ts`; closed on the desk, `diskBoxFill.ts`), the buttons for
  the disk in drive A: (`driveActions.ts`) and the disks' labels (`diskLabel.ts`, RSD's own in
  `rsdLabel.ts`, whose level strips `stripQueue.ts` draws one at a time, only once on screen).
- `mug/`: the BBS mug (`mug.ts`, drawn in 3D by `mug3d.ts`, turned in `mugViewer.ts`). Its
  pictures (`mugArt.ts`) are badges: one for every public game (a Sandbox game's, and The Bard
  of Bizarre's in a group of their own) cut from its title screen (`gameBadge.ts`,
  `gameMugArt.ts`; a game's look has options: `centerX`/`centerY` move the picture, `hide` and `mend` paint out
  small print or a second hero, `strip`, `clearTop`, and `lettering` for a ribbonless title set fresh in bold pixel lettering, `badgeLettering.ts`),
  the BBS's from its ANSI art (`bbsBadge.ts`), and the Bard's logo (made with
  DeepAI) as it is (`bardLogoArt.ts`). "Make your
  own" prints a sublimation page (`mugPrint.ts`, `mugSheet.ts`, `mugLayout.ts`, `mugSizes.ts`,
  remembered by `mugPageStore.ts`); `mugFocus.ts` keeps Tab inside the viewer and the print page.
- `room/`: the window (`snowWindow.ts`, as light as it is outside by `daylight.ts`), the poster
  (`wallPoster.ts`, under black light `posterUv.ts` and `motenUv.ts`), the clipping
  (`newsClipping.ts`), the clock (`wallClock.ts`; its glow-in-the-dark paint charges and fades in
  `lumeCharge.ts`), the door (`roomDoor.ts`), the waste basket (`wasteBasket.ts`), the wall phone
  (`room/phone/`: `phone.ts`, who answers in `calls.ts`, `dialPad.ts`, `sounds.ts`;
  `hintBill.ts` meters fictional hint-line listening time at 199 cents per minute, with
  idempotent checkpoints/hangup and a Desk-backed `gm-hint-phone-bill` balance;
  `hintLine.ts` answers 1-900-555-0144 (Hints speed dial) with Teddy's saving, map,
  enemy and free-help tips. A free prompt asks for 1 before starting pretend charges;
  0, inactivity, six menu rounds, hangup, page exit or leaving the Desk stops the meter.
  Desk disposal emits `gm-desk-close`, which hangs up an off-hook wall phone. The call's abort
  signal also cancels speech and key waits; menu keys can interrupt the spoken prompt.
  The cumulative fictional bill advances “An itemized bark” at $10; progress is in pretend
  cents and the bill itself continues past that threshold) and its notes
  (`phoneNotes.ts`), the shareware catalog (`catalog.ts`: a three-column paper catalog in the style of 1990s shareware disk lists, with a disk number per game, Freeware and Shareware sections, a price per disk and an order form) and the magazine lying on the desk
  (`paperStack.ts`), and the mug, phone and lamp (`deskProps.ts`).
- `props/`: makes the room's little things pressable (`index.ts`, `propKit.ts`, whose `cover`
  lays an empty, named button over a drawing with words on it; their sounds in
  `propSound.ts`): the clock, waste basket, door, window (`window.ts`, tonight's real moon in
  `moonPhase.ts`) and what goes by outside (`props/outside/`: `outside.ts` and one module each,
  such as THE CHEZ, the dogs, the plow and the mail jeep; `visible.ts` says whether the window can
  be seen), RSD's registration reply under the bedroom door (`mailDrop.ts`; its paper is
  `manual/printables/regConfirm.ts`, remembered in `retro/gmReg/replyMail.ts`), curtains, speaker,
  DEGAUSS, the black-light poster (`blacklight.ts`) and the felt eggs' glow under it
  (`eggGlow.ts`), the toy whistle with the zine under it (`props/zine/`, the zine itself in `manual/zine/`), and the room after dark with its
  overhead light (`roomLight.ts`). `chezArt.ts` draws THE CHEZ from `games/kit/chez.ts`'s side
  view.
