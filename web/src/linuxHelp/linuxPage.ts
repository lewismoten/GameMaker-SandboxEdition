// The Linux downloads page (#/linux): how to extract and play a game downloaded for Linux
// (src/export/linuxApp.ts), the WebKitGTK package it needs on the common distributions, the
// web browser fallback, adding it to the applications menu and removing it, and what the
// program does. Linked from the Download chooser (editor/shell/download.ts)
// and linux/README.md. It shares the Mac page's look (macPage.css).
import '../macHelp/macPage.css';
import { h, clear } from '../editor/core/ui';
import { pageToc } from '../pageToc';
import { tally } from '../achievements';
import { REPO_URL } from '../seo/site';

const section = (id: string, title: string, ...body: Parameters<typeof h>[2][]) =>
  h('section', { 'aria-labelledby': id }, h('h2', { id }, title), ...body);

const kbd = (text: string) => h('kbd', null, text);
const cmd = (text: string) => h('pre', { class: 'mac-cmd' }, h('code', null, text));

/** The page into `el`. */
export function renderLinuxHelp(el: HTMLElement): void {
  tally('help-all', 'linux');
  clear(
    el,
    h(
      'main',
      { class: 'mac-help linux-help' },
      h('p', { class: 'mac-back' }, h('a', { href: '#/' }, '← All games')),
      h('h1', null, 'Playing the games on Linux'),
      h(
        'p',
        { class: 'lead' },
        'Any game here, including one you made, can be downloaded for Linux: a folder that plays the game in a window of its own, on x86_64 and Arm (aarch64) PCs. There is nothing to sign or approve; you only extract it and run it.',
      ),

      section(
        'linux-play',
        'Playing it',
        h(
          'ol',
          null,
          h('li', null, 'Extract the downloaded .tar.gz: double-click it and choose ', kbd('Extract'), ', or right-click it and choose ', kbd('Extract Here'), '. You get a folder named after the game.'),
          h(
            'li',
            null,
            'Open the folder and double-click ',
            kbd('play.sh'),
            '. If your file manager asks, choose ',
            kbd('Run'),
            '. Some file managers open scripts as text instead: right-click ',
            kbd('play.sh'),
            ', choose ',
            kbd('Properties'),
            ' and tick ',
            kbd('Allow executing file as program'),
            ' (or set the file manager to run executable text files).',
          ),
        ),
        h('p', null, 'Or in a terminal:'),
        cmd('tar xzf "Game.tar.gz"\ncd "Game"\n./play.sh'),
        h('p', null, 'F11 switches to full screen; Ctrl+R restarts the game.'),
      ),

      section(
        'linux-needs',
        'What it needs',
        h(
          'p',
          null,
          'The window uses WebKitGTK, the web engine of GNOME’s browser, which most desktops already have. If yours does not, install it:',
        ),
        h(
          'ul',
          null,
          h('li', null, h('strong', null, 'Debian, Ubuntu, Linux Mint: '), h('code', null, 'sudo apt install libwebkit2gtk-4.1-0')),
          h('li', null, h('strong', null, 'Fedora: '), h('code', null, 'sudo dnf install webkit2gtk4.1')),
          h('li', null, h('strong', null, 'Arch, Manjaro: '), h('code', null, 'sudo pacman -S webkit2gtk-4.1')),
        ),
        h(
          'p',
          null,
          'Older systems with only WebKitGTK 4.0 (',
          h('code', null, 'libwebkit2gtk-4.0-37'),
          ') work too. Without WebKitGTK, ',
          kbd('play.sh'),
          ' opens the game in your web browser instead, with a short notice; the game is the same, and its saved games are kept by the browser.',
        ),
      ),

      section(
        'linux-install',
        'Adding it to your applications menu',
        h(
          'p',
          null,
          'Run ',
          kbd('install.sh'),
          ' in the folder. It copies the game to ',
          h('code', null, '~/.local/share/GameMaker/<game>/app'),
          ' and adds it to your applications menu (under Games), with its icon. It changes nothing outside your home folder and needs no password. After that you can delete the downloaded folder.',
        ),
      ),

      section(
        'linux-what',
        'What the program does, and what it does not',
        h(
          'ul',
          null,
          h('li', null, 'It is a small window that plays the game. Inside is the same player as this website, with the game in the folder beside it.'),
          h('li', null, 'Saved games and high scores stay on your PC, in ', h('code', null, '~/.local/share/GameMaker/<game>'), '. Nothing is uploaded.'),
          h(
            'li',
            null,
            'It loads nothing from the internet. The game and its player are all in the folder, and the program makes no network requests of its own. Links in it, such as the “Made with Game-Maker” credit or a shareware notice’s web address, open in your web browser.',
          ),
          h(
            'li',
            null,
            'It is open source: the Linux program is a couple of hundred lines of C in the ',
            h('a', { href: `${REPO_URL}/tree/HEAD/linux`, target: '_blank', rel: 'noopener' }, 'linux folder of the project’s source code'),
            ', and the scripts are plain text you can read in the folder.',
          ),
        ),
      ),

      section(
        'linux-remove',
        'Removing it',
        h('p', null, 'If you did not install it, delete the folder. If you did, run its uninstaller, which takes it out of the menu:'),
        cmd('~/.local/share/GameMaker/<game>/app/uninstall.sh'),
        h(
          'p',
          null,
          'Saved games and high scores stay in ',
          h('code', null, '~/.local/share/GameMaker/<game>'),
          ' in case you play again; add ',
          h('code', null, '--all'),
          ' to remove them too, or delete that folder.',
        ),
      ),
    ),
  );
  pageToc(el.querySelector('main')!);
}
