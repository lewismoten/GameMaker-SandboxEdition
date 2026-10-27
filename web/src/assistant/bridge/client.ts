// The editor tab's side of the bridge (protocol.ts): connects to the MCP server on this computer
// with the pairing code the person typed, then runs each tool the server sends (editorAdapters.ts)
// and answers. It tells the server what is open whenever that changes, and lets go when the tab
// closes or the person presses Disconnect.
import { BRIDGE_VERSION, readToEditor, type ToServer } from './protocol';
import { editorState, runInTab } from './editorAdapters';
import { fail } from '../tools/types';
import type { EditorContext } from './editorContext';
import type { AssistantHost } from '../hostSlot';

export type BridgeStatus = 'idle' | 'connecting' | 'connected' | 'closed';

export class BridgeClient {
  status: BridgeStatus = 'idle';
  /** Why it isn't connected (a refusal, a closed server). */
  reason = '';
  /** Told on every change of status. */
  onStatus?: () => void;
  /** Told of each tool the server runs here. */
  onCall?: (tool: string, ok: boolean) => void;
  private ws?: WebSocket;
  private readonly bye = () => this.disconnect();

  constructor(
    private readonly ctx: EditorContext,
    private readonly host: () => AssistantHost | undefined,
    private readonly readOnly: () => boolean,
  ) {}

  connect(url: string, code: string): void {
    this.disconnect();
    this.set('connecting', '');
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => this.send({ type: 'hello', version: BRIDGE_VERSION, code, page: location.origin });
    ws.onmessage = (e) => void this.receive(String(e.data));
    ws.onerror = () =>
      this.ws === ws && this.set('closed', this.status === 'connecting' ? 'No MCP server answered at that address.' : 'The connection failed.');
    ws.onclose = (e) => {
      if (this.ws !== ws) return;
      this.ws = undefined;
      window.removeEventListener('pagehide', this.bye);
      this.set('closed', this.reason || (e.reason ? `The server closed the connection: ${e.reason}.` : 'Disconnected.'));
    };
    // closing the tab or leaving the page ends the pairing
    window.addEventListener('pagehide', this.bye);
  }

  disconnect(): void {
    const ws = this.ws;
    if (!ws) return;
    this.ws = undefined;
    window.removeEventListener('pagehide', this.bye);
    ws.close(1000, 'Disconnected in the editor');
    this.set('idle', 'Disconnected.');
  }

  /** Tells the server what is open now. */
  sendState(): void {
    if (this.status === 'connected') this.send({ type: 'state', state: editorState(this.host(), this.readOnly()) });
  }

  private async receive(raw: string): Promise<void> {
    const m = readToEditor(raw);
    if (!m) return;
    if (m.type === 'denied') {
      this.reason = m.reason;
      this.ws?.close();
      return;
    }
    if (m.type === 'welcome') {
      this.set('connected', '');
      this.sendState();
      return;
    }
    let result;
    try {
      result = await runInTab(m.tool, m.args, this.ctx, this.host(), this.readOnly());
    } catch (e) {
      result = fail(`${m.tool} failed in the editor: ${e instanceof Error ? e.message : String(e)}`);
    }
    this.send({ type: 'result', id: m.id, result });
    this.onCall?.(m.tool, !result.isError);
    this.sendState();
  }

  private send(m: ToServer): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  private set(status: BridgeStatus, reason: string): void {
    this.status = status;
    this.reason = reason;
    this.onStatus?.();
  }
}
