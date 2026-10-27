// "Remote Ollama over Tailscale": the AI setup's help note for an Ollama server on another
// computer. It sets OLLAMA_HOST and OLLAMA_ORIGINS (macOS, Windows, Linux), says which address to
// use from an http page (the tailnet name or 100.x address) and from an https one (tailscale
// serve), and names the browser's local-network prompt. web/scripts/mcp/README.md says the same.
import { h } from '../../editor/core/ui';

const code = (t: string) => h('pre', { class: 'ai-help-code' }, h('code', null, t));

/** The note, with this page's origin filled in. */
export function ollamaHelp(origin: string): HTMLElement {
  const https = origin.startsWith('https:');
  return h(
    'details',
    { class: 'ai-help' },
    h('summary', null, 'Remote Ollama over Tailscale'),
    h(
      'ol',
      null,
      h(
        'li',
        null,
        h('strong', null, 'On the Ollama computer, let Ollama take requests from other computers and from this page. '),
        'Set two environment variables, then restart Ollama:',
        h(
          'ul',
          null,
          h('li', null, h('code', null, 'OLLAMA_HOST'), ' = ', h('code', null, '0.0.0.0:11434')),
          h('li', null, h('code', null, 'OLLAMA_ORIGINS'), ' = ', h('code', null, origin)),
        ),
        h('p', null, 'For more than one page, separate them with commas. Pages on localhost are already allowed.'),
        h('p', null, h('b', null, 'macOS'), ' (the Ollama app): in Terminal, then quit Ollama from the menu bar and open it again:'),
        code(`launchctl setenv OLLAMA_HOST "0.0.0.0:11434"\nlaunchctl setenv OLLAMA_ORIGINS "${origin}"`),
        h('p', null, 'These last until the Mac restarts; run them again after one.'),
        h(
          'p',
          null,
          h('b', null, 'Windows'),
          ': quit Ollama from the taskbar. In Settings, search for “environment variables”, choose Edit environment variables for your account, and add both. Or in PowerShell:',
        ),
        code(`setx OLLAMA_HOST "0.0.0.0:11434"\nsetx OLLAMA_ORIGINS "${origin}"`),
        h('p', null, 'Then start Ollama again.'),
        h('p', null, h('b', null, 'Linux'), ' (systemd): run ', h('code', null, 'sudo systemctl edit ollama.service'), ', add these lines, and restart:'),
        code(`[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\nEnvironment="OLLAMA_ORIGINS=${origin}"`),
        code('sudo systemctl daemon-reload\nsudo systemctl restart ollama'),
        h(
          'p',
          { class: 'hint' },
          '0.0.0.0 lets every network that computer is on reach Ollama, and Ollama has no password. Do this only on networks you trust, or let its firewall allow only Tailscale.',
        ),
      ),
      h(
        'li',
        null,
        h('strong', null, 'Turn on Tailscale on both computers. '),
        'Run ',
        h('code', null, 'tailscale status'),
        ' to see the Ollama computer’s name and its 100.x address.',
      ),
      h(
        'li',
        null,
        h('strong', null, 'Choose the address. '),
        h(
          'ul',
          null,
          h(
            'li',
            null,
            'When the editor is on http (localhost, ',
            h('code', null, 'npm run dev'),
            '): use ',
            h('code', null, 'http://<machine>:11434'),
            ' (its tailnet name) or ',
            h('code', null, 'http://100.x.y.z:11434'),
            '.',
          ),
          h(
            'li',
            null,
            'When the editor is on https',
            https ? ' (as it is now)' : '',
            ', the browser blocks http addresses. On the Ollama computer run ',
            h('code', null, 'tailscale serve --bg 11434'),
            ', then use ',
            h('code', null, 'https://<machine>.<tailnet>.ts.net'),
            ' with no port. ',
            h('code', null, 'tailscale serve status'),
            ' shows the address, and ',
            h('code', null, 'tailscale serve --https=443 off'),
            ' stops it. The first time, Tailscale may ask you to turn on HTTPS certificates for your tailnet.',
          ),
        ),
      ),
      h('li', null, h('strong', null, 'Press Test connection. '), 'If the browser asks to let this site reach devices on your network, allow it.'),
    ),
  );
}
