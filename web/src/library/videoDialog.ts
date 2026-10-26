// A Library video's player: a dialog showing the video's picture with a Play button, so nothing
// comes from YouTube until the visitor presses it. Play puts YouTube's player in its place,
// from youtube-nocookie.com; a chapter, or a time in the transcript, does the same from that
// time (reloading the player if it is showing). Below it, scrolling on their own, are the
// video's description, its chapters and a Transcript disclosure that fetches the transcript
// (public/videos/<id>.transcript.json) when first opened; all of these are the site's own files,
// so they work offline. Closing (the button, or Esc) removes the dialog and the player with it,
// which stops the video. Without a connection it says the video needs the internet.
import './videoDialog.css';
import { h } from '../editor/core/ui';
import { hms } from './shelf';
import { videoById } from './videos';

/** A paragraph of text with its web addresses as links. */
function linked(text: string): HTMLParagraphElement {
  return h(
    'p',
    null,
    text.split(/(https?:\/\/\S+)/).map((part, i) => (i % 2 ? h('a', { href: part, target: '_blank', rel: 'noopener' }, part) : part)),
  );
}

/** Opens the video `id` (YouTube's id) titled `title`, with its picture `picture`; settles once it is closed. */
export function openVideo(id: string, title: string, picture: string | undefined): Promise<void> {
  return new Promise((resolve) => {
    const video = videoById(id);
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
    /** Shows YouTube's player in place of the picture, playing from `at` seconds. */
    const play = (at = 0, focus = true) => {
      const start = at > 0 ? `&start=${Math.floor(at)}` : '';
      const player = h('iframe', {
        class: 'lib-video-player',
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1${start}`,
        title: `${title} (YouTube video player)`,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
        referrerpolicy: 'strict-origin-when-cross-origin',
      });
      screen.replaceChildren(player);
      note.textContent = 'Playing from YouTube (youtube-nocookie.com).';
      if (focus) player.focus();
    };
    /** A button that plays from `at`: a chapter's (with its title) or a transcript paragraph's. */
    const timeButton = (at: number, label?: string) =>
      h(
        'button',
        {
          type: 'button',
          class: 'lib-video-time',
          'aria-label': label ? undefined : `Play from ${hms(at)}`,
          onclick: () => play(at, false),
        },
        h('span', { class: 'lib-video-at' }, hms(at)),
        label ? h('span', null, label) : null,
      );
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const screen = h(
      'div',
      { class: 'lib-video-screen' },
      picture ? h('img', { class: 'lib-video-poster', src: picture, alt: '' }) : null,
      h(
        'button',
        { type: 'button', class: 'lib-video-play primary', autofocus: true, onclick: () => play() },
        h('span', { 'aria-hidden': 'true' }, '▶ '),
        'Play',
      ),
    );
    const note = h(
      'p',
      { class: 'lib-video-note' },
      offline
        ? 'This video needs the internet: it plays from YouTube, and this page has no connection now.'
        : 'It plays from YouTube (youtube-nocookie.com). Nothing loads from YouTube until you press Play, a chapter or a time.',
    );

    // the transcript: fetched the first time it is opened
    const words = h('div', { class: 'lib-video-transcript', 'aria-live': 'polite' });
    const transcript = h(
      'details',
      { class: 'lib-video-section' },
      h('summary', null, 'Transcript'),
      h('p', { class: 'lib-video-source' }, 'Transcript from YouTube’s automatic captions, lightly cleaned.'),
      words,
    );
    let loaded = false;
    transcript.addEventListener('toggle', () => {
      if (!transcript.open || loaded) return;
      loaded = true;
      words.textContent = 'Loading…';
      fetch(`./videos/${encodeURIComponent(id)}.transcript.json`)
        .then((r) => (r.ok ? (r.json() as Promise<{ t: number; text: string }[]>) : Promise.reject(new Error(String(r.status)))))
        .then((paras) => words.replaceChildren(...paras.map((p) => h('p', null, timeButton(p.t), ' ', p.text))))
        .catch(() => {
          loaded = false;
          words.textContent = 'The transcript could not be loaded.';
        });
    });

    const more = h(
      'div',
      { class: 'lib-video-more', tabindex: 0, role: 'region', 'aria-label': 'About this video' },
      video?.about.length ? h('section', { class: 'lib-video-about' }, video.about.map(linked)) : null,
      video?.chapters?.length
        ? h(
            'section',
            { class: 'lib-video-section', 'aria-labelledby': 'lib-video-ch' },
            h('h3', { id: 'lib-video-ch' }, 'Chapters'),
            h(
              'ol',
              { class: 'lib-video-chapters' },
              video.chapters.map(([at, name]) => h('li', null, timeButton(at, name))),
            ),
          )
        : null,
      transcript,
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
      more,
    );
    document.body.append(dlg);
    dlg.showModal();
  });
}
