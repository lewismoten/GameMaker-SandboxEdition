# Achievement block art

Badges reuse the original 20×20 indexed blocks below, at integer-friendly display sizes.
The selected public games are by Lewis Moten using Anthropic Claude (MIT).
The nine every-life, every-loss and every-win tier badges are composed from Teddy's poses
(hop, hurt, bark) with a bronze, silver or gold plate and a 1, 3 or 10 mark, by Claude Sonnet 5.5,
which also extracted the later picks (some from games' sprite books, drawn over a plain backdrop) and drew the thirteen new Certified Rat Tickler blocks (a toolbox, clipboard,
mixing panel, UV bulb, blacklight, CRT, sound card, hex keypad, screwdriver and disk, pirate hat, surfer, fax and
waving hand) as scenery in that game, and the eighteen new Final Curtain blocks (a rotary dial, number card, two masks,
ribbon book, leaflet, registration form, badge clipboard, blank sheet, film strip, clapperboard, magnifier, peeking face,
phone, busy line, heat map, speaker, medal and tin-heart wreath) as scenery in the green room, the stage and the curtain.
It also drew the six new A Fly Named Carl blocks (a backpack with a game controller, a DOS disk in its sleeve, a wide and a
tall phone, a winged parcel and a mail jeep) as scenery in the living room and the yard, and four new Great Dairy Reckoning blocks
(a gold cup, a silver cup marked 3, a rolled magazine and a glow-in-the-dark clock) as scenery in the kitchen and bedroom.
It also drew four new Needle blocks (a brass compass over a winding route, a folded map, a ruler and a triangle, and glasses over
three color swatches) as scenery in the tailor's shop, and four more Certified Rat Tickler blocks (Teddy and a felt egg in a frame, a rocket trailing a phone cord, a card-file box with page tabs and a UV flashlight lighting an egg) as scenery on the lab's walls. Later it drew a robot cranking a film projector and a ringing phone with a bill slip (the tailor's shop), a film strip (Loaf's hillside) and a mail truck (Carl's yard).
It also drew a new Risi block (a small library front with columns, steps and a scroll) as scenery in the rooftops.
It also drew two new Loaf blocks (northern lights in green and violet over snowy hills, and a snail with a half-finished progress bar on its shell) as scenery in the way home and the hillside.
It also drew two new Goat blocks (a shooting star with a stepped trail, and a startled goat with a musical note) as scenery in the field and the stable.
It also drew a new Smirked block (a violin with one gold musical note) as scenery in the last hall.
OpenAI Codex extracted the first images and wrote the
badge integration under Lewis's direction. No third-party emoji artwork is copied into the badge images.

Run `npx vite-node scripts/achievementArt.ts` from `web/` to regenerate
`src/achievements/blockArt.json` and this inventory. The sources and selections are in
`scripts/achievementSets.ts` and the tier badges in `scripts/achievementTiers.ts`; the generator rejects
duplicate image bytes.

## Selected blocks

| Achievement | Public game | Source set / block |
| --- | --- | --- |
| make-edit | remote | remote / pen |
| export-windows | goat | goat / window |
| export-mac | teddy | city / apples |
| export-files | goat | goat / crate |
| first-steps | goat | goat / sandal |
| make-cards | teddy | city / poster |
| play-first | remote | remote / handheld |
| play-sandbox | teddy | park / bucket |
| play-teddy | teddy | teddy / stand |
| heart-first | goat | goat / tinHeart |
| egg-first | goat | goat / easterEgg |
| watch-one | remote | remote / vcrPlaying |
| desk-bbs | remote | remote / phone |
| desk-copycheck | remote | remote / guide |
| desk-clock | remote | remote / clock |
| desk-wastebasket | remote | remote / trash |
| desk-door | goat | goat / door |
| desk-window | remote | remote / window |
| desk-chicken | teddy | city / chicken |
| desk-mail | teddy | street / mailbox |
| desk-zine | remote | remote / mags |
| desk-light | remote | remote / lamp |
| watch-all | remote | remote / vcr |
| offline-copy | remote | remote / vcrOff |
| mag-features | remote | remote / magsSpread |
| desk-backup | remote | remote / drawerOpen |
| make-take | remote | remote / tapes |
| desk-gm | remote | remote / keyboard |
| bbs-every-speed | remote | remote / modem |
| desk-power | remote | remote / plug |
| desk-gamepad | remote | remote / gamepad |
| desk-mousepad | remote | remote / mousepad |
| record-video | remote | remote / camcorder |
| desk-bbs-file | remote | remote / diskDrive |
| mag-disc | remote | remote / discSleeve |
| play-save | remote | remote / saveTape |
| blaster-big-name | carl | carl / speaker |
| desk-curtains | sleuth | sleuthParlor / curtain0 |
| cast-parade | sleuth | sleuthParlor / footlights |
| desk-time-reset | carl | carl / alarm |
| bbs-time-travel | reckoning | reckoning / clock0 |
| library-kinds | reckoning | reckoning / books |
| desk-moon | needle | needle / moon |
| make-save | sandcast | sandcast / floppy |
| sofa-chat | sandcast | sandcast / terminal |
| trophy-top | sandcast | sandcast / crown |
| export-web | brief | brief / library/globe |
| finish-sandbox | brief | brief / yard/medal |
| export-dos | sweats | sweatsWork / monitor |
| check-fix | sweats | sweatsOutside / wrench |
| finish-bizarre | sweats | sweatsHive / openMic |
| make-walk | year2000 | y2kMoon / robotproj |
| link-in | year2000 | y2kSuburb / mailbox |
| desk-egg | year2000 | y2kSuburb / egg |
| play-finish | snowbound | snowbound / finish |
| egg-all | teddy2 | teddy2House / basket |
| make-every-kind | tickle | tickle / toolbox |
| check-upload | tickle | tickle / clipboardOk |
| sfx-maker | tickle | tickle / mixer |
| desk-uv | tickle | tickle / uvBulb |
| desk-blacklight | tickle | tickle / blacklight |
| egg-teddy | tickle | tickle / eggTeddy |
| bbs-cant-wait | tickle | tickle / rocketCord |
| desk-egg-pages | tickle | tickle / cardFile |
| desk-egg-uv | tickle | tickle / uvEgg |
| desk-degauss | tickle | tickle / crtRings |
| desk-soundcard | tickle | tickle / soundCard |
| desk-hexedit | tickle | tickle / hexPad |
| desk-savehack | tickle | tickle / screwdriverDisk |
| desk-gmcrack | tickle | tickle / pirateDos |
| finish-web | tickle | tickle / surfer |
| tty-call | tickle | tickle / fax |
| tty-sk | tickle | tickle / helloTerm |
| bbs-door | sleuth | sleuthParlor / rotaryDial |
| bbs-door-win | sleuth | sleuthParlor / numberCard |
| cast-visit | sleuth | sleuthParlor / maskPair |
| brief-chapters | sleuth | sleuthParlor / ribbonBook |
| help-all | sleuth | sleuthParlor / leaflet |
| desk-register | sleuth | sleuthParlor / regForm |
| desk-achieve | sleuth | sleuthParlor / badgeClip |
| make-new | sleuth | sleuthParlor / blankSheet |
| watch-seek | sleuth | sleuthParlor / filmJump |
| make-opening | sleuth | sleuthParlor / clapper |
| check-run | sleuth | sleuthParlor / loupeGrid |
| desk-glance | sleuth | sleuthParlor / peekCurtain |
| tty-wallphone | sleuth | sleuthParlor / deskPhone |
| sofa-busy | sleuth | sleuthParlor / busyLine |
| make-heat | sleuth | sleuthParlor / heatMap |
| desk-speaker | sleuth | sleuthParlor / deskSpeaker |
| trophy-first | sleuth | sleuthParlor / meritMedal |
| heart-all | sleuth | sleuthParlor / heartWreath |
| export-all | carl | carlYard / parcelWings |
| desk-mailjeep | carl | carlYard / mailJeep |
| desk-mailtruck | carl | carlYard / mailTruck |
| finish-desk | carl | carl / packPad |
| finish-dos | carl | carl / dosDisk |
| finish-phone-wide | carl | carl / phoneWide |
| finish-phone-tall | carl | carl / phoneTall |
| saves-panel | reckoning | reckoning / trophyGold |
| bbs-door-three | reckoning | reckoning / trophySilver |
| mag-back | reckoning | reckoning / magRoll |
| desk-lume | reckoning | reckoning / lumeDial |
| print-level-maps | needle | needleTailor / compass |
| print-world-map | needle | needleTailor / foldMap |
| print-world-styles | needle | needleTailor / rulerTriangle |
| palette-vision | needle | needleTailor / seenGlasses |
| watch-bot | needle | needleTailor / robotCrank |
| hint-phone-bill | needle | needleTailor / phoneBill |
| desk-aurora | loaf | loaf / aurora |
| bbs-got-time | loaf | loaf / snail |
| download-mp4 | loaf | loaf / filmStrip |
| desk-star | goat | goat / shootingStar |
| desk-goat | goat | goat / surprisedGoat |
| desk-plow | snowbound | snowSprites / plowFront0 |
| desk-sleds | snowbound | snowSprites / sledder0 |
| bbs-download-every-speed | sweats | sweatsHomeSprites / turtle0 |
| desk-dogs | teddy | gwinnSprites / gwinnRun1 |
| zine-read | teddy | teddyToys / book |
| play-bizarre | smirked | smirked / violin |
| library-visit | risi | risiCampus / libraryFront |
| every-life-1 | teddy | tiers / every-life-1 |
| every-life-3 | teddy | tiers / every-life-3 |
| every-life-10 | teddy | tiers / every-life-10 |
| every-loss-1 | teddy | tiers / every-loss-1 |
| every-loss-3 | teddy | tiers / every-loss-3 |
| every-loss-10 | teddy | tiers / every-loss-10 |
| every-win-1 | teddy | tiers / every-win-1 |
| every-win-3 | teddy | tiers / every-win-3 |
| every-win-10 | teddy | tiers / every-win-10 |

## Art still needed

These entries use a neutral question block until suitable, distinct art is selected.
Proposals are drawing briefs, not promises of another game. Each should remain readable
at 20×20 pixels; the friendly giant ideas could share a character while varying the action.
Hidden achievements keep their question block until unlocked, even when art is available.

| Achievement | Title | Proposed art |
| --- | --- | --- |
| export-linux | Penguin power | 20×20 block: a cheerful penguin with a disk tucked under one wing, with a dark outline and one clear focal shape. |
| desk-chez | Honk honk | 20×20 block: THE CHEZ seen from the front, with Teddy in the passenger seat, with a dark outline and one clear focal shape. |
