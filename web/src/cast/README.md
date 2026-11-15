# `cast/`: the Cast page

Part of the [source map](../README.md).

The Cast page (`#/cast`, `castPage.ts`, its people and things in
`castData.ts`): the regulars of the new games on a stage (`castStage.ts`, one frame drawn by
`castStageScene.ts` with `castStageDraw.ts`, the goat's and the camel's business in
`castStageGags.ts`; once it scrolls away,
a small one in a corner, `castMini.ts`), walking with their own
sprites (`castSprite.ts`, from `web/public/cast/sprites.json`) to the Teddy games' theme
(`castSound.ts`), and the games each appears in (`castThumbs.ts`; `cameos.json` for new cameos,
`hidden.json` for the Easter eggs and tin hearts, written by `web/scripts/castHidden.ts`).

`castPage.ts` keeps the selected tab and card in `tab` and `who` address parameters;
the stage's character choice is a separate `on` parameter (`castStage.ts`). The stage has
Play/Pause, Previous/Next and a character picker. With reduced motion, characters stand
instead of walking and the stage starts paused. Sound follows the site's demo sound choice,
starts from a click on the stage or its controls, and is hushed during the guided tour
(`castSound.ts`); opening the page alone does not start the theme.

`castMini.ts` mirrors the full stage's frames once it has scrolled above the viewport, not
whenever it is offscreen. Closing the small stage keeps it hidden for that page visit.
`castThumbs.ts` waits until a Seen in row is near the viewport before requesting its game
pictures, with an immediate fallback when IntersectionObserver is unavailable. The frame
and sound cleanup belongs to `castStage.ts` and runs when the page is left.
