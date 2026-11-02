// The tour's "The Assistant" chapter: Dex Dynamo opens the Assistant's chat panel (the ✦ button) on
// Ohm Sweet Ohm and goes through what is in it: AI setup (Ollama or an OpenAI-compatible server,
// the visitor's own), the model line, Ask before changing / Change freely, Read-only, What should I
// do next?, the context gauge, the message box and the MCP link. It opens and shuts the panel only:
// no message is sent, the AI setup dialog stays shut and nothing is asked of any provider. Checked
// against assistant/chat/panel.ts, settingsDialog.ts and editor/shell/workspace.ts (assistantButton).
import type { Chapter, Target } from '../steps';

/** The ✦ button: it shows the chat panel (and the tour shuts it again). */
const ASSISTANT_BUTTON = '.assistant-btn';

/** A control in the Assistant's chat panel, which the tour opens by its button. */
const chat = (label: string, css: string): Target => ({ label, css, reveal: ASSISTANT_BUTTON });

export const editAssistantChapter: Chapter = {
  id: 'edit-assistant',
  title: 'The Assistant',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/kitchen.map',
  ready: ASSISTANT_BUTTON,
  always: true,
  actor: 'dex',
  speaker: 'dex',
  music: 'y2kTitle',
  steps: [
    {
      id: 'edit-assistant-hello',
      action: 'enter',
      say: 'Behold, the future! An AI helper that looks at your game, tests it and changes it with you. Well, your own AI, that is.',
      sound: 'kazoo',
    },
    {
      id: 'edit-assistant-button',
      action: 'point',
      target: { label: 'the Assistant button', css: ASSISTANT_BUTTON },
      say: 'The star button opens the chat beside the editor, or over the whole screen on a phone. Press it again, or Escape, to put it away.',
    },
    {
      id: 'edit-assistant-panel',
      action: 'point',
      target: chat('the Assistant panel', '.chat-panel'),
      say: 'There is no AI built in. You bring your own, and while it works it is sent what its tools read of this game, and pictures of it.',
    },
    {
      id: 'edit-assistant-setup',
      action: 'point',
      target: chat('the AI setup button', '.chat-setup'),
      say: 'AI setup picks the provider: Ollama on this computer or another, or any OpenAI-compatible server. It needs an address and a model of your own.',
      spoken:
        'AI setup picks the provider: Oh-lama on this computer or another, or any Open A I compatible server. It needs an address and a model of your own.',
    },
    {
      id: 'edit-assistant-model',
      action: 'point',
      target: chat('the model line', '.chat-model'),
      say: 'This line names your model once it is set up. Until then it says No AI set up, and the chat can’t answer yet. The settings stay in your browser.',
    },
    {
      id: 'edit-assistant-mode',
      action: 'point',
      target: chat('the changes choice', '.chat-bar #chat-mode'),
      say: 'Ask before changing waits for you to Apply or Skip each change. Change freely does them at once, and Undo still takes them back.',
    },
    {
      id: 'edit-assistant-readonly',
      action: 'point',
      target: chat('the Read-only box', '.chat-check'),
      say: 'Read-only keeps the AI to looking. Check the box when you want advice but no changes at all.',
    },
    {
      id: 'edit-assistant-next',
      action: 'point',
      target: chat('the What should I do next button', '.chat-coach'),
      say: 'What should I do next? runs the Level check, a bot play-test and a validate, then makes a to-do list. With no AI set up, the findings become the list.',
    },
    {
      id: 'edit-assistant-gauge',
      action: 'point',
      target: chat('the context gauge', '.chat-gauge'),
      say: 'The gauge shows how full the model’s memory is. Compact now sums up older turns, and Reset starts fresh; the old talk stays in the archive.',
    },
    {
      id: 'edit-assistant-compose',
      action: 'point',
      target: chat('the message box', '.chat-compose'),
      say: 'You would type here, to ask a question or say what to change. It stays locked until your AI is set up, so I won’t send anything.',
    },
    {
      id: 'edit-assistant-mcp',
      action: 'point',
      target: chat('the link to the other way', '.chat-foot .link'),
      say: 'Already have an AI tool on your computer? This link shows how to connect it to the editor through MCP instead.',
    },
    {
      id: 'edit-assistant-bye',
      action: 'exit',
      say: 'Set up your own AI whenever you like, and the Assistant is yours. The future awaits!',
    },
  ],
};
