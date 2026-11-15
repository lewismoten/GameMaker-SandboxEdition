# `soundSettings/`: Sound and tour

Part of the [source map](../README.md).

The ⚙ menu's **Sound and tour…** dialog (`soundDialog.ts`, loaded when chosen from `settingsMenu.ts`).
Changes apply as the controls move; **Done** and Escape close the dialog, not a separate save step.
Music and volume choices are remembered when browser storage is available; if that write fails,
the mix still applies until the page closes.

- Music, Voice, Sound effects and Games each have an on/off switch and a 0-100 volume. The Tour switch turns the
  waiting guides on for every page that has a tour (`tour/tourPages.ts` `setAllGuides`, the same
  `gm-tour-on` the ? menu's "Guides wait on this page" writes).
- The mix itself lives in the [engine package](../../packages/engine/README.md), `src/audio/mix.ts` (`gm-sound-mix` in
  `localStorage`). `AudioEngine` puts the music and the effects through their own gains, so every player
  follows a change at once; an engine that plays a game (`AudioEngine.setGame`, set by `player/player.ts`
  and the desk's game sounds) also runs through the **Games** gain, so a game's music is Games x Music and its
  effects, digitized sounds and PC speaker are Games x Sound effects (the Voice setting doesn't touch a game's own
  voices). Spoken clips follow Voice: the tour's recorded guides (`tour/tourSound.ts`) and callers on the
  phone or in BBS pickups (`audio/phone/phonePlayer.ts`). Browser-speech fallback (`audio/voices.ts`)
  takes a volume change from the next line; Voice off or volume zero silences it at once.
  It touches no game file or export.
- Separate, and left as they were: the demo sound choice (`media/demoAudio.ts`), the tour's own mute switch
  and the desk speakers' volume knob (the engine package's `src/audio/output.ts`).
