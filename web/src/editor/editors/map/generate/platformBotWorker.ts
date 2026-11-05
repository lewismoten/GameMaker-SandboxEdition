// The side-view bot's Web Worker: plays one generated layout (platformBot.ts) off the main thread, so the
// Generate dialog stays responsive while its chips change. Gets the four files the bot reads and the job; posts the run.
import { botPlays, type BotJob, type BotRun } from './platformBot';

export interface PlatformBotRequest extends Omit<BotJob, 'files'> {
  /** The block set, monster blocks, character and its blocks, by lower-case name. */
  files: [string, Uint8Array][];
}

export type PlatformBotMessage = { kind: 'done'; run: BotRun } | { kind: 'error'; message: string };

const post = (m: PlatformBotMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<PlatformBotRequest>) => {
  try {
    const { files, ...job } = e.data;
    const byName = new Map(files);
    post({ kind: 'done', run: await botPlays({ ...job, files: { get: (name) => byName.get(name.toLowerCase()) } }) });
  } catch (err) {
    post({ kind: 'error', message: (err as Error).message });
  }
};
