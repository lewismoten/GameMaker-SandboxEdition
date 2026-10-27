// Tools that test the game: the quick file check (project/health.ts), the editor's Level check
// (editor/check, its findings as JSON) and the walkthrough bot (editor/check/walk), which plays
// it and can keep what it played as a walkthrough.
import { checkGame } from '../../project/health';
import { parseGame, serializeGame } from '../../formats/game';
import { MLEN } from '../../formats/map';
import { runChecks, type Report } from '../../editor/check/report';
import type { Finding } from '../../editor/check/findings';
import { autoWalk } from '../../editor/check/walk/autoWalk';
import { verifyWalk } from '../../editor/check/walk/verify';
import { startingAt } from '../../editor/editors/integrator/startAt';
import { WALKTHROUGH_FPS } from '../../walkthrough/format';
import { dosNameProblems } from '../../export/exportDos';
import { patchEntry, patchProblem } from '../../dosPlayer/patchRules';
import { SCENE, clampInt, gameOf, int } from './common';
import { json, text, ToolError, type GameContext, type ToolDef } from './types';

const where = (f: Finding) => {
  const w = f.where;
  return {
    ...(w.scene !== undefined ? { scene: w.scene } : {}),
    ...(w.map ? { map: w.map } : {}),
    ...(w.cell !== undefined ? { x: w.cell % MLEN, y: Math.floor(w.cell / MLEN) } : {}),
    ...(w.cells?.length ? { cells: w.cells.length } : {}),
    ...(w.block ? { block: `${w.block.file}#${w.block.n}` } : {}),
    ...(w.monster ? { monster: `${w.monster.file}#${w.monster.n}` } : {}),
    ...(w.sound ? { sound: `${w.sound.file}#${w.sound.n}` } : {}),
    ...(w.file ? { file: w.file } : {}),
    ...(w.link !== undefined ? { link: w.link } : {}),
  };
};

const levelCheck: ToolDef = {
  name: 'level_check',
  description: 'Runs the editor’s Level check: findings (severity, check, title, detail, where). play: true also lets the bot explore each level (slower).',
  inputSchema: {
    type: 'object',
    properties: {
      scene: { ...SCENE, description: 'Check only this scene.' },
      play: { type: 'boolean', description: 'Also play-test with the bot (default false).' },
      budget_ms: int('Bot time per scene in ms (default 4000).', 500, 60000),
      severity: { type: 'string', enum: ['error', 'warning', 'info'], description: 'Only this severity and worse.' },
      max_findings: int('Most findings to return (default 60).', 1, 500),
    },
  },
  async run(a, ctx) {
    gameOf(ctx);
    const opt = {
      scene: a.scene as number | undefined,
      play: a.play === true,
      budgetMs: clampInt(a.budget_ms, 500, 60000, 4000),
      player: ctx.playerPatches(),
    };
    const r: Report = ctx.runCheck ? await ctx.runCheck(ctx.files, opt) : await runChecks(ctx.files.copy(), opt);
    const rank = { error: 0, warning: 1, info: 2 };
    const worst = rank[(a.severity as keyof typeof rank) ?? 'info'];
    const shown = r.findings.filter((f) => rank[f.severity] <= worst);
    const max = clampInt(a.max_findings, 1, 500, 60);
    const count = (s: keyof typeof rank) => r.findings.filter((f) => f.severity === s).length;
    return json({
      errors: count('error'),
      warnings: count('warning'),
      infos: count('info'),
      ...(opt.play
        ? {
            won: r.won ?? null,
            unreached_scenes: r.unreached,
            scenes_played: r.runs.map((s) => ({
              scene: s.scene,
              name: s.name,
              places: s.places,
              exits: s.exits.length,
              deaths: s.deaths.length,
              complete: s.complete,
            })),
          }
        : {}),
      findings: shown
        .slice(0, max)
        .map((f) => ({ severity: f.severity, check: f.check, title: f.title, ...(f.detail ? { detail: f.detail } : {}), where: where(f) })),
      ...(shown.length > max ? { more: shown.length - max } : {}),
      ms: Math.round(r.ms),
    });
  },
};

