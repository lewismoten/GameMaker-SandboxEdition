// Check consecutive level-one samples until the door opens on the first zero.
export function watchDoor() {
  let started = false;
  let opened = false;
  return (zero: boolean, open: boolean) => {
    if (opened) return false;
    if (zero !== open || (!started && open)) throw new Error('demoCheck: expected the shut door to open on the first zero');
    started = true;
    opened = open;
    return open;
  };
}
