// The BBSes' local callback-verified handles; only fictional 555-01xx home lines are kept.
export type SignupBoard = 'sandbox' | 'sofa';
export interface SignupAccount {
  board: SignupBoard;
  handle: string;
  phone: string;
  verifiedAt: number;
}
const KEY = 'gm-bbs-signups';

export function signupHandle(text: string): string | undefined {
  const handle = text.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9 _-]{0,23}$/.test(handle) && !['NEW', 'GUEST'].includes(handle) ? handle : undefined;
}
export function signupPhone(text: string): string | undefined {
  if (!/^[\d ()+-]+$/.test(text)) return undefined;
  const digits = text.replace(/\D/g, '').replace(/^(?:1412|412)(?=55501\d\d$)/, '');
  return /^55501\d\d$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3)}` : undefined;
}

/** Storage is re-read after backup/restore; blocked writes still work for this visit. */
export class SignupAccounts {
  private raw: string | null | undefined;
  private records: SignupAccount[] = [];
  constructor(private readonly storage: () => Pick<Storage, 'getItem' | 'setItem'> = () => localStorage) {}

  private read(): SignupAccount[] {
    try {
      const raw = this.storage().getItem(KEY);
      if (raw !== this.raw) {
        this.raw = raw;
        this.records = [];
        const list = JSON.parse(raw ?? '[]') as unknown;
        if (Array.isArray(list))
          for (const entry of list as Partial<SignupAccount>[]) {
            if (!entry || !['sandbox', 'sofa'].includes(entry.board ?? '') || typeof entry.handle !== 'string' || typeof entry.phone !== 'string') continue;
            if (
              signupHandle(entry.handle) !== entry.handle ||
              signupPhone(entry.phone) !== entry.phone ||
              !Number.isFinite(entry.verifiedAt) ||
              entry.verifiedAt! < 0
            )
              continue;
            this.records.push({ board: entry.board!, handle: entry.handle, phone: entry.phone, verifiedAt: entry.verifiedAt! });
          }
      }
    } catch {
      // Storage may be refused; the current visit's completed callbacks remain usable.
    }
    return this.records;
  }
  find(board: SignupBoard, handle: string): SignupAccount | undefined {
    const found = this.read().find((r) => r.board === board && r.handle === signupHandle(handle));
    return found && { ...found };
  }
  complete(board: SignupBoard, handle: string, phone: string, verifiedAt = Date.now()): void {
    const clean = signupHandle(handle),
      number = signupPhone(phone);
    if (!['sandbox', 'sofa'].includes(board) || !clean || !number || !Number.isFinite(verifiedAt) || verifiedAt < 0)
      throw new Error('Invalid callback account');
    this.records = [...this.read().filter((r) => r.board !== board || r.handle !== clean), { board, handle: clean, phone: number, verifiedAt }];
    try {
      const raw = JSON.stringify(this.records);
      this.storage().setItem(KEY, raw);
      this.raw = raw;
    } catch {
      // The unchanged stored text lets read() retain this in-memory completion after quota failure.
    }
  }
}
export const signupAccounts = new SignupAccounts();
