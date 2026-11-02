// The files a web game keeps that a DOS export leaves out (the DOS export and the disk-space tool agree on them).
// Our saved games are JSON, which DOS Game-Maker can't read; SAVNAMES.DAT lists them.
// A .gmx is the editor's companion (project/companion.ts), never one of the game's files.
export const WEB_ONLY = /^(game\d\.sav|savnames\.dat|.*\.gmx)$/i;
