# soundSettings

The ⚙ menu's **Sound and tour…** dialog (`soundDialog.ts`, loaded when chosen from `settingsMenu.ts`).

- Music, Voice, Sound effects and Games each have an on/off switch and a 0-100 volume. The Tour switch turns the
  waiting guides on for every page that has a tour (`tour/tourPages.ts` `setAllGuides`, the same
  `gm-tour-on` the ? menu's "Guides wait on this page" writes).
- The mix itself lives in the engine package, `packages/engine/src/audio/mix.ts` (`gm-sound-mix` in
  `localStorage`). `AudioEngine` puts the music and the effects through their own gains, so every player
  follows a change at once; an engine that plays a game (`AudioEngine.setGame`, set by `player/player.ts`
  and the desk's game sounds) also runs through the **Games** gain, so a game's music is Games x Music and its
  effects, digitized sounds and PC speaker are Games x Sound effects (the Voice setting doesn't touch a game's own
  voices). Spoken clips follow Voice: the tour's recorded guides (`tour/tourSound.ts`) and the callers on the
  phone and in BBS pickups (`audio/voices.ts`, browser speech: volume applies from the next line, Voice off
  silences at once).
  It touches no game file or export.
- Separate, and left as they were: the demo sound choice (`media/demoAudio.ts`), the tour's own mute switch
  and the desk speakers' volume knob (`output.ts`).
