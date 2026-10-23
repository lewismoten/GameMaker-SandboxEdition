// The Windows downloads page (#/windows): what SmartScreen's "Windows protected your PC" means
// for the games downloaded as Windows programs (src/export/winApp.ts), why they are not
// code-signed, how to run one the first time, what the program does, and how to remove it.
// Linked from the Download chooser (editor/shell/download.ts) and win/README.md.
// It shares the Mac page's look (macPage.css).
import '../macHelp/macPage.css';
import { h, clear } from '../editor/core/ui';
import { REPO_URL } from '../seo/site';

const section = (id: string, title: string, ...body: Parameters<typeof h>[2][]) =>
  h('section', { 'aria-labelledby': id }, h('h2', { id }, title), ...body);

const kbd = (text: string) => h('kbd', null, text);

/** The page into `el`. */
export function renderWinHelp(el: HTMLElement): void {
  clear(
    el,
    h(
      'main',
      { class: 'mac-help win-help' },
      h('p', { class: 'mac-back' }, h('a', { href: '#/' }, '← All games')),
      h('h1', null, 'Playing the games on Windows'),
      h(
        'p',
        { class: 'lead' },
        'Any game here, including one you made, can be downloaded as a Windows program: one file you double-click to play. It works on Windows 10 and 11. The first time you run it, Windows may show a warning. This page explains why, and how to run it.',
      ),

      section(
        'win-warning',
        'What the warning means',
        h('p', null, 'When you first run the program, Windows may say: “Windows protected your PC. Microsoft Defender SmartScreen prevented an unrecognized app from starting.”'),
        h(
          'p',
          null,
          'SmartScreen shows this for programs that are not ',
          h('em', null, 'code-signed'),
          ', or that few people have downloaded yet. It does not mean any malware was found. It only means that Windows does not know who made the program.',
        ),
        h(
          'p',
          null,
          'Your browser may also ask whether to keep the file, because it is not commonly downloaded. Choose ',
          kbd('Keep'),
          '. (In Edge, open the download’s ',
          kbd('⋯'),
          ' menu, choose ',
          kbd('Keep'),
          ', then ',
          kbd('Show more'),
          ' → ',
          kbd('Keep anyway'),
          '.)',
        ),
      ),

      section(
        'win-why',
        'Why the programs are not signed',
        h(
          'ul',
          null,
          h('li', null, 'Windows only recognizes a program that is signed with a code-signing certificate, which has to be bought and renewed every year.'),
          h('li', null, 'Signing needs the author’s private key, kept on the author’s own computer or a hardware key.'),
          h(
            'li',
            null,
            'These programs are built right in your web browser, from whatever game you pick, including games you made yourself. A website cannot safely hold the author’s private key: anyone could copy it out of the page and sign anything in the author’s name. So a program made in the browser cannot be signed.',
          ),
          h('li', null, 'Signing every game, and every game every visitor makes, is not possible for a free hobby site.'),
        ),
      ),

      section(
        'win-open',
        'Running it the first time',
        h(
          'ol',
          null,
          h('li', null, 'Download the program (.exe). With the .zip, right-click it, choose ', kbd('Extract All…'), ', then open the folder it makes.'),
          h('li', null, 'Double-click the program. If Windows says it protected your PC, click ', kbd('More info'), '.'),
          h('li', null, 'Click ', kbd('Run anyway'), '.'),
        ),
        h('p', null, 'From then on the game opens like any other program. Nothing is installed: keep the file wherever you like, such as your Desktop or Documents folder.'),
        h(
          'p',
          null,
          'The program plays the game in Microsoft Edge WebView2, which comes with Windows 11 and with Windows 10 kept up to date. If a PC does not have it, the program says so and offers Microsoft’s free download.',
        ),
        h(
          'p',
          null,
          'If ',
          h('strong', null, 'Smart App Control'),
          ' is turned on (Windows 11 only; Windows Security → App & browser control), it blocks programs that are not signed, with no ',
          kbd('Run anyway'),
          ' button. On those PCs, play the game here in the browser instead.',
        ),
      ),

      section(
        'win-unblock',
        'Another way: unblock the file',
        h(
          'p',
          null,
          'Windows warns because the downloaded file is marked as coming from the internet. You can remove that mark instead: right-click the program, choose ',
          kbd('Properties'),
          ', tick ',
          kbd('Unblock'),
          ' at the bottom of the General tab, and click ',
          kbd('OK'),
          '. Or, in PowerShell (change the name to your game’s):',
        ),
        h('pre', { class: 'mac-cmd' }, h('code', null, 'Unblock-File "$HOME\\Downloads\\Game.exe"')),
        h('p', { class: 'mac-caution' }, h('strong', null, 'Only do this for programs you trust.'), ' It turns off SmartScreen’s check for that file.'),
      ),

      section(
        'win-what',
        'What the program does, and what it does not',
        h(
          'ul',
          null,
          h('li', null, 'It is a small window that plays the game. Inside is the same player as this website, with the game built in. F11 or Alt+Enter switches to full screen.'),
          h('li', null, 'It installs nothing, changes no Windows settings and never asks for administrator rights.'),
          h('li', null, 'Saved games and high scores stay on your PC. Nothing is uploaded.'),
          h(
            'li',
            null,
            'It loads nothing from the internet. The game and its player are all inside the program, and the program makes no network requests of its own (it even turns off SmartScreen’s address checks for its page, since the page comes from the program itself). Links in it, such as the “Made with Game-Maker” credit or a shareware notice’s web address, open in your web browser. WebView2 is part of Windows, and Microsoft keeps it up to date, as it does Edge.',
          ),
          h(
            'li',
            null,
            'It is open source: the Windows program is a few hundred lines of C in the ',
            h('a', { href: `${REPO_URL}/tree/HEAD/win`, target: '_blank', rel: 'noopener' }, 'win folder of the project’s source code'),
            ', and the code that builds each program in your browser is in the same project.',
          ),
        ),
      ),

      section(
        'win-remove',
        'Removing it',
        h('p', null, 'Delete the program (the .exe file).'),
        h(
          'p',
          null,
          'Its saved games and high scores, and the window’s size and place, are kept in ',
          h('code', null, '%LOCALAPPDATA%\\GameMaker\\<game>'),
          '. Delete that folder too to remove them. To get there, type ',
          h('code', null, '%LOCALAPPDATA%\\GameMaker'),
          ' in File Explorer’s address bar and press Enter.',
        ),
      ),
    ),
  );
}
