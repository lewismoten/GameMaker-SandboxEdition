// The tools only the editor open in a tab has: what is open, opening a file, a screenshot, and
// play testing. Their names and schemas only, with no DOM, so the MCP server can list them;
// the tab runs them (editorAdapters.ts).
import type { ToolDef } from '../tools/types';

type EditorToolSpec = Omit<ToolDef, 'run'>;

export const EDITOR_TOOL_SPECS: EditorToolSpec[] = [
  {
    name: 'editor_state',
    description: 'What the editor tab shows: the project, the open file, its selection (the editor’s settings), whether a play test runs, read-only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'editor_open_file',
    description: 'Opens one of the project’s files in its editor, in the tab.',
    inputSchema: { type: 'object', properties: { file: { type: 'string', description: 'A file name, e.g. level1.map.' } }, required: ['file'] },
  },
  {
    name: 'editor_screenshot',
    description: 'A picture of the editor area: its largest canvas (the map, the picture, the game while playing).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'editor_play',
    description:
      'Starts a play test in the tab (from the title, or at a level’s first way in) and reports what happens for watch_seconds: scenes reached, score, lives, won or lost. The person presses Play to start it.',
    inputSchema: {
      type: 'object',
      properties: {
        scene: { type: 'integer', minimum: 2, description: 'Start in this level (leave out: from the title).' },
        watch_seconds: { type: 'integer', minimum: 0, maximum: 120, description: 'How long to watch before answering (default 20).' },
      },
    },
  },
  {
    name: 'editor_stop_play',
    description: 'Stops the play test and goes back to the file that was open.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'editor_undo',
    description: 'Takes back the assistant’s last change in the tab (as its toast’s Undo does).',
    inputSchema: { type: 'object', properties: {} },
  },
];
