// A download link for a file the page makes rather than fetches (a trinket's STL or 3MF from its pack, the phone
// kit's printer-parts ZIP): the first click makes it, then saves it from memory under its own name; later clicks save
// the same copy. Used by trinketData.ts and manual/printables/feelieItems.ts.

/** `link` set up to save `make()`'s bytes as `name`. */
export function madeDownload(link: HTMLAnchorElement, name: string, make: () => Promise<Uint8Array>): HTMLAnchorElement {
  link.download = name;
  link.href = '#';
  let made: Promise<string> | undefined;
  link.addEventListener('click', (e) => {
    if (link.href.startsWith('blob:')) return;
    e.preventDefault();
    made ??= make().then((bytes) => URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/octet-stream' })));
    link.setAttribute('aria-busy', 'true');
    void made
      .then((url) => {
        link.href = url;
        link.click();
      })
      .catch(() => (made = undefined))
      .finally(() => link.removeAttribute('aria-busy'));
  });
  return link;
}
