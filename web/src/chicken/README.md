# `chicken/`: Sir Reginald and Lady Regina

Part of the [source map](../README.md).

Doc Leo's rubber chicken follows Tune-Up's story. In Tune-Up, after Muffled (level 9), the
8-track changes programs and Sir Reginald lays an egg; from The Rain Delay on, the card break
has made her Lady Regina Cluckington III, the same bird with a silver tiara in front of her comb.
The site's own pages follow along.

- `chickenState.ts`: the state (`'sir'` or `'lady'`), one localStorage key (`gm-chicken`, absent
  means Sir Reginald), `setChicken`, `onChicken`. It renders nothing; `onChicken` uses window
  events for same-page and cross-tab changes and returns an unsubscribe function. Unreadable
  storage means Sir Reginald, and a failed write returns false without a memory fallback.
  The backup's Eggs section carries the key (`backup/inventory.ts`, `backup/sections/eggs.ts`).
- `chickenStory.ts`: the trigger. The web player reports each scene entered
  (`achievements/index.ts` `playAchievements`); a matching scene description from The Rain Delay
  through The Parade Route, or Game Won, sets Lady. The match uses the listed names in
  `chickenStory.ts`, not a level-number cutoff. Demos, walkthrough playback, bundles and editor
  projects do not trigger it through these hooks. The felt egg isn't the signal: it is optional
  and the card break plays for everyone.
- `chickenWords.ts`: the name and pronouns for site text (`chickenWords()`).
- `chickenArt.ts`: the tiara, in the same shapes as Tune-Up's (`games/tuneup/src/art/chicken.ts`).
- The desk PC's `REGGIE.EXE` (`retro/hacks/reggie.ts`, BBS W)arez area) shows who the chicken is and
  restores Sir Reginald (`REGGIE SIR`), or crowns Lady Regina again (`REGGIE LADY`).

Not changed: the games and their files, retail box covers (`desk/boxes/covers/`), the Library's
video text (Lewis's own words) and pictures cut from game files (the cast page's Doc Leo).
