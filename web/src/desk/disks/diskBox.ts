// The disk box: flip through 3.5" floppies and put one in drive A:.
import "./diskBox.css";
import { h, clear } from "../../editor/core/ui";
import { diskCount, type Disk } from "../../retro/dos/disks";
import { creditLine } from "../../project/files";
import { gameDisks } from "../../project/diskFacts";
import { printedDiskLabel } from "./diskLabel";
import { rsdDiskLabel } from "./rsdLabel";

/** How many disks it takes: an original ships with the DOS player too (as its box and every catalog say). */
export function disksIn(d: Disk): number {
  return d.kind === "original" && d.catalog ? gameDisks(d.catalog) : diskCount(d.bytes);
}

export type DiskAction = "play" | "design" | "modern";

/** A printed label, as a shareware publisher had them made (see diskLabel.ts). */
function printedLabel(d: Disk, n: number): HTMLElement {
  const g = d.catalog!;
  // © and the year kept together (a no-break space), never split across lines
  return printedDiskLabel(
    g,
    `©\u00a0${g.year ?? 1995}`,
    undefined,
    diskTag(d, n),
  );
}

/** When a disk of the user's was last saved: "Oct 21, 2026, 3:42 PM". */
function savedAt(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Disk 2" in the title area of a game that takes more than one disk (empty otherwise). */
function diskTag(d: Disk, n: number): string {
  return disksIn(d) > 1 ? `Disk\u00a0${n}` : "";
}

/** A disk; `n` numbers the later disks of a game that takes more than one. */
export function floppyElement(d: Disk, small = false, n = 1): HTMLElement {
  const count = disksIn(d);
  const label =
    d.kind === "blank" ? "blank — for Utilities ▸ Transfer" : d.title;
  const g = d.catalog;
  // Hand-written like a real label: who made it, when, and what it cost.
  const sub =
    d.kind === "project"
      ? ["my game", d.updated ? savedAt(d.updated) : ""]
          .filter(Boolean)
          .join("\n")
      : d.kind === "blank"
        ? ""
        : [
            g?.author ?? g?.company,
            [g?.year, g?.price].filter(Boolean).join("  "),
          ]
            .filter(Boolean)
            .join("\n");
  return h(
    "div",
    {
      class: "floppy",
      style: `--body:${d.color};--stripe:${d.stripe}`,
      dataset: {
        kind: d.kind,
        protected: String(d.writeProtected),
        density: d.density,
      },
      "aria-hidden": small ? "true" : undefined,
    },
    h("div", { class: "shutter" }),
    d.kind === "original"
      ? printedLabel(d, n)
      : d.kind === "rsd" || d.kind === "gameware"
        ? // the CD's disks have printed labels; hand-written ones (with a scribbled note) are the user's
          rsdDiskLabel(
            g,
            label,
            diskTag(d, n),
            d.kind === "gameware"
              ? { name: g?.company ?? g?.author ?? "CD Library", band: d.color }
              : undefined,
          )
        : h(
            "div",
            { class: "label" },
            h(
              "span",
              { class: "hand-title" },
              h("span", null, label),
              count > 1 ? h("span", { class: "hand-disk" }, `Disk ${n}`) : null,
            ),
            h("small", null, sub),
            d.note ? h("span", { class: "marker-note" }, d.note) : null,
          ),
    h("div", { class: "wp" }),
    d.density === "HD" ? h("div", { class: "density-hole" }) : null,
    d.density === "HD" ? h("div", { class: "hd" }, "HD") : null,
  );
}

function sizeText(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / 1_048_576;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** A line about the disk: what it is, who made it, its size. */
export function diskFacts(d: Disk): string {
  return [
    d.kind === "rsd"
      ? "One of the games RSD made with Game-Maker"
      : d.kind === "original"
        ? "Shareware from Sandbox Software, our own games: play them or open them in Game-Maker"
        : d.kind === "gameware"
          ? "Free gameware from the Game-Maker CD"
          : d.kind === "project"
            ? "Your game (also in C:\\GM on the hard disk)"
            : "A blank disk: Game-Maker’s Utilities ▸ Transfer copies a game onto it",
    d.catalog ? creditLine(d.catalog) : "",
    sizeText(d.bytes),
    disksIn(d) > 1 ? `${disksIn(d)} disks: disk 1 goes in A:` : "",
    d.updated ? `saved ${savedAt(d.updated)}` : "",
    d.writeProtected ? "write-protected" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Opens the disk box: disks stand in a row, shutters down and labels up, and you look
 * down the row from the front. Scroll to flip through; click one to put it in drive A:.
 * Resolves when closed.
 */
export function openDiskBox(
  disks: Disk[],
  startId: string | undefined,
  onPick: (d: Disk) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let index = Math.max(
      0,
      disks.findIndex((d) => d.id === startId),
    );
    // two windows: the disks that came with the site, and the user's own (plus a blank one)
    const mine = (d: Disk) => d.kind === "project" || d.kind === "blank";
    const rows = {
      site: h("div", {
        class: "disk-row",
        role: "listbox",
        "aria-label": "Disks from the CD and Sandbox Software",
      }),
      mine: h("div", {
        class: "disk-row",
        role: "listbox",
        "aria-label": "Your disks",
      }),
    };
    const info = h("div", { class: "flip-info", "aria-live": "polite" });
    const items = disks.map((d, i) => {
      const el = floppyElement(d);
      el.setAttribute("role", "option");
      el.tabIndex = -1;
      el.title = `Put ${d.kind === "blank" ? "a blank disk" : d.title} in drive A:`;
      el.addEventListener("pointerenter", () => select(i, false));
      el.addEventListener("click", () => pick(i));
      // a game on several disks: the rest stand right behind disk 1 (it's the one you boot)
      for (let n = disksIn(d); n > 1; n--) {
        const spare = floppyElement(d, true, n);
        spare.classList.add("spare");
        spare.addEventListener("click", () => pick(i));
        rows[mine(d) ? "mine" : "site"].append(spare);
      }
      rows[mine(d) ? "mine" : "site"].append(el);
      return el;
    });

    const close = () => {
      window.removeEventListener("keydown", onKey, true);
      overlay.remove();
      resolve();
    };
    const pick = (i: number) => {
      close();
      onPick(disks[i]);
    };

    function select(i: number, scroll = true): void {
      index = Math.max(0, Math.min(disks.length - 1, i));
      items.forEach((el, j) =>
        el.setAttribute("aria-selected", String(j === index)),
      );
      if (scroll)
        items[index].scrollIntoView({ block: "nearest", behavior: "smooth" });
      const d = disks[index];
      clear(
        info,
        h("h2", null, d.kind === "blank" ? "Blank disk" : d.title),
        h("p", null, diskFacts(d)),
        h(
          "p",
          { class: "hint" },
          "Click a disk to put it in drive A: · ←/→ switch boxes · ↑/↓ pick",
        ),
      );
    }

    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      const side = (i: number) => mine(disks[i]);
      if (e.key === "ArrowUp" && index > 0 && side(index - 1) === side(index))
        select(index - 1);
      else if (
        e.key === "ArrowDown" &&
        index < disks.length - 1 &&
        side(index + 1) === side(index)
      )
        select(index + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // the other window: its first disk
        const want = e.key === "ArrowRight";
        const j = disks.findIndex((d) => mine(d) === want);
        if (j >= 0) select(j);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        /* at the end of a window */
      } else if (e.key === "Enter") pick(index);
      else if (e.key === "Escape") close();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey, true);

    const overlay = h(
      "div",
      { class: "desk-overlay", role: "dialog", "aria-label": "Disk box" },
      h("button", { class: "close", onclick: close }, "Close (Esc)"),
      h(
        "div",
        { class: "disk-cases" },
        h(
          "section",
          { class: "disk-col" },
          h("h3", null, "From the CD & Sandbox Software"),
          h("div", { class: "disk-case" }, rows.site),
        ),
        h(
          "section",
          { class: "disk-col mine" },
          h("h3", null, "Your disks"),
          h("div", { class: "disk-case" }, rows.mine),
        ),
      ),
      info,
    );
    overlay.addEventListener("click", (e) => e.target === overlay && close());
    document.body.append(overlay);
    select(index);
  });
}