async function walk(ctx: GameContext, budgetMs: number, only?: number) {
  if (ctx.runWalk) return ctx.runWalk(ctx.files, { budgetMs, only });
  const files = ctx.files.copy();
  let game = parseGame(files.get(ctx.gam)!);
  if (only !== undefined) {
    if (!game.scenes[only]) throw new ToolError(`There is no scene ${only}.`);
    game = startingAt(game, only);
    files.set(ctx.gam, serializeGame(game));
  }
  const result = await autoWalk(game, files, ctx.gam.replace(/\.gam$/, ''), { budgetMs, maxScenes: only !== undefined ? 1 : undefined });
  const verified = result.walk ? await verifyWalk(files, ctx.gam, result.walk, { maxMinutes: 30 }) : undefined;
  if (result.walk && verified) result.walk.timeline = { fps: result.walk.timeline.fps, frames: verified.frames, chapters: verified.chapters };
  return { result, verified };
}

const WALK_SCHEMA: ToolDef['inputSchema'] = {
  type: 'object',
  properties: {
    budget_ms: int('Bot time per scene in ms (default 5000).', 500, 120000),
    scene: { ...SCENE, description: 'Play only this level, the game started there.' },
  },
};

async function playReport(a: Record<string, unknown>, ctx: GameContext) {
  gameOf(ctx);
  const t0 = Date.now();
  const { result, verified } = await walk(ctx, clampInt(a.budget_ms, 500, 120000, 5000), a.scene as number | undefined);
  return {
    result,
    report: {
      won: result.won,
      ...(result.stopped ? { stopped: result.stopped } : {}),
      scenes: result.scenes.map((s) => ({
        scene: s.scene,
        name: s.name,
        got_through: !!s.strategy,
        ...(s.strategy ? { style: s.strategy } : {}),
        tried: s.tried,
        ...(s.ticks !== undefined ? { seconds: Math.round((s.ticks / 18.2) * 10) / 10 } : {}),
        ...(s.next !== undefined ? { next_scene: s.next } : {}),
      })),
      ...(verified
        ? {
            engine_check: {
              won: verified.won,
              scenes_entered: verified.scenes,
              play_seconds: Math.round(verified.frames / WALKTHROUGH_FPS),
              ...(verified.error ? { error: verified.error } : {}),
            },
          }
        : {}),
      bot_ms: Date.now() - t0,
    },
  };
}

const botPlaytest: ToolDef = {
  name: 'bot_playtest',
  description: 'The walkthrough bot plays the game from its start: whether it won, each scene’s outcome and how long the route takes.',
  inputSchema: WALK_SCHEMA,
  async run(a, ctx) {
    return json((await playReport(a, ctx)).report);
  },
};

const recordWalkthrough: ToolDef = {
  name: 'record_walkthrough',
  description: 'Like bot_playtest, and keeps the route as a walkthrough file beside the game (not among its files).',
  inputSchema: { ...WALK_SCHEMA, properties: { ...WALK_SCHEMA.properties, name: { type: 'string', description: 'File name (default walkthrough.json).' } } },
  async run(a, ctx) {
    const { result, report } = await playReport(a, ctx);
    if (!result.walk) return json({ ...report, saved: null, note: 'The bot got through no scene, so there is no walkthrough.' });
    if (!ctx.saveArtifact) return json({ ...report, saved: null, note: 'This connection can’t keep files; the route is not saved.' });
    const name = typeof a.name === 'string' && /^[\w.-]{1,64}$/.test(a.name) ? a.name : 'walkthrough.json';
    const at = await ctx.saveArtifact(name, new TextEncoder().encode(JSON.stringify(result.walk)));
    return json({ ...report, saved: at });
  },
};

const validate: ToolDef = {
  name: 'validate',
  description: 'Quick health check: missing or unreadable files, bad links, DOS file names, and DOS player patches that won’t fit.',
  inputSchema: { type: 'object', properties: {} },
  async run(_a, ctx) {
    const issues: { severity: string; kind: string; file?: string; message: string }[] = checkGame(ctx.files, ctx.gam, { deep: true });
    for (const n of dosNameProblems(ctx.files.names())) issues.push({ severity: 'warning', kind: 'dos', file: n, message: `${n} is not a DOS 8.3 name.` });
    for (const [id, v] of Object.entries(ctx.playerPatches())) {
      const e = patchEntry(id);
      const bad = e ? patchProblem(e, v) : 'unknown patch';
      if (bad) issues.push({ severity: 'warning', kind: 'player', message: `DOS player patch ${id}: ${bad}.` });
    }
    return issues.length ? json({ ok: !issues.some((i) => i.severity === 'error'), issues }) : text('No problems found.');
  },
};

export const CHECK_TOOLS: ToolDef[] = [validate, levelCheck, botPlaytest, recordWalkthrough];
