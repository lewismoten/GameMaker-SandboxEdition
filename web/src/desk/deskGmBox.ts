// The Game-Maker box picked up from the desk: turned over in the box viewer, with the Owner's
// Guide and the inserts to read and the CD to put in. The viewer and the box's insides load
// when it is first opened.
interface GmBoxActions {
  /** Reads the Owner's Guide or an insert; the box is back in hand afterwards. */
  read(): void;
  /** Puts the CD in and starts Game-Maker. */
  start(): void;
}

export async function showGmBox(boxTiles: HTMLElement, on: GmBoxActions): Promise<void> {
  const tiles = [...boxTiles.querySelectorAll<HTMLElement>('.tile')].map(
    (t) => [t.querySelector('canvas')!, t.querySelector('span')!.textContent ?? ''] as [HTMLCanvasElement, string],
  );
  const [{ openBoxViewer }, { drawGmBox, gmBoxContents }] = await Promise.all([import('./boxes/boxViewer'), import('./boxes/gmBox')]);
  await openBoxViewer({ title: 'Game-Maker SE 3.0' }, drawGmBox(tiles), {
    insert: () => on.start(),
    insertLabel: 'Put the CD in and start Game-Maker',
    manual: () => on.read(),
    extras: gmBoxContents(
      () => {
        document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
        on.read();
      },
      () => {
        document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
        on.start();
      },
    ),
  });
}
