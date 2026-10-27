// The assistant's tool set, defined once for every way an AI reaches the editor: the local MCP
// server (web/scripts/mcp), the bridge to the open editor tab (assistant/bridge), WebMCP
// (assistant/webmcp.ts) and a future in-page chat (assistant/openai.ts turns them into
// function-calling tools). A tool is a name, a short description, a flat JSON Schema for its
// arguments and a handler that works on a GameContext, with no DOM. Results are MCP's content
// blocks (text and PNG images), which the other transports pass along as they are.
import type { GameFiles } from '../../project/files';
import type { PlayerPatches } from '../../dosPlayer/patchRules';
import type { CheckOptions, Report } from '../../editor/check/report';
import type { AutoWalk } from '../../editor/check/walk/autoWalk';
import type { Verified } from '../../editor/check/walk/verify';

/** The JSON Schema subset the tools use: flat objects of plain types, so small models and every API take them. */
export interface JsonSchema {
  type: 'object' | 'string' | 'integer' | 'number' | 'boolean' | 'array';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
  maxItems?: number;
  additionalProperties?: boolean;
}

export type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: 'image/png' };

export interface ToolResult {
  content: Content[];
  isError?: boolean;
  /** [key: string]: unknown keeps it assignable to MCP's CallToolResult. */
  [key: string]: unknown;
}

/** Changes a tool makes, applied as one step (one Undo in the editor). */
export interface Change {
  /** Short words for the editor's toast and the result ("Map level1.map: 12 cells"). */
  summary: string;
  /** File bytes to write, by name; null deletes the file. */
  files?: Record<string, Uint8Array | null>;
  /** The DOS player patches to keep (the companion's dosPlayer section). */
  player?: PlayerPatches;
}

/** The game a tool works on: a folder on disk (the MCP server) or the project open in the editor. */
export interface GameContext {
  /** The game's files as they are now (read them; change them only through apply). */
  readonly files: GameFiles;
  /** The .gam file's name. */
  readonly gam: string;
  /** Writes are refused (a look-inside game, or the Assistant's read-only switch). */
  readonly readOnly: boolean;
  /** The project's DOS player patches. */
  playerPatches(): PlayerPatches;
  /** Applies a change (the editor: through its Undo, with a toast; the server: in memory until save). */
  apply(change: Change): Promise<void>;
  /** Runs the Level check (the editor runs it in its Web Worker); in-process when left out. */
  runCheck?(files: GameFiles, opt: Pick<CheckOptions, 'scene' | 'play' | 'budgetMs' | 'player'>): Promise<Report>;
  /** Runs the walkthrough bot (the editor runs it in its Web Worker); in-process when left out. */
  runWalk?(files: GameFiles, opt: { budgetMs: number; only?: number }): Promise<{ result: AutoWalk; verified?: Verified }>;
  /** Keeps a file made beside the game (a walkthrough), not among its files; returns where it went. */
  saveArtifact?(name: string, bytes: Uint8Array): Promise<string>;
}

export interface ToolDef {
  name: string;
  description: string;
  /** Always an object schema; every write tool has a dry_run flag. */
  inputSchema: JsonSchema & { type: 'object' };
  /** Changes the game (refused when read-only). */
  writes?: boolean;
  run(args: Record<string, unknown>, ctx: GameContext): Promise<ToolResult>;
}

export const text = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }] });
export const json = (v: unknown): ToolResult => text(JSON.stringify(v));
export const fail = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }], isError: true });

/** A tool's error for a bad argument or a missing file: the handler throws it, the runner returns it. */
export class ToolError extends Error {}
