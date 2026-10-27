// Leaving the Saves & scores panel with unsaved changes asks first, however it is closed: the Close
// button, the dialog's ×, Esc, or Chrome's second Esc that closes a dialog without asking.
import { confirmDialog } from './panelText';

interface CloseGuard {
  /** Closes with `close`, after asking when something is not saved. */
  tryClose(close: (v: undefined) => void): Promise<void>;
  /** Watches the panel's dialog for every other way out. */
  attach(dlg: HTMLDialogElement | null): void;
}

export function closeGuard(anyDirty: () => boolean): CloseGuard {
  let confirmed = false;
  let asking = false;
  async function tryClose(close: (v: undefined) => void) {
    if (asking) return;
    if (anyDirty()) {
      asking = true;
      const leave = await confirmDialog('Leave without saving?', 'Some changes here are not saved yet.', 'Leave', true);
      asking = false;
      if (!leave) return;
    }
    confirmed = true;
    close(undefined);
  }
  const attach = (dlg: HTMLDialogElement | null) => {
    // Esc with unsaved changes asks first
    dlg?.addEventListener(
      'cancel',
      (e) => {
        if (!anyDirty()) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        void tryClose(() => dlg.querySelector<HTMLButtonElement>('.modal-close')?.click());
      },
      true,
    );
    const closeBtn = dlg?.querySelector<HTMLButtonElement>('.modal-close');
    closeBtn?.addEventListener(
      'click',
      (e) => {
        if (!anyDirty() || confirmed) return;
        e.stopImmediatePropagation();
        void tryClose(() => {
          confirmed = true;
          closeBtn.click();
        });
      },
      true,
    );
    // Chrome closes a dialog on a second Esc without a cancel event it lets us stop: open it again and ask
    dlg?.addEventListener('close', () => {
      if (!dlg.isConnected || confirmed) return;
      // shown again under any question already open
      const asked = document.querySelector<HTMLDialogElement>('dialog.modal[open]:not(.sv-dialog)');
      asked?.close();
      dlg.showModal();
      if (asked) asked.showModal();
      void tryClose(() => {
        confirmed = true;
        closeBtn?.click();
      });
    });
  };
  return { tryClose, attach };
}
