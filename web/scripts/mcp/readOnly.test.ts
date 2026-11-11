// MCP restrictions are checked in process; no bridge socket or editor is opened.
import { expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { callTool } from './server';
import { createGame } from './session';
import { Roots } from './roots';
import type { ServerState } from './serverTools';

it('rejects an unsupported read-only editor target before forwarding or selecting it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gm-readonly-'));
  try {
    const call = vi.fn();
    const state: ServerState = { roots: new Roots([dir]), bridge: { paired: true, call } as unknown as ServerState['bridge'] };
    const result = await callTool(state, 'open_game', { source: 'editor', read_only: true });
    expect(result.isError).toBe(true);
    expect(call).not.toHaveBeenCalled();
    expect(state.target).toBeUndefined();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('refuses walkthrough recording and direct artifact writes for a read-only game', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gm-readonly-'));
  try {
    const roots = new Roots([dir]);
    const game = createGame(roots, 'Tiny');
    game.ctx.readOnly = true;
    const result = await callTool({ roots, game }, 'record_walkthrough', {});
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain('read-only');
    await expect(game.ctx.saveArtifact!('walk.json', new Uint8Array([1]))).rejects.toThrow(/read-only/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
