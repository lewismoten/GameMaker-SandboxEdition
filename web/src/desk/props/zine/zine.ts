// NO CARRIER #3, a photocopied and stapled hacker zine about the desk PC's
// power tools (zinePages.ts), opened from the toy whistle (whistle.ts): one page at a time,
// flipped with the buttons, the arrow keys or Page Up / Page Down, Esc to put it down. The
// text is real text; the cut-out ransom-note headings are read as their words.
import "./zine.css";
import { h } from "../../../editor/core/ui";
import { ZINE, ZINE_TITLE, type ZinePage } from "./zinePages";

/** A heading cut out of magazines: each letter its own scrap, read as the plain word. */
function ransom(text: string): HTMLElement {
  const looks = ["zr-a", "zr-b", "zr-c", "zr-d", "zr-e"];
  let n = 0;
  const letter = (ch: string) =>
    h("span", { class: `zr ${looks[(n++ * 7 + ch.charCodeAt(0)) % looks.length]}`, style: `--r:${((n * 37) % 11) - 5}deg` }, ch);
  return h(
    "h2",
    { class: "zine-ransom", "aria-label": text },
    // each word kept together on its line
    ...text.split(" ").map((w) => h("span", { class: "zr-word", "aria-hidden": "true" }, ...[...w].map(letter))),
  );
}

function page(p: ZinePage, i: number): HTMLElement {
  return h(
    "article",
    { class: `zine-page${i === 0 ? " cover" : ""}` },
    ransom(p.title),
    ...p.lines.map((l) => h("p", null, l)),
    p.list
      ? h(
          "ul",
          { class: "zine-phones" },
          ...p.list.map(([who, num, what]) => h("li", null, h("b", null, who), " ", h("span", { class: "zine-num" }, num), " ", h("span", { class: "zine-what" }, `— ${what}`))),
        )
      : null,
    ...(p.scrawl ?? []).map((s) => h("p", { class: "zine-scrawl" }, h("span", { class: "zine-arrow", "aria-hidden": "true" }, "➜ "), s)),
    h("p", { class: "zine-folio", "aria-hidden": "true" }, `${i + 1}`),
  );
}

/** Opens the zine over the desk; resolves when it is put down (focus goes back to `from`). */
export function openZine(from?: HTMLElement): Promise<void> {
  return new Promise((done) => {
    let at = 0;
    const sheet = h("div", { class: "zine-sheet", role: "region", "aria-live": "polite", "aria-label": "Page" });
    const counter = h("span", { class: "zine-count" });
    const prev = h("button", { class: "zine-btn", type: "button", onclick: () => go(at - 1) }, "◀ Back");
    const next = h("button", { class: "zine-btn", type: "button", onclick: () => go(at + 1) }, "Next ▶");
    const shut = h("button", { class: "zine-btn zine-close", type: "button", onclick: () => close() }, "Close (Esc)");
    const overlay = h(
      "div",
      { class: "desk-overlay zine-overlay", role: "dialog", "aria-modal": "true", "aria-label": `${ZINE_TITLE}, issue 3` },
      h("div", { class: "zine-staples", "aria-hidden": "true" }),
      sheet,
      h("div", { class: "zine-bar" }, prev, counter, next, shut),
    );
    const go = (n: number) => {
      at = Math.max(0, Math.min(ZINE.length - 1, n));
      sheet.replaceChildren(page(ZINE[at], at));
      sheet.setAttribute("aria-label", `Page ${at + 1} of ${ZINE.length}`);
      counter.textContent = `${at + 1} / ${ZINE.length}`;
      prev.toggleAttribute("disabled", at === 0);
      next.toggleAttribute("disabled", at === ZINE.length - 1);
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.key === "Escape") return e.preventDefault(), close();
      if (e.key === "ArrowRight" || e.key === "PageDown") return e.preventDefault(), go(at + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") return e.preventDefault(), go(at - 1);
      if (e.key === "Tab") {
        // Tab stays on the zine's own buttons
        const stops = [prev, next, shut].filter((b) => !b.hasAttribute("disabled"));
        const i = stops.indexOf(document.activeElement as HTMLButtonElement);
        e.preventDefault();
        stops[(i + (e.shiftKey ? stops.length - 1 : 1)) % stops.length]?.focus();
      }
    };
    const close = () => {
      window.removeEventListener("keydown", onKey, true);
      overlay.remove();
      from?.focus();
      done();
    };
    overlay.addEventListener("click", (e) => e.target === overlay && close());
    window.addEventListener("keydown", onKey, true);
    go(0);
    document.body.append(overlay);
    next.focus();
  });
}
