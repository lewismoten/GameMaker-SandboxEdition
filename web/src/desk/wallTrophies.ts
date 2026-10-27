// What hangs on the desk's wall once it is earned: the felt eggs found in the Sandbox games, the
// tin heart hunt's trophy and the score trophies. Each loads on its own and shows nothing at all
// until there is something to show; the call returns what takes them down again.
export function wallTrophies(desk: HTMLElement): () => void {
  // the felt eggs found in the Sandbox games (nothing at all until the first one)
  let unEggs: (() => void) | undefined;
  void import('../eggs/eggDisplay').then(({ eggDisplay }) => {
    if (!desk.isConnected) return;
    unEggs = eggDisplay((el) => {
      // on the wall, after the poster and clipping when you Tab along it
      const clip = desk.querySelector('.news-clipping');
      if (clip) clip.after(el);
      else desk.querySelector('.desk-scene')?.append(el);
    });
  });
  // the tin heart hunt's trophy, once every heart is found (nothing at all until then)
  let unTrophy: (() => void) | undefined;
  void import('../tinHearts/trophySpot').then(({ heartTrophy }) => {
    if (!desk.isConnected) return;
    unTrophy = heartTrophy((el) => {
      const clip = desk.querySelector('.news-clipping');
      if (clip) clip.after(el);
      else desk.querySelector('.desk-scene')?.append(el);
    });
  });
  // the score trophies, once a game ends with points (nothing at all until then)
  let unScores: (() => void) | undefined;
  void import('../scoreTrophies/trophySpot').then(({ scoreTrophies }) => {
    if (!desk.isConnected) return;
    unScores = scoreTrophies((el) => {
      // after the shelf's eggs and tin heart trophy when you Tab along the wall
      const after = desk.querySelector('.heart-trophy') ?? desk.querySelector('.news-clipping');
      if (after) after.after(el);
      else desk.querySelector('.desk-scene')?.append(el);
    });
  });
  return () => {
    unEggs?.();
    unTrophy?.();
    unScores?.();
  };
}
