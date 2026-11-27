// Decode the inventory choice recorded after the drop key.
export function decodePicker(keys: { key: number }[], start: number) {
  let col = 0;
  let row = 0;
  let closed = false;
  let slot = -1;
  const consumed: number[] = [];
  const held = new Set<number>();
  for (let i = start + 1; i < keys.length; i++) {
    const { key } = keys[i];
    if (key >= 128) {
      if (held.delete(key - 128)) consumed.push(i);
    } else if (closed) {
      // A fresh gameplay press owns its eventual release.
      held.delete(key);
    } else {
      switch (key) {
        case 75:
          col = Math.max(0, col - 1);
          break;
        case 77:
          col = Math.min(4, col + 1);
          break;
        case 72:
          row = 0;
          break;
        case 80:
          row = 1;
          break;
        case 28:
          slot = row * 5 + col;
          closed = true;
          break;
        case 1:
          closed = true;
          break;
        default:
          continue;
      }
      consumed.push(i);
      held.add(key);
    }
    if (closed && held.size === 0) break;
  }
  return { slot, consumed: closed ? consumed : [] };
}
