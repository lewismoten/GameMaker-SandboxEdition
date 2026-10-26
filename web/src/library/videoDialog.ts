// A Library video's player: a dialog showing the video's picture with a Play button, so nothing
// comes from YouTube until the visitor presses it. Play puts YouTube's player in its place,
// from youtube-nocookie.com; closing (the button, or Esc) removes the dialog and the player
// with it, which stops the video. Without a connection it says the video needs the internet.
import './videoDialog.css';
import { h } from '../editor/core/ui';

/** Opens the video `id` (YouTube's id) titled `title`, with its picture `picture`; settles once it is closed. */
export function openVideo(id: string, title: string, picture: string | undefined): Promise<void> {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'modal lib-video', 'aria-labelledby': 'lib-video-h' });
    const close = () => {
      dlg.close();
      dlg.remove(); // the player goes with it: the video stops
      resolve();
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    const play = () => {
      const player = h('iframe', {
        class: 'lib-video-player',
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`,
        title: `${title} (YouTube video player)`,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
        referrerpolicy: 'strict-origin-when-cross-origin',
      });
      screen.replaceChildren(player);
      note.textContent = 'Playing from YouTube (youtube-nocookie.com).';
      player.focus();
    };
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const screen = h(
      'div',
      { class: 'lib-video-screen' },
      picture ? h('img', { class: 'lib-video-poster', src: picture, alt: '' }) : null,
      h('button', { type: 'button', class: 'lib-video-play primary', autofocus: true, onclick: play }, h('span', { 'aria-hidden': 'true' }, '▶ '), 'Play'),
    );
    const note = h(
      'p',
      { class: 'lib-video-note' },
      offline
        ? 'This video needs the internet: it plays from YouTube, and this page has no connection now.'
        : 'It plays from YouTube (youtube-nocookie.com). Nothing loads from YouTube until you press Play.',
    );
    dlg.append(
      h(
        'header',
        { class: 'modal-head' },
        h('h2', { id: 'lib-video-h' }, title),
        h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: close }, '×'),
      ),
      screen,
      note,
      h(
        'p',
        { class: 'lib-video-links' },
        h('a', { href: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, target: '_blank', rel: 'noopener' }, 'Open on YouTube'),
      ),
    );
    document.body.append(dlg);
    dlg.showModal();
  });
}
