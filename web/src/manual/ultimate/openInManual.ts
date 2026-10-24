// Opens The Ultimate Owner's Guide where there is no desk (dos.html): the Game-Maker box's
// viewer, which openDosManual shows with the guide in its tray, turned to the guide, and to a
// chapter when one is named (an id in plan.ts CHAPTERS). openUltimate.ts does the same from the
// desk's box list, which this page must not load (dosPage/boundary.test.ts).
export async function openUltimateInManual(chapter?: string): Promise<void> {
  const [{ openDosManual }, { openAtChapter }] = await Promise.all([import('../dosManual'), import('./ultimateItem')]);
  openAtChapter(chapter);
  void openDosManual();
  // the viewer builds its tray as it opens: turn to the guide as soon as it is there
  for (let i = 0; i < 300; i++) {
    const inTray = document.querySelector<HTMLButtonElement>('.gmb-tray-list li[data-id="ultimate"] button');
    if (inTray) return inTray.click();
    await new Promise((r) => requestAnimationFrame(r));
  }
}
