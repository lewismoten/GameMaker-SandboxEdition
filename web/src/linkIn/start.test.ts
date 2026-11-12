// Linked downloads use mocked dialogs and fetchers: no DOM or network is needed.
import { afterEach, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { runLinkIn } from './start';
import { askToFetch, askToOpen, waitingDialog } from './dialogs';
import { fetchGame } from './fetchGame';

vi.mock('./dialogs', () => ({
  askToFetch: vi.fn(),
  askToOpen: vi.fn(async () => false),
  waitingDialog: vi.fn(() => ({ say: vi.fn(), close: vi.fn() })),
  showLinkError: vi.fn(),
}));
vi.mock('./fetchGame', () => ({ fetchGame: vi.fn(async () => []), urlFileName: () => 'game.zip' }));
vi.mock('./unpack', () => ({ unpackGame: vi.fn(async () => ({ files: new GameFiles([['game.gam', new Uint8Array([1])]]), gam: 'game.gam', title: 'Game' })) }));
vi.mock('../project/files', async (original) => ({ ...(await original<typeof import('../project/files')>()), loadCatalog: async () => [] }));
afterEach(() => vi.clearAllMocks());

it('does not fetch a linked game when download consent is declined', async () => {
  vi.mocked(askToFetch).mockResolvedValueOnce(false);
  expect(await runLinkIn({ kind: 'open', url: 'https://example.invalid/game.zip', mode: 'play' }, 'web')).toBeUndefined();
  expect(fetchGame).not.toHaveBeenCalled();
  expect(waitingDialog).not.toHaveBeenCalled();
});

it('waits for download consent before fetching and then asks about the inspected game', async () => {
  let accept!: (value: boolean) => void;
  vi.mocked(askToFetch).mockReturnValueOnce(
    new Promise((resolve) => {
      accept = resolve;
    }),
  );
  const pending = runLinkIn({ kind: 'open', url: 'https://example.invalid/game.zip', mode: 'play' }, 'web');
  expect(fetchGame).not.toHaveBeenCalled();
  accept(true);
  await pending;
  expect(fetchGame).toHaveBeenCalledOnce();
  expect(askToOpen).toHaveBeenCalledOnce();
});
