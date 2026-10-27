# `desk/`: the 1994 desk

Part of the [source map](../README.md).

The 1994 desk. `desk.ts` puts it together and works it: the disks, the
boxes, the catalog and what the address asks for (`deskRestore.ts`). `deskScene.ts` draws the
scene (`stage.ts` scales it to the window); `deskPc.ts` switches the PC on and off and loads its
insides; `deskShelf.ts` fills the shelf, `deskGmBox.ts` opens the Game-Maker box, `deskLook.ts`
points out a prop, and `wallTrophies.ts` hangs the eggs and trophies once earned.
`overlayFocus.ts` moves the keyboard into an overlay and back.

- `pc/`: the case (`caseParts.ts`), the CRT (`crtWarp.ts`; `screenGlow.ts` lights the bezel with
  the colors of the picture on the tube), the keyboard (`keyboard.ts`) and the keyboard tray
  (`tray.ts`) with its mouse pad (its print, `padPrints.ts`, chosen in `padChooser.ts` from the
  magazine's mouse pad ad and remembered by `padChoice.ts`), the GRAVITAS game pad
  (`gamePad.ts`; its drawing `gamePadArt.ts`, its SVG parts `gamePadSvg.ts`, its large controls
  `gamePadPanel.ts`, what is held `gamePadHolds.ts`), the modem (`modem.ts`; click its speed to
  pick the line speed), the speakers (`speakers.ts`) with the SOUND BOASTER switch
  (`blasterSwitch.ts`), the key card taped to the monitor (`keyCard.ts`, `keyCardRows.ts`) and
  the capture card (`capture.ts`, loaded by `captureStub.ts` on the first press).
- `boxes/`: the retail boxes and their shelf (`shelf.ts`, `shelfLayout.ts`), turned in the box
  viewer (`boxViewer.ts`). A game's box (`gameBox.ts`) is drawn from the game itself
  (`boxFacts.ts`, its play hours from its walkthrough in `playtime.ts`) with `boxPaint.ts`,
  `boxSeals.ts`, shelf wear (`boxWear.ts`), a glow under the black light (`boxUv.ts`) and a
  painted cover (`covers/<id>.ts`, with the brushes in `covers/paint.ts`); what came in it is
  `gameBoxContents.ts`, `boxList.ts` and `printContext.ts`. `gmBox.ts` is the Game-Maker box.
- `disks/`: the disk box (`diskBox.ts`; closed on the desk, `diskBoxFill.ts`), the buttons for
  the disk in drive A: (`driveActions.ts`) and the disks' labels (`diskLabel.ts`, RSD's own in
  `rsdLabel.ts`).
- `mug/`: the BBS mug (`mug.ts`, drawn in 3D by `mug3d.ts`, turned in `mugViewer.ts`). Its
  pictures (`mugArt.ts`) are badges: each Sandbox game's cut from its title screen
  (`gameBadge.ts`, `gameMugArt.ts`), the BBS's from its ANSI art (`bbsBadge.ts`). "Make your
  own" prints a sublimation page (`mugPrint.ts`, `mugSheet.ts`, `mugLayout.ts`, `mugSizes.ts`,
  remembered by `mugPageStore.ts`).
- `room/`: the window (`snowWindow.ts`, as light as it is outside by `daylight.ts`), the poster
  (`wallPoster.ts`, under black light `posterUv.ts` and `motenUv.ts`), the clipping
  (`newsClipping.ts`), the clock (`wallClock.ts`; its glow-in-the-dark paint charges and fades in
  `lumeCharge.ts`), the door (`roomDoor.ts`), the waste basket (`wasteBasket.ts`), the wall phone
  (`room/phone/`: `phone.ts`, who answers in `calls.ts`, `dialPad.ts`, `sounds.ts`) and its notes
  (`phoneNotes.ts`), the shareware catalog (`catalog.ts`) and the magazine lying on the desk
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
