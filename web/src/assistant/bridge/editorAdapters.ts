// Running tools in the editor's tab, for the bridge and WebMCP alike: the shared game tools on
// the open project (editorContext.ts), and the tab's own (editorTools.ts): what is open,
// opening a file, a screenshot of the editor area and a watched play test.
import { normalize } from '../../project/files';
import { currentRoute } from '../../urlState';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import { base64 } from '../png';
import { fail, json, text, type ToolResult } from '../tools/types';
import { EDITOR_TOOL_SPECS } from './editorTools';
import type { EditorState } from './protocol';
import type { AssistantHost } from '../hostSlot';
import type { EditorContext } from './editorContext';
import type { Session } from '../../engine/scene';

/** What the tab shows now. */
export function editorState(host: AssistantHost | undefined, readOnly: boolean): EditorState {
  if (!host) return { readOnly: true };
  const p = host.project;
  const { play: _play, ...selection } = currentRoute().params;
  return {
    project: { id: p.id, name: p.name, gam: p.gam },
    ...(host.currentFile ? { file: host.currentFile } : {}),
    ...(Object.keys(selection).length ? { selection } : {}),
    playing: host.playing,
    readOnly: readOnly || !!p.readOnly,
  };
}

/** The largest canvas showing in the editor area, as a PNG. */
async function screenshot(host: AssistantHost): Promise<ToolResult> {
  const canvases = [...host.editorArea.querySelectorAll('canvas')].filter((c) => c.width > 0 && c.height > 0 && c.getClientRects().length);
  const c = canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!c) return fail('The open editor shows no picture to capture; render_png draws any part of the game instead.');
  const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'));
  if (!blob) return fail('The picture could not be captured.');
  const data = base64(new Uint8Array(await blob.arrayBuffer()));
  const what = c.getAttribute('aria-label') || host.currentFile || 'the play test';
  return { content: [{ type: 'image', data, mimeType: 'image/png' }, text(`${what} (${c.width} x ${c.height} pixels)`).content[0]] };
}

/** Starts a play test and watches it for a while. */
async function playAndWatch(host: AssistantHost, args: Record<string, unknown>): Promise<ToolResult> {
  const seconds = typeof args.watch_seconds === 'number' ? args.watch_seconds : 20;
  const seen = { started: false, scenes: [] as number[], score: 0, lives: -1, hitPoints: -1, ended: undefined as undefined | string };
  let session: Session | undefined;
  let finish = () => undefined as void;
  const ended = new Promise<void>((resolve) => (finish = resolve));
  const ok = host.playTest(typeof args.scene === 'number' ? args.scene : undefined, {
    onSession: (s) => {
      session = s;
      seen.started = true;
      const was = s.onScene;
      s.onScene = (n) => (seen.scenes.push(n), was?.(n));
    },
    onPlayEnd: (score, how) => ((seen.score = score), (seen.ended = how), finish()),
  });
  if (!ok) return fail(`Scene ${String(args.scene)} has no way in to start from.`);
  await Promise.race([ended, new Promise((r) => setTimeout(r, seconds * 1000))]);
  if (session) Object.assign(seen, { score: session.ci.score, lives: session.ci.lives, hitPoints: session.ci.hitpts });
  const game = host.project.game();
  const name = (n: number) => game.scenes[n]?.desc.trim() || `scene ${n}`;
  return json({
    started: seen.started,
    ...(seen.started ? {} : { note: 'The play test is waiting for the person to press Play in the tab.' }),
    scenes_reached: seen.scenes.map((n) => ({ scene: n, name: name(n) })),
    ...(seen.started ? { score: seen.score, lives: seen.lives, hit_points: seen.hitPoints } : {}),
    ...(seen.ended ? { ended: seen.ended } : { still_playing: host.playing }),
    watched_seconds: seconds,
  });
}

/** Runs any tool the tab offers. */
export async function runInTab(
  name: string,
  args: Record<string, unknown>,
  ctx: EditorContext,
  host: AssistantHost | undefined,
  readOnly: boolean,
): Promise<ToolResult> {
  const def = GAME_TOOL_DEFS.find((d) => d.name === name);
  if (def) return host ? runTool(def, args, ctx) : fail('No game is open in the editor tab: open one there first.');
  if (!EDITOR_TOOL_SPECS.some((t) => t.name === name)) return fail(`The editor has no tool ${name}.`);
  if (name === 'editor_state') return json(editorState(host, readOnly));
  if (!host) return fail('No game is open in the editor tab.');
  switch (name) {
    case 'editor_open_file': {
      const f = normalize(typeof args.file === 'string' ? args.file : '');
      if (!host.project.files.has(f)) return fail(`The project has no file ${f}.`);
      host.open(f);
      return text(`Opened ${f}.`);
    }
    case 'editor_screenshot':
      return screenshot(host);
    case 'editor_play':
      return playAndWatch(host, args);
    case 'editor_stop_play':
      if (!host.playing) return text('No play test is running.');
      host.stopPlay();
      return text('Stopped the play test.');
    case 'editor_undo': {
      const last = ctx.lastChange;
      return readOnly
        ? fail('The Assistant is read-only.')
        : ctx.undo()
          ? text(`Took back: ${last}.`)
          : text('There is no change of the assistant’s to take back.');
    }
  }
  return fail(`The editor has no tool ${name}.`);
}
