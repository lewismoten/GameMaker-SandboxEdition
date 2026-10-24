// Opens The Ultimate Owner's Guide from outside the desk (the web guide's page about it, a
// level check finding): the Game-Maker box's viewer, turned to the guide in its tray, and to a
// chapter when one is named (an id in plan.ts CHAPTERS, such as 'levels').
export async function openUltimateGuide(chapter?: string): Promise<void> {
  const [{ openDosManual }, { showInBox }, { openAtChapter }] = await Promise.all([
    import('../dosManual'),
    import('../../desk/boxes/boxList'),
    import('./ultimateItem'),
  ]);
  openAtChapter(chapter);
  showInBox(() => void openDosManual(), 'ultimate');
}
