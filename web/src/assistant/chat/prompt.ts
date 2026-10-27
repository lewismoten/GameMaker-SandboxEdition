// What the model is told: a compact brief on Game-Maker, the open game and how to use the
// tools (small local models have short context, so every line earns its place), the brief for
// building a new game from a description, and the one for turning check results into a to-do list.

/** The game in a few lines, from game_summary's JSON. */
export function gameBrief(summary: string): string {
  try {
    const s = JSON.parse(summary) as {
      title?: string;
      gam?: string;
      scenes?: { scene: number; kind: string; name: string; map?: string | null; links: number }[];
      by_kind?: Record<string, number>;
    };
    const scenes = (s.scenes ?? []).map((x) => `${x.scene} ${x.kind} "${x.name}"${x.map ? ` map ${x.map}` : ''} (${x.links} links)`).join('; ');
    const kinds = Object.entries(s.by_kind ?? {})
      .map(([k, n]) => `${n} ${k}`)
      .join(', ');
    return `Open game: "${s.title ?? ''}" (${s.gam ?? ''}). Scenes: ${scenes || 'none'}. Files: ${kinds || 'none'}.`;
  } catch {
    return 'Open game: call game_summary to see it.';
  }
}

export function systemPrompt(opts: { summary: string; readOnly: boolean; images: boolean }): string {
  return [
    'You help someone make a game in Game-Maker, a 1990s DOS game construction kit (here in a web editor that saves real DOS files).',
    'A game is a .gam file of scenes: 0 is the title, 1 is "game won", 2+ are levels. A level has a 100x100 map of 20x20-pixel background blocks (.bbl, 0-149) with set properties (solid, gravity, points, hurts, pickup), a palette, monsters (.mon, placed on the map), a hero (.chr) and sounds. Links send the hero from a map cell to another scene; scene 0 link 0 is where play starts; a link to scene 1 wins.',
    gameBrief(opts.summary),
    'How to work:',
    '- Look before changing: game_summary, get_scene, get_map (a small region), list_blocks.',
    '- Make small, flat tool calls: one region, one block or one link at a time.',
    '- After changes, run bot_playtest and level_check, and fix what they find.',
    opts.readOnly ? '- The game is read-only now: you can look and advise, but not change it.' : '- Each change can be undone by the person.',
    opts.images ? '- render_png and editor_screenshot show you pictures.' : '- You can’t see pictures; use get_map and list_blocks instead of render_png.',
    'Keep replies short and plain. Say what you changed and what to try next.',
    'Content: family-friendly. Friendly characters; clowns are always friendly, never scary. No real addresses, brands or personal details.',
  ].join('\n');
}

/** The first message when a game is made from a description. */
export function buildBrief(description: string): string {
  return [
    `Make this game: ${description.trim()}`,
    'It starts from a playable starter: scene 2 "Level 1" uses map, blocks, monsters, hero and sounds already in the game, inside a walled area (columns 35-64, rows 40-59); the hero starts at 50,50.',
    'Build it step by step, small and playable first:',
    '1. set_scene scene 0 with the game’s title as its name; set_scene scene 2 with a level name.',
    '2. Shape the level with set_map (walls, open ground, a few pickups) using the level’s own blocks (list_blocks first).',
    '3. Place one or two monsters with set_map monsters, away from the start.',
    '4. Add an exit: set_links on scene 2 with to_scene 1 at a reachable cell, so the level can be won.',
    '5. Run bot_playtest and level_check; fix anything that stops the bot winning.',
    'Then tell the person in a few lines what you made and suggest two or three next steps.',
  ].join('\n');
}

/** Turning the checks' results into a to-do list. */
export function coachBrief(results: string): string {
  return [
    'Here are the results of the Level check, a bot play-test and a quick validate of the open game:',
    results,
    'Turn them into a short to-do list of fixes and additions for the person, most important first, at most 8 items.',
    'One plain sentence each, saying what to do and where (scene, file or cell). Merge repeats. Answer with only the list, one item a line, each starting with "- ".',
  ].join('\n');
}

/** The items of a "- " list in a reply (or numbered lines). */
export function listItems(reply: string): string[] {
  return reply
    .split('\n')
    .map((l) => /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/.exec(l)?.[1]?.trim())
    .filter((l): l is string => !!l)
    .map((l) => l.replace(/^\[[ x]\]\s*/i, '').replace(/\*\*/g, ''))
    .slice(0, 12);
}
