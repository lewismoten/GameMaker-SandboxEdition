// Accessible tabs for editor side panels; inactive controls leave the tab order and layout.
import { h } from '../core/ui';
import './panelTabs.css';

let sequence = 0;

interface PanelTab {
  id: string;
  label: string;
  panel: HTMLElement;
}

export function panelTabs(label: string, tabs: PanelTab[], initial?: string, changed?: (id: string) => void): HTMLElement {
  const prefix = `editor-panel-${++sequence}`;
  const bar = h('div', { class: 'panel-tabs-list', role: 'tablist', 'aria-label': label });
  const buttons: HTMLButtonElement[] = [];
  const show = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.panel.hidden = !active;
      buttons[i].setAttribute('aria-selected', String(active));
      buttons[i].tabIndex = active ? 0 : -1;
    });
    if (focus) buttons[index].focus();
    changed?.(tabs[index].id);
  };
  tabs.forEach((tab, i) => {
    const id = `${prefix}-${i}`;
    tab.panel.classList.add('panel-tabs-panel');
    tab.panel.id = `${id}-panel`;
    tab.panel.setAttribute('role', 'tabpanel');
    tab.panel.setAttribute('aria-labelledby', `${id}-tab`);
    const button = h('button', { type: 'button', id: `${id}-tab`, role: 'tab', 'aria-controls': tab.panel.id, onclick: () => show(i) }, tab.label);
    button.addEventListener('keydown', (event) => {
      const next =
        event.key === 'ArrowRight'
          ? (i + 1) % tabs.length
          : event.key === 'ArrowLeft'
            ? (i + tabs.length - 1) % tabs.length
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? tabs.length - 1
                : -1;
      if (next < 0) return;
      event.preventDefault();
      show(next, true);
    });
    buttons.push(button);
    bar.append(button);
  });
  const selected = tabs.findIndex((tab) => tab.id === initial);
  show(selected < 0 ? 0 : selected);
  return h('div', { class: 'panel-tabs' }, bar, ...tabs.map((tab) => tab.panel));
}
