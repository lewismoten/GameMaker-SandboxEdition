// The Mac downloads page (#/mac): what macOS's "Apple could not verify…" warning means for
// the games downloaded as Mac apps (src/export/macApp.ts), why they are not notarized, how to
// open one the first time, what the app does, and how to remove it. Linked from the
// Download for Mac dialog (editor/shell/macDownload.ts) and mac/README.md.
import './macPage.css';
import { h, clear } from '../editor/core/ui';
import { REPO_URL } from '../seo/site';

const section = (id: string, title: string, ...body: Parameters<typeof h>[2][]) =>
  h('section', { 'aria-labelledby': id }, h('h2', { id }, title), ...body);

const kbd = (text: string) => h('kbd', null, text);

/** The page into `el`. */
export function renderMacHelp(el: HTMLElement): void {
  clear(
    el,
    h(
      'main',
      { class: 'mac-help' },
      h('p', { class: 'mac-back' }, h('a', { href: '#/' }, '← All games')),
      h('h1', null, 'Playing the games on a Mac'),
      h(
        'p',
        { class: 'lead' },
        'Any game here, including one you made, can be downloaded as a Mac app. It works on Apple silicon and Intel Macs with macOS 11 Big Sur or later. The first time you open it, macOS shows a warning. This page explains why, and how to open it.',
      ),

      section(
        'mac-warning',
        'What the warning means',
        h(
          'p',
          null,
          'When you first open the app, macOS says something like: “Apple could not verify “Game” is free of malware that may harm your Mac or compromise your privacy.”',
        ),
        h(
          'p',
          null,
          'macOS shows this for every app that Apple has not ',
          h('em', null, 'notarized'),
          ' (checked and approved). It does not mean any malware was found. It only means that Apple has not looked at this app.',
        ),
      ),

      section(
        'mac-why',
        'Why the apps are not notarized',
        h(
          'ul',
          null,
          h(
            'li',
            null,
            'Apple only trusts an app that is signed with a paid Apple Developer ID (the Apple Developer Program costs $99 a year) and then sent to Apple’s notary service to be scanned.',
          ),
          h('li', null, 'That signing and sending has to happen on the author’s own Mac, using their private signing key and their Apple account.'),
          h(
            'li',
            null,
            'These apps are built right in your web browser, from whatever game you pick, including games you made yourself. A website cannot safely hold the author’s private key: anyone could copy it out of the page and sign anything in the author’s name. And a browser cannot reach Apple’s notary service. So an app made in the browser can only carry an “ad-hoc” signature. That signature shows the app has not been changed since it was built, but Apple does not recognize it.',
          ),
          h('li', null, 'Notarizing every game, and every game every visitor makes, is not possible for a free hobby site.'),
        ),
      ),

      section(
        'mac-open',
        'Opening it the first time',
        h('h3', null, 'macOS 15 Sequoia and later'),
        h(
          'ol',
          null,
          h('li', null, 'Open the disk image (.dmg) and drag the game onto Applications. With the .zip, double-click it and move the app into Applications.'),
          h('li', null, 'Open the game. When macOS says it could not verify it, click ', kbd('Done'), '.'),
          h(
            'li',
            null,
            'Open ',
            h('strong', null, 'System Settings → Privacy & Security'),
            ' and scroll down to Security. Next to ““Game” was blocked to protect your Mac”, click ',
            kbd('Open Anyway'),
            '. The button is there for about an hour after you tried to open the game.',
          ),
          h('li', null, 'macOS asks once more: click ', kbd('Open Anyway'), ' and enter your password (or use Touch ID).'),
        ),
        h(
          'p',
          null,
          'From then on the game opens like any other app. macOS 15 and later no longer let you skip these steps by Control-clicking the app and choosing Open.',
        ),
        h('h3', null, 'macOS 14 Sonoma and earlier'),
        h(
          'ol',
          null,
          h('li', null, 'Drag the game into Applications as above.'),
          h('li', null, 'Control-click (or right-click) the app and choose ', kbd('Open'), '.'),
          h('li', null, 'In the warning, click ', kbd('Open'), '. (System Settings → Privacy & Security → Open Anyway works here too.)'),
        ),
      ),

      section(
        'mac-terminal',
        'For advanced users: the Terminal',
        h(
          'p',
          null,
          'macOS warns because the downloaded app is marked as “quarantined”. You can remove that mark in Terminal instead (change the name to your game’s):',
        ),
        h('pre', { class: 'mac-cmd' }, h('code', null, 'xattr -dr com.apple.quarantine "/Applications/Game.app"')),
        h('p', { class: 'mac-caution' }, h('strong', null, 'Only do this for apps you trust.'), ' It turns off macOS’s first-open check for that app.'),
      ),

      section(
        'mac-what',
        'What the app does, and what it does not',
        h(
          'ul',
          null,
          h('li', null, 'It is a small window that plays the game. Inside is the same player as this website, with the game built in.'),
          h('li', null, 'Saved games and high scores stay on your Mac. Nothing is uploaded.'),
          h(
            'li',
            null,
            'It loads nothing from the internet. The game and its player are all inside the app, and the app makes no network requests of its own. Links in it, such as the “Made with Game-Maker” credit or a shareware notice’s web address, open in your web browser.',
          ),
          h(
            'li',
            null,
            'It is open source: the Mac program is a few hundred lines of Swift in the ',
            h('a', { href: `${REPO_URL}/tree/HEAD/mac`, target: '_blank', rel: 'noopener' }, 'mac folder of the project’s source code'),
            ', and the code that builds each app in your browser is in the same project.',
          ),
        ),
      ),

      section(
        'mac-remove',
        'Removing it',
        h('p', null, 'Drag the app from Applications to the Trash.'),
        h(
          'p',
          null,
          'Its saved games and high scores are kept in your Library folder, in ',
          h('code', null, '~/Library/WebKit/com.lewismoten.gamemaker.<game>'),
          ' (the window’s size and place in ',
          h('code', null, '~/Library/Preferences/com.lewismoten.gamemaker.<game>.plist'),
          '). Delete that folder too to remove them. To get there, in the Finder choose Go → Go to Folder and type ',
          h('code', null, '~/Library/WebKit'),
          '.',
        ),
      ),
    ),
  );
}
