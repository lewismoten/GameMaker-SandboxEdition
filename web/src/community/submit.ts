// Generate reviewed Community metadata locally, with links for the creator's pull request.
import { h, modal } from '../editor/core/ui';
import { COMMUNITY_GAMES, parseCommunityGames, type CommunityGame } from './catalog';
import './submit.css';

const REPO = 'https://github.com/lewismoten/GameMaker-SandboxEdition';

export async function submitCommunityGame(): Promise<void> {
  await modal<void>('Add your game', (close) => {
    const fields = {} as Record<keyof CommunityGame, HTMLInputElement | HTMLTextAreaElement>;
    const field = (key: keyof CommunityGame, label: string, limit: number, multiline = false) => {
      const input = multiline ? h('textarea', { rows: 3 }) : h('input', { type: 'text' });
      input.maxLength = limit;
      input.autocomplete = 'off';
      input.spellcheck = !key.toLowerCase().endsWith('url') && key !== 'id';
      fields[key] = input;
      return h('label', null, label, input);
    };
    const title = field('title', 'Game title', 96);
    const id = field('id', 'Short ID (lowercase words with hyphens)', 48);
    let idEdited = false;
    fields.id.addEventListener('input', () => (idEdited = true));
    fields.title.addEventListener('input', () => {
      if (!idEdited)
        fields.id.value = fields.title.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 48)
          .replace(/-$/, '');
    });
    const preview = h('textarea', { rows: 9, readOnly: true, 'aria-label': 'Generated Community entry', spellcheck: false });
    const status = h('p', { class: 'meta', role: 'status' }, 'Fill in the game title, author, play URL, and summary to generate your entry.');
    const copy = h(
      'button',
      {
        type: 'button',
        class: 'primary',
        disabled: true,
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(preview.value);
            status.textContent = 'Entry copied. Add it to the list in your fork, then open a pull request.';
          } catch {
            preview.focus();
            preview.select();
            status.textContent = 'Select and copy the generated entry, then add it to the list in your fork.';
          }
        },
      },
      'Copy entry',
    );
    const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
    const form = h(
      'div',
      { class: 'community-submit stack' },
      h('p', null, 'Keep your game on your website. This form prepares its listing for review; your draft stays in this browser.'),
      title,
      id,
      field('author', 'Author', 80),
      field('url', 'Play URL (HTTPS)', 2048),
      field('summary', 'Short description', 400, true),
      h(
        'details',
        null,
        h('summary', null, 'Optional links'),
        h(
          'div',
          { class: 'stack' },
          field('sourceUrl', 'Source and credits URL (HTTPS)', 2048),
          field('imageUrl', 'Preview image URL (HTTPS, allow cross-origin loading)', 2048),
          field('archiveUrl', 'Permanent game ZIP URL (HTTPS)', 2048),
        ),
      ),
      status,
      h('details', null, h('summary', null, 'Generated entry'), preview),
      h(
        'ol',
        null,
        h('li', null, link(`${REPO}/fork`, 'Fork the repository'), ' if you do not already have a fork.'),
        h(
          'li',
          null,
          link(`${REPO}/edit/master/web/src/community/games.json`, 'Edit the Community list'),
          ' in your fork. Paste the entry inside the array, with a comma between entries.',
        ),
        h('li', null, link(`${REPO}/compare`, 'Open a pull request'), ' from your fork for review.'),
      ),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close() }, 'Close'), copy),
    );
    form.addEventListener('input', () => {
      try {
        const draft = Object.fromEntries(
          Object.entries(fields)
            .filter(([, input]) => input.value.trim())
            .map(([key, input]) => [key, input.value]),
        );
        const [entry] = parseCommunityGames([draft]);
        if (COMMUNITY_GAMES.some((game) => game.id === entry.id)) throw new Error('This ID is already listed. Choose a different short ID.');
        preview.value = JSON.stringify(entry, null, 2);
        copy.disabled = false;
        status.textContent = 'Ready to copy. Follow the links below to propose your listing.';
      } catch (error) {
        preview.value = '';
        copy.disabled = true;
        status.textContent = (error as Error).message.replace(/^Community entry \d+: /, '');
      }
    });
    return form;
  });
}
