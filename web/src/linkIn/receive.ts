// The postMessage half of opening a game from another site (docs/embed.md):
//   1. the other site opens this page (window.open, or an iframe) at ?receive&in=…&mode=…
//   2. this page posts {type: 'gm-ready'} to the window that opened it (or its iframe parent)
//   3. that window replies {type: 'gm-files', name, files: {path: ArrayBuffer}, in, mode}
//   4. this page answers {type: 'gm-received'} once the visitor has said yes and the game is
//      kept, or {type: 'gm-error', reason, message}
// Only messages from that one window count (event.source), and, with &from=<origin>, only from
// that origin. Replies go to the sender's own origin, never to '*'.
import { ERROR, FILES, LinkError, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, READY, RECEIVED, WAIT_MS, readFilesMessage, type ReceivedGame } from './protocol';

export interface Sender {
  source: Window;
  /** The sender's origin as the browser reports it ('null' for a local file or sandboxed frame). */
  origin: string;
}

/** The window that may send a game: the one that opened this page, else the page this one is framed in. */
function peerWindow(): Window | undefined {
  if (window.opener && window.opener !== window) return window.opener as Window;
  if (window.parent && window.parent !== window) return window.parent;
  return undefined;
}

/** Posts a reply to the sender, at its own origin (a page with no origin can only be reached with '*'). */
export function reply(sender: Sender, message: { type: typeof RECEIVED | typeof ERROR; [k: string]: unknown }): void {
  try {
    sender.source.postMessage(message, sender.origin === 'null' ? '*' : sender.origin);
  } catch {
    /* the sender has gone */
  }
}

export function replyError(sender: Sender | undefined, e: unknown): void {
  if (!sender) return;
  const err = e instanceof LinkError ? e : new LinkError('Something went wrong opening the game.', 'invalid');
  reply(sender, { type: ERROR, reason: err.reason, message: err.message });
}

/**
 * Says this page is ready and waits for the game. Messages from any other window, from
 * another origin than `from`, or of another type are ignored; a gm-files message that fails
 * its checks is answered with gm-error and ends the wait.
 */
export function receiveFiles(opts: { from?: string; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<{ game: ReceivedGame; sender: Sender }> {
  const peer = peerWindow();
  if (!peer) {
    return Promise.reject(
      new LinkError(
        'This address receives a game from the page that opens it, but no page opened this one. Use a link with ?open=<address of the game> instead.',
        'invalid',
      ),
    );
  }
  return new Promise((resolve, reject) => {
    const done = () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== peer) return;
      if (opts.from && e.origin !== opts.from) return;
      if (!e.data || typeof e.data !== 'object' || (e.data as { type?: unknown }).type !== FILES) return;
      done();
      const sender: Sender = { source: peer, origin: e.origin };
      try {
        resolve({ game: readFilesMessage(e.data), sender });
      } catch (err) {
        replyError(sender, err);
        reject(err instanceof LinkError ? err : new LinkError('The game that was sent could not be read.', 'invalid'));
      }
    };
    const timer = setTimeout(() => {
      done();
      reject(new LinkError('No game arrived from the page that opened this one.', 'timeout'));
    }, opts.timeoutMs ?? WAIT_MS);
    opts.signal?.addEventListener('abort', () => {
      done();
      reject(new LinkError('Canceled.', 'declined'));
    });
    window.addEventListener('message', onMessage);
    // nothing private in it, so any origin may hear it (unless the address named one)
    peer.postMessage({ type: READY, version: 1, limits: { files: MAX_FILES, bytes: MAX_TOTAL_BYTES, fileBytes: MAX_FILE_BYTES } }, opts.from ?? '*');
  });
}
