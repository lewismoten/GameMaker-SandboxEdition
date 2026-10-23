// Opens The Ultimate Owner's Guide from outside the desk (the web guide's page about it): the
// Game-Maker box's viewer, turned to the guide in its tray.
export async function openUltimateGuide(): Promise<void> {
  const [{ openDosManual }, { showInBox }] = await Promise.all([import('../dosManual'), import('../../desk/boxes/boxList')]);
  showInBox(() => void openDosManual(), 'ultimate');
}
