# `desk/props/outside/`: events outside the desk window

Part of the [source map](../../../README.md).

Schedules short animated scenes outside the window, with accessible hit targets and visibility, motion and gameplay checks.

## Main modules

- [`index.ts`](index.ts): Schedules random events, queues requested mail events and signals when requested events end.
- [`outside.ts`](outside.ts): Runs an event over the window, manages its hit target and shares street and movement helpers.
- [`visible.ts`](visible.ts): Checks whether the window is visible and unobstructed.
- [`aurora.ts`](aurora.ts): Draws moving northern lights at night.
- [`star.ts`](star.ts): Draws a shooting star in the night sky.
- [`chez.ts`](chez.ts): Animates THE CHEZ passing the window with motor sound and a horn action.
- [`chicken.ts`](chicken.ts): Animates the rubber chicken flying past.
- [`dogs.ts`](dogs.ts): Animates Gwinn and Teddy running along the street.
- [`goat.ts`](goat.ts): Animates a goat stopping, screaming and fainting.
- [`plow.ts`](plow.ts): Draws a passing snow plow and its snow spray.
- [`sleds.ts`](sleds.ts): Draws children walking past with sleds.
- [`mailtruck.ts`](mailtruck.ts): Draws the outgoing registration mail truck when requested.
- [`mailjeep.ts`](mailjeep.ts): Draws the arriving reply vehicle when requested.

## Loading

[`props/index.ts`](../index.ts) imports this registry statically, and the registry imports all event modules statically. They load with the desk path rather than as separate event chunks.

## Tests

[`visible.test.ts`](visible.test.ts) checks window visibility and overlays. Event animation, drawing and sound need inspection on the desk.

Related areas: [props](../README.md), [room](../../room/README.md), [motor audio](../../../audio/chez/README.md).
