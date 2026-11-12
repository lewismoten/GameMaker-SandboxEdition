// The local restore helper's injectable extractor is used by offline unit tests.
export function restoreBackup(file: string, folder: string, pass: string, extract?: (file: string, folder: string) => Promise<void>): Promise<void>;
