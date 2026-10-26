// THE -= S A N D B O X =- BBS's upload/download ratio, the way boards kept leeches in check:
// one upload buys five downloads (1:5). It is not meant to lock anyone out of the SysOp's own
// files: everything the SysOp uploaded (Sandbox Software games, the utilities, the GIF
// Gallery) is FREE and never counts, every new caller gets ten files on the house, and each
// call earns another file point. The caller's record (calls, files and bytes each way) is the
// board's user file, kept in this browser's localStorage.

/** Downloads one upload pays for. */
export const RATIO = 5;
/** Files a new caller may download before the ratio applies. */
export const NEW_USER_FILES = 10;
/** File points each call adds. */
export const POINTS_PER_CALL = 1;

export interface BbsAccount {
  calls: number;
  /** Every completed download, free or not. */
  dlFiles: number;
  dlBytes: number;
  /** Downloads the ratio counts (not FREE ones). */
  counted: number;
  ulFiles: number;
  ulBytes: number;
  /** Uploads that never made it (somebody always picks up the phone). */
  ulTries: number;
}

export const newAccount = (): BbsAccount => ({ calls: 0, dlFiles: 0, dlBytes: 0, counted: 0, ulFiles: 0, ulBytes: 0, ulTries: 0 });

/** File points left: what a non-FREE download costs one of. */
export function filePoints(a: BbsAccount): number {
  return Math.max(0, NEW_USER_FILES + a.calls * POINTS_PER_CALL + a.ulFiles * RATIO - a.counted);
}

/** May the caller take this file? FREE files always. */
export function mayDownload(a: BbsAccount, free: boolean): boolean {
  return free || filePoints(a) > 0;
}

export function recordDownload(a: BbsAccount, bytes: number, free: boolean): BbsAccount {
  return { ...a, dlFiles: a.dlFiles + 1, dlBytes: a.dlBytes + bytes, counted: a.counted + (free ? 0 : 1) };
}

export function recordUpload(a: BbsAccount, bytes: number): BbsAccount {
  return { ...a, ulFiles: a.ulFiles + 1, ulBytes: a.ulBytes + bytes };
}

/** "1:12" uploads to downloads in files, the way Renegade's stats showed it. */
export function ratioText(a: BbsAccount): string {
  return `${a.ulFiles}:${a.dlFiles}`;
}

/** Bytes as a BBS showed them: "1,234K". */
export function kb(bytes: number): string {
  return `${Math.ceil(bytes / 1024).toLocaleString('en-US')}K`;
}

const KEY = 'gm-bbs-sandbox-user';

/** The stored record, or undefined when there is none (or storage is blocked). */
function loadAccount(): BbsAccount | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as Partial<BbsAccount>;
    const a = newAccount();
    for (const k of Object.keys(a) as (keyof BbsAccount)[]) if (typeof v[k] === 'number' && v[k] >= 0) a[k] = v[k];
    return a;
  } catch {
    return undefined;
  }
}

function saveAccount(a: BbsAccount): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // storage blocked: this visit only
  }
}

let current: BbsAccount | undefined;

/** The caller's record this visit (loaded once; `seed` makes the first one). */
export function account(seed: () => BbsAccount = newAccount): BbsAccount {
  return (current ??= loadAccount() ?? seed());
}

/** Changes the record and stores it. */
export function updateAccount(change: (a: BbsAccount) => BbsAccount): BbsAccount {
  current = change(account());
  saveAccount(current);
  return current;
}
