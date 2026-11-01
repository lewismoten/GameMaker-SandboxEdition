# soundSettings

The ⚙ menu's **Sound and tour…** dialog (`soundDialog.ts`, loaded when chosen from `settingsMenu.ts`).

- Music, Voice and Sound effects each have an on/off switch and a 0-100 volume. The Tour switch turns the
  waiting guides on for every page that has a tour (`tour/tourPages.ts` `setAllGuides`, the same
  `gm-tour-on` the ? menu's "Guides wait on this page" writes).
- The mix itself lives in the engine package, `packages/engine/src/audio/mix.ts` (`gm-sound-mix` in
  `localStorage`). `AudioEngine` puts the music and the effects through their own gains, so every player
  follows a change at once; the tour plays its voice clips at the Voice volume (`tour/tourSound.ts`).
  It touches no game file or export.
- Separate, and left as they were: the demo sound choice (`media/demoAudio.ts`), the tour's own mute switch
  and the desk speakers' volume knob (`output.ts`).
