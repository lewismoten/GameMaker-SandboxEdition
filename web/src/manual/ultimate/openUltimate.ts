// Opens The Ultimate Owner's Guide from outside the desk (the web guide's page about it, a
// level check finding): the Game-Maker box's viewer, turned to the guide in its tray, and to a
// chapter when one is named (an id in plan.ts CHAPTERS, such as 'levels'). With the box already
// open (only `?chapter=` changed in the address), the open guide turns to the chapter instead.
export async function openUltimateGuide(chapter?: string): Promise<void> {
  const [{ openDosManual }, { showInBox }, { openAtChapter }] = await Promise.all([
    import('../dosManual'),
    import('../../desk/boxes/boxList'),
    import('./ultimateItem'),
  ]);
  openAtChapter(chapter);
  const inTray = document.querySelector<HTMLButtonElement>('.gmb-tray-list li[data-id="ultimate"] button');
  if (inTray) inTray.click();
  else showInBox(() => void openDosManual(), 'ultimate');
}
